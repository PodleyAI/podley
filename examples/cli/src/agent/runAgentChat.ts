/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentApprovalMode, ChatMessage, ToolDefinition } from "@workglow/ai";
import { AgentTask } from "@workglow/ai";
import type { StreamEvent } from "@workglow/task-graph";
import { globalServiceRegistry, HUMAN_CONNECTOR, ServiceRegistry } from "@workglow/util";
import { createInterface } from "node:readline/promises";
import { formatError } from "../util";
import { PromptHumanConnector } from "../ui/PromptHumanConnector";
import { CHAT_HELP_LINES, classifyChatLine } from "./chatCommands";
import { createChatTranscript } from "./chatTranscript";

/**
 * The session's two ends, injectable so the loop can be driven without a
 * terminal. Defaults are readline and stdout.
 */
export interface AgentChatIo {
  /** One line from the person, or `undefined` at end of input. */
  readonly ask: (prompt: string) => Promise<string | undefined>;
  readonly write: (text: string) => void;
}

export interface AgentChatOptions {
  readonly model: string;
  readonly tools: readonly ToolDefinition[];
  readonly systemPrompt: string | undefined;
  readonly maxRounds: number | undefined;
  readonly approval: AgentApprovalMode;
}

/**
 * One question, on a readline interface that exists only for the length of it.
 *
 * A long-lived interface keeps listeners on stdin, and the approval prompts
 * this session raises render their own Ink app over the same terminal — two
 * readers of one stdin is a session that drops keystrokes into whichever
 * happens to be listening. Creating and closing per question means nothing but
 * the prompt of the moment ever holds it.
 */
async function askLine(prompt: string): Promise<string | undefined> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(prompt);
  } catch {
    // The interface closes on EOF (Ctrl-D), which rejects the pending question.
    return undefined;
  } finally {
    rl.close();
  }
}

/** A child of the host's registry, so the chat prompts without the Ink run UI. */
function chatRegistry(parent: ServiceRegistry): ServiceRegistry {
  const registry = new ServiceRegistry(parent.container.createChildContainer());
  registry.registerInstance(HUMAN_CONNECTOR, new PromptHumanConnector());
  return registry;
}

/**
 * The chat loop: read a line, run one {@link AgentTask} turn, carry the
 * conversation forward.
 *
 * `messages` is this loop's only state — the task takes the history in and
 * hands it back with the turn appended, so nothing here has to know what a
 * tool result or a tool-call id looks like.
 */
export async function runAgentChat(options: AgentChatOptions, io?: AgentChatIo): Promise<void> {
  const ask = io?.ask ?? askLine;
  const transcript = createChatTranscript(io?.write ?? ((text) => void process.stdout.write(text)));
  const registry = chatRegistry(globalServiceRegistry);
  let messages: ChatMessage[] = [];

  transcript.note(
    options.tools.length === 0
      ? "No tools — this agent can talk, and nothing else. Pass --tools to give it some."
      : `Tools: ${options.tools.map((tool) => tool.name).join(", ")}`
  );
  transcript.note("/help for commands, /exit to leave.");

  for (;;) {
    transcript.endTurn();
    const line = await ask("\n› ");
    if (line === undefined) return;
    const intent = classifyChatLine(line);
    if (intent.kind === "quit") return;
    if (intent.kind === "blank") continue;
    if (intent.kind === "reset") {
      messages = [];
      transcript.note("Conversation cleared.");
      continue;
    }
    if (intent.kind === "help") {
      for (const help of CHAT_HELP_LINES) transcript.note(help);
      continue;
    }
    if (intent.kind === "unknown-command") {
      transcript.note(`Unknown command ${intent.typed}. /help for the list.`);
      continue;
    }
    messages = await runTurn(intent.text, messages, options, registry, transcript);
  }
}

async function runTurn(
  text: string,
  messages: ChatMessage[],
  options: AgentChatOptions,
  registry: ServiceRegistry,
  transcript: ReturnType<typeof createChatTranscript>
): Promise<ChatMessage[]> {
  const task = new AgentTask();
  const controller = new AbortController();
  const onInterrupt = (): void => controller.abort();
  process.on("SIGINT", onInterrupt);

  let phase: string | undefined;
  const offStream = task.subscribe("stream_chunk", (event: StreamEvent) => {
    if (event.type === "text-delta") transcript.delta(event.textDelta);
  });
  const offProgress = task.subscribe("progress", (_progress, message) => {
    // Only the tool lines are worth a row: "Thinking" is what the blank space
    // between the prompt and the first token already says.
    if (!message || message === phase) return;
    phase = message;
    if (message.startsWith("Running ")) transcript.note(`  · ${message.slice("Running ".length)}`);
  });

  try {
    const output = await task.run(
      {
        model: options.model,
        prompt: text,
        messages,
        tools: [...options.tools],
        systemPrompt: options.systemPrompt,
        maxRounds: options.maxRounds,
        approval: options.approval,
      },
      { registry, signal: controller.signal }
    );
    if (output.stopReason === "max-rounds") {
      transcript.note(`  · stopped after ${output.rounds} rounds without an answer`);
    }
    return output.messages;
  } catch (error) {
    if (controller.signal.aborted) {
      // The turn is gone but the conversation is not: an interrupted turn wrote
      // nothing to `messages`, so the next one continues from where it was.
      transcript.note("  · interrupted");
      return messages;
    }
    transcript.note(`  · ${formatError(error)}`);
    return messages;
  } finally {
    process.off("SIGINT", onInterrupt);
    offStream();
    offProgress();
  }
}
