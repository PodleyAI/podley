//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it } from "bun:test";
import {
  Task,
  TaskGraph,
  TaskGraphRunner,
  Dataflow,
  type IExecuteContext,
  type TaskConfig,
  type TaskStreamingDescriptor,
  type DataPortSchema,
  createStringAccumulator,
} from "@podley/task-graph";
import { Type, type TObject } from "@sinclair/typebox";
import { sleep } from "@podley/util";

type ProducerInput = {
  chunks: string[];
  delay: number;
};

type ProducerOutput = {
  output: string;
};

abstract class BaseStreamingProducer extends Task<ProducerInput, ProducerOutput> {
  static readiness: "first-chunk" | "final" = "first-chunk";
  protected readonly events: string[];

  constructor(events: string[], input: ProducerInput, config?: TaskConfig) {
    super(input, config);
    this.events = events;
  }

  static inputSchema(): TObject {
    return Type.Object({
      chunks: Type.Array(
        Type.String({
          description: "Chunk to emit",
        })
      ),
      delay: Type.Number({
        description: "Delay between chunks (ms)",
        default: 0,
      }),
    });
  }

  static outputSchema(): TObject {
    return Type.Object({
      output: Type.String({
        description: "Concatenated result",
      }),
    });
  }

  static streaming(): TaskStreamingDescriptor {
    return {
      outputs: {
        output: {
          chunkSchema: Type.String({
            description: "Streamed chunk",
          }) as DataPortSchema,
          readiness: this.readiness,
          accumulator: createStringAccumulator(),
        },
      },
    };
  }

  async execute(input: ProducerInput, context: IExecuteContext): Promise<ProducerOutput> {
    let final = "";
    for (const chunk of input.chunks) {
      this.events.push(`chunk:${chunk}`);
      await context.pushChunk("output", chunk);
      final += chunk;
      if (input.delay > 0) {
        await sleep(input.delay);
      }
    }
    await context.closeStream("output");
    this.events.push("producer-complete");
    return { output: final };
  }
}

describe("Streaming task orchestration", () => {
  it("allows dependants to start once the first chunk arrives", async () => {
    class FirstChunkProducer extends BaseStreamingProducer {
      static override readiness: "first-chunk" | "final" = "first-chunk";
    }

    class RecordingConsumer extends Task<{ input: string }, { length: number }> {
      static readonly type = "RecordingConsumer";
      private readonly events: string[];

      constructor(events: string[], config?: TaskConfig) {
        super({}, config);
        this.events = events;
      }

      static inputSchema(): TObject {
        return Type.Object({
          input: Type.String({
            description: "Aggregated streaming input",
            default: "",
          }),
        });
      }

      static outputSchema(): TObject {
        return Type.Object({
          length: Type.Number({ description: "Length of received string" }),
        });
      }

      async execute(input: { input: string }): Promise<{ length: number }> {
        this.events.push("consumer-start");
        return { length: input.input.length };
      }
    }

    const events: string[] = [];
    const graph = new TaskGraph();
    const producer = new FirstChunkProducer(events, { chunks: ["A", "B", "C"], delay: 20 }, { id: "producer" });
    const consumer = new RecordingConsumer(events, { id: "consumer" });

    graph.addTasks([producer, consumer]);
    graph.addDataflow(new Dataflow("producer", "output", "consumer", "input"));

    const runner = new TaskGraphRunner(graph);
    const results = await runner.runGraph();

    expect(events.indexOf("consumer-start")).toBeGreaterThan(events.indexOf("chunk:A"));
    expect(events.indexOf("consumer-start")).toBeLessThan(events.indexOf("producer-complete"));

    const producerResult = results.find((entry) => entry.id === "producer");
    expect(producerResult?.data.output).toBe("ABC");

    const consumerResult = results.find((entry) => entry.id === "consumer");
    expect(consumerResult?.data.length).toBe(3);
  });

  it("waits for stream completion when readiness is final", async () => {
    class FinalProducer extends BaseStreamingProducer {
      static override readiness: "first-chunk" | "final" = "final";
    }

    class CapturingConsumer extends Task<{ input: string }, { seen: string }> {
      static readonly type = "CapturingConsumer";
      private readonly events: string[];

      constructor(events: string[], config?: TaskConfig) {
        super({}, config);
        this.events = events;
      }

      static inputSchema(): TObject {
        return Type.Object({
          input: Type.String({
            description: "Aggregated streaming input",
            default: "",
          }),
        });
      }

      static outputSchema(): TObject {
        return Type.Object({
          seen: Type.String({ description: "Observed string" }),
        });
      }

      async execute(input: { input: string }): Promise<{ seen: string }> {
        this.events.push("consumer-start");
        return { seen: input.input };
      }
    }

    const events: string[] = [];
    const graph = new TaskGraph();
    const producer = new FinalProducer(events, { chunks: ["X", "Y"], delay: 20 }, { id: "producer" });
    const consumer = new CapturingConsumer(events, { id: "consumer" });

    graph.addTasks([producer, consumer]);
    graph.addDataflow(new Dataflow("producer", "output", "consumer", "input"));

    const runner = new TaskGraphRunner(graph);
    const results = await runner.runGraph();

    expect(events.indexOf("consumer-start")).toBeGreaterThan(events.indexOf("producer-complete"));

    const consumerResult = results.find((entry) => entry.id === "consumer");
    expect(consumerResult?.data.seen).toBe("XY");
  });
});
