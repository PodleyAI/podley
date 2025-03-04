//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, test, expect } from "bun:test";
import { Lambda, LambdaTask } from "../task/LambdaTask";
import { TaskGraph } from "@ellmers/task-graph";
import { Workflow } from "@ellmers/task-graph";

describe("LambdaTask", () => {
  test("in command mode", async () => {
    const results = await Lambda(
      { data: null },
      {
        execute: async () => {
          return { output: "Hello, world!" };
        },
      }
    );
    expect(results).toEqual({ output: "Hello, world!" });
  });

  test("in command mode with reactive with input", async () => {
    const results = await Lambda(
      {
        a: 1,
        b: 2,
      },
      {
        executeReactive: async (input) => {
          return { output: input.a + input.b };
        },
      }
    );
    expect(results).toEqual({ output: 3 });
  });

  test("in task mode", async () => {
    const task = new LambdaTask(
      {},
      {
        executeReactive: async () => {
          return { output: "Hello, world!" };
        },
      }
    );
    const results = await task.run();
    expect(results).toEqual({ output: "Hello, world!" });
  });

  test("in task graph mode", async () => {
    const graph = new TaskGraph();
    graph.addTask(
      new LambdaTask(
        {},
        {
          id: "lambdaReactiveTest",
          executeReactive: async () => {
            return { output: "Hello, world!" };
          },
        }
      )
    );
    const results = await graph.run();
    expect(results[0]).toEqual({
      id: "lambdaReactiveTest",
      type: "LambdaTask",
      data: { output: "Hello, world!" },
    });
  });

  test("in task workflow mode", async () => {
    const workflow = new Workflow();
    workflow.Lambda(
      {},
      {
        execute: async () => {
          return { output: "Hello, world!" };
        },
      }
    );
    const results = await workflow.run();
    expect(results[0].data).toEqual({
      output: "Hello, world!",
    });
  });

  test("in task workflow mode with input execute", async () => {
    const workflow = new Workflow();
    workflow.Lambda(
      {
        a: 1,
        b: 2,
      },
      {
        execute: async (input) => {
          return { output: input.a + input.b };
        },
      }
    );
    const results = await workflow.run();
    expect(results[0].data).toEqual({ output: 3 });
  });

  test("in task workflow mode with input executeReactive", async () => {
    const workflow = new Workflow();
    workflow.Lambda(
      {
        a: 1,
        b: 2,
      },
      {
        executeReactive: async (input) => {
          return { output: input.a + input.b };
        },
      }
    );
    const results = await workflow.run();
    expect(results[0].data).toEqual({ output: 3 });
  });

  test("with updateProgress", async () => {
    const graph = new TaskGraph();
    const task = new LambdaTask(
      {},
      {
        execute: async (input, { updateProgress }) => {
          updateProgress(0.5, "Halfway there");
          return { output: "Hello, world!" };
        },
      }
    );
    graph.addTask(task);
    let progressCounter = 0;
    task.on("progress", (progress: number) => {
      progressCounter++;
    });
    const results = await graph.run();
    expect(results[0].data).toEqual({ output: "Hello, world!" });
    expect(progressCounter).toEqual(1);
  });
});
