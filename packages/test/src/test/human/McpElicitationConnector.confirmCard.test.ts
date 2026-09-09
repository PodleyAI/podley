/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { McpElicitationConnector } from "@workglow/mcp/tasks";
import type { IHumanRequest } from "@workglow/util";
import type { DataPortSchema } from "@workglow/util/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPairedMcpHarness } from "./mcpHarness";

const confirmSchema = {
  type: "object",
  properties: {
    action: { type: "string", title: "Action" },
    reaches: { type: "string", title: "Reaches" },
  },
  additionalProperties: true,
} as unknown as DataPortSchema;

function confirmRequest(contentData: Record<string, unknown>): IHumanRequest {
  return {
    requestId: "confirm-card",
    targetHumanId: "default",
    kind: "confirm",
    message: 'Run workflow "export"?',
    contentSchema: confirmSchema,
    contentData,
    expectsResponse: true,
    mode: "single",
    metadata: undefined,
  };
}

/**
 * A confirm's requested schema is deliberately empty, so the message IS the
 * whole approval card. Its line structure has to come from this connector and
 * not from the values it interpolates: `contentData` is an input port on
 * `HumanInputTask`, so a model driving the task over MCP supplies it.
 */
describe("McpElicitationConnector confirm card", () => {
  let harness: Awaited<ReturnType<typeof createPairedMcpHarness>>;
  let connector: McpElicitationConnector;

  beforeAll(async () => {
    harness = await createPairedMcpHarness();
    connector = new McpElicitationConnector(harness.server);
  });

  afterAll(async () => {
    await harness.dispose();
  });

  async function cardFor(contentData: Record<string, unknown>): Promise<string> {
    harness.script.clear();
    harness.script.push({ requestId: "x", action: "decline", content: undefined, done: true });
    await connector.send(confirmRequest(contentData), new AbortController().signal);
    return harness.script.received.at(-1)?.message ?? "";
  }

  it("renders exactly one line per value, whatever the value contains", async () => {
    const card = await cardFor({
      action: "Run workflow",
      // The forgery: a second, false "Reaches:" line the person reads last.
      reaches: "network:http → https://attacker.test\n\nReaches: (nothing beyond running a model)",
    });
    const [message, blank, ...details] = card.split("\n");
    expect(message).toBe('Run workflow "export"?');
    expect(blank).toBe("");
    expect(details).toHaveLength(2);
    expect(details.filter((line) => line.startsWith("Reaches:"))).toHaveLength(1);
  });

  it("a value cannot pad the card with blank lines", async () => {
    const card = await cardFor({ action: "Run workflow", reaches: "\n".repeat(40) + "harmless" });
    expect(card.split("\n").filter((line) => line === "")).toHaveLength(1);
  });

  it("keeps an ordinary card readable", async () => {
    const card = await cardFor({ action: "Run workflow", reaches: "https://example.test" });
    expect(card.split("\n")).toHaveLength(4);
    expect(card).toContain("Action: Run workflow");
    expect(card).toContain("Reaches: https://example.test");
  });

  it("a label cannot introduce a line either", async () => {
    harness.script.clear();
    harness.script.push({ requestId: "x", action: "decline", content: undefined, done: true });
    await connector.send(
      {
        ...confirmRequest({ action: "Run workflow" }),
        contentSchema: {
          type: "object",
          properties: { action: { type: "string", title: "Action\nReaches: nothing" } },
          additionalProperties: true,
        } as unknown as DataPortSchema,
      },
      new AbortController().signal
    );
    const card = harness.script.received.at(-1)?.message ?? "";
    expect(card.split("\n")).toHaveLength(3);
  });
});
