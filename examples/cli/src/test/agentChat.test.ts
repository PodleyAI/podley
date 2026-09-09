/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AiProviderRunFn, ModelConfig } from "@workglow/ai";
import {
  AiProviderRegistry,
  DirectExecutionStrategy,
  getAiProviderRegistry,
  setAiProviderRegistry,
} from "@workglow/ai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runAgentChat, type AgentChatIo } from "../agent/runAgentChat";

const PROVIDER = "mock-chat-provider";

const MODEL: ModelConfig = {
  model_id: "mock/chat-1",
  provider: PROVIDER,
  title: "",
  description: "",
  capabilities: ["tool-use"],
  provider_config: {},
  metadata: {},
};

/** Answers each turn with the next scripted reply; the last repeats. */
function scriptModel(replies: readonly string[]): () => number {
  let called = 0;
  const runFn: AiProviderRunFn = async (_input, _model, _signal, emit) => {
    const reply = replies[Math.min(called, replies.length - 1)]!;
    called++;
    emit({ type: "text-delta", port: "text", textDelta: reply });
    emit({ type: "finish", data: {} });
  };
  getAiProviderRegistry().registerRunFn(PROVIDER, { serves: ["tool-use"], runFn });
  return () => called;
}

/** How many messages the model was handed, per turn. */
function historySizes(): { readonly sizes: number[]; readonly runFn: AiProviderRunFn } {
  const sizes: number[] = [];
  const runFn: AiProviderRunFn = async (input, _model, _signal, emit) => {
    sizes.push(((input as { messages?: unknown[] }).messages ?? []).length);
    emit({ type: "text-delta", port: "text", textDelta: "ok" });
    emit({ type: "finish", data: {} });
  };
  return { sizes, runFn };
}

function scriptedIo(lines: readonly string[]): { io: AgentChatIo; out: () => string } {
  let index = 0;
  const written: string[] = [];
  return {
    io: {
      ask: async () => lines[index++],
      write: (text) => written.push(text),
    },
    out: () => written.join(""),
  };
}

describe("agent chat loop", () => {
  beforeEach(() => {
    setAiProviderRegistry(new AiProviderRegistry());
    getAiProviderRegistry().setDefaultStrategy(new DirectExecutionStrategy());
  });

  afterEach(() => {
    getAiProviderRegistry().unregisterProvider(PROVIDER);
  });

  const baseOptions = {
    model: MODEL as unknown as string,
    tools: [],
    systemPrompt: undefined,
    maxRounds: undefined,
    approval: "never" as const,
  };

  it("runs a turn per message and prints the reply", async () => {
    const called = scriptModel(["Hello back."]);
    const { io, out } = scriptedIo(["hello", "/exit"]);

    await runAgentChat(baseOptions, io);

    expect(called()).toBe(1);
    expect(out()).toContain("Hello back.");
  });

  it("ends at end of input as well as on /exit", async () => {
    scriptModel(["…"]);
    const { io } = scriptedIo(["hello", undefined as unknown as string]);
    await expect(runAgentChat(baseOptions, io)).resolves.toBeUndefined();
  });

  it("carries the conversation forward, and /reset drops it", async () => {
    const { sizes, runFn } = historySizes();
    getAiProviderRegistry().registerRunFn(PROVIDER, { serves: ["tool-use"], runFn });
    const { io } = scriptedIo(["one", "two", "/reset", "three", "/exit"]);

    await runAgentChat(baseOptions, io);

    // Turn 1 sends just the user message; turn 2 sends that turn plus this
    // one's; after /reset turn 3 is back to a single message.
    expect(sizes).toEqual([1, 3, 1]);
  });

  it("says what it can reach, and that it reaches nothing without --tools", async () => {
    scriptModel(["hi"]);
    const { io, out } = scriptedIo(["/exit"]);

    await runAgentChat(baseOptions, io);

    expect(out()).toContain("No tools");
  });

  it("keeps the session alive when a turn fails, and keeps the history", async () => {
    let calls = 0;
    const runFn: AiProviderRunFn = async (input, _model, _signal, emit) => {
      calls++;
      if (calls === 1) throw new Error("provider exploded");
      const messages = (input as { messages?: unknown[] }).messages ?? [];
      emit({ type: "text-delta", port: "text", textDelta: `saw ${messages.length}` });
      emit({ type: "finish", data: {} });
    };
    getAiProviderRegistry().registerRunFn(PROVIDER, { serves: ["tool-use"], runFn });
    const { io, out } = scriptedIo(["boom", "again", "/exit"]);

    await runAgentChat(baseOptions, io);

    expect(out()).toContain("provider exploded");
    // A failed turn recorded nothing, so the next one is still the first
    // message the model ever sees.
    expect(out()).toContain("saw 1");
  });

  it("answers /help without calling the model", async () => {
    const called = scriptModel(["never"]);
    const { io, out } = scriptedIo(["/help", "/exit"]);

    await runAgentChat(baseOptions, io);

    expect(called()).toBe(0);
    expect(out()).toContain("/reset");
  });
});
