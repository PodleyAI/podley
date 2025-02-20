//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, test, expect } from "bun:test";
import { Lambda, LambdaTask } from "../task/LambdaTask";
import { TaskGraph } from "@ellmers/task-graph";
import { TaskGraphRunner } from "@ellmers/task-graph";
import { TaskGraphBuilder } from "@ellmers/task-graph";

describe("LambdaTask", () => {
  test("in command mode", async () => {
    const results = await Lambda({
      run: async () => {
        return { output: "Hello, world!" };
      },
    });
    expect(results).toEqual({ output: "Hello, world!" });
  });

  test("in command mode with reactive with input", async () => {
    const results = await Lambda({
      runReactive: async (input) => {
        return { output: input.a + input.b };
      },
      input: {
        a: 1,
        b: 2,
      },
    });
    expect(results).toEqual({ output: 3 });
  });

  test("in task mode", async () => {
    const task = new LambdaTask({
      runReactive: async () => {
        return { output: "Hello, world!" };
      },
    });
    const results = await task.run();
    expect(results).toEqual({ output: "Hello, world!" });
  });

  test("in task graph mode", async () => {
    const graph = new TaskGraph();
    graph.addTask(
      new LambdaTask({
        runReactive: async () => {
          return { output: "Hello, world!" };
        },
      })
    );
    const runner = new TaskGraphRunner(graph);
    const results = await runner.runGraph();
    expect(results[0]).toEqual({ output: "Hello, world!" });
  });

  test("in task builder mode", async () => {
    const builder = new TaskGraphBuilder();
    builder.Lambda({
      run: async () => {
        return { output: "Hello, world!" };
      },
    });
    const results = await builder.run();
    expect(results[0]).toEqual({ output: "Hello, world!" });
  });

  test("in task builder mode with input", async () => {
    const builder = new TaskGraphBuilder();
    builder.Lambda({
      run: async (input) => {
        return { output: input.a + input.b };
      },
      input: {
        a: 1,
        b: 2,
      },
    });
    const results = await builder.run();
    expect(results[0]).toEqual({ output: 3 });
  });

  test("in task builder mode with input", async () => {
    const builder = new TaskGraphBuilder();
    builder.Lambda({
      runReactive: async (input) => {
        return { output: input.a + input.b };
      },
      input: {
        a: 1,
        b: 2,
      },
    });
    const results = await builder.run();
    expect(results[0]).toEqual({ output: 3 });
  });

  test("with updateProgress", async () => {
    const graph = new TaskGraph();
    const task = new LambdaTask({
      id: "lambda",
      run: async (input, updateProgress) => {
        updateProgress(0.5, "Halfway there");
        return { output: "Hello, world!" };
      },
    });
    graph.addTask(task);
    const runner = new TaskGraphRunner(graph);
    let progressCounter = 0;
    task.on("progress", (progress: number) => {
      progressCounter++;
    });
    const results = await runner.runGraph();
    expect(results[0]).toEqual({ output: "Hello, world!" });
    expect(progressCounter).toEqual(1);
  });
});
