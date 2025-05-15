//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it } from "bun:test";
import { Task } from "@ellmers/task-graph";
import { pipe, Workflow } from "@ellmers/task-graph";
import { InMemoryTaskOutputRepository } from "../../binding/InMemoryTaskOutputRepository";
// Define input and output types for our tasks
type NumberInput = { value: number };
type NumberOutput = { value: number };

abstract class MathTask extends Task<NumberInput, NumberOutput> {
  public static category = "Math";
  public static inputs = [
    {
      id: "value",
      name: "Input",
      valueType: "number",
    },
  ] as const;

  public static outputs = [
    {
      id: "value",
      name: "Output",
      valueType: "number",
    },
  ] as const;
}

// Create a task that doubles a number
class DoubleTask extends MathTask {
  public static type = "DoubleTask";
  public async execute(input: NumberInput): Promise<NumberOutput> {
    return {
      value: input.value * 2,
    };
  }
}

// Create a task that adds 5 to a number
class AddFiveTask extends MathTask {
  public static type = "AddFiveTask";
  public async execute(input: NumberInput): Promise<NumberOutput> {
    return {
      value: input.value + 5,
    };
  }
}

// Create a task that squares a number
class SquareTask extends MathTask {
  public static type = "SquareTask";
  public async execute(input: NumberInput): Promise<NumberOutput> {
    return {
      value: input.value * input.value,
    };
  }
}

/**
 * Example workflow test that demonstrates the use of pipe()
 * This workflow will:
 * 1. Take a number
 * 2. Double it
 * 3. Add 5
 * 4. Square the value
 */
describe("Pipeline", () => {
  it("should run the pipe()", async () => {
    // Create our tasks
    const doubleTask = new DoubleTask({ value: 3 });
    const addFiveTask = new AddFiveTask();
    const squareTask = new SquareTask();
    // Create the workflow using pipe()
    const workflow = pipe([doubleTask, addFiveTask, squareTask]);

    // Run the workflow with input
    const value = await workflow.run({ value: 3 });

    // Expected value:
    // 1. Double 3 = 6
    // 2. Add 5 = 11
    // 3. Square 11 = 121
    // Should output: { value: 121 }
    expect(value).toEqual({ value: 121 });
  });

  it("should run the workflow.pipe()", async () => {
    // Create our tasks
    const doubleTask = new DoubleTask({ value: 3 });
    const addFiveTask = new AddFiveTask();
    const squareTask = new SquareTask();
    // Create the workflow using pipe()
    const cache = new InMemoryTaskOutputRepository();
    const workflow = new Workflow<NumberInput, NumberOutput>(cache);
    workflow.pipe(doubleTask, addFiveTask, squareTask);

    // Run the workflow with input
    const value = await workflow.run({ value: 3 });

    // Expected value:
    // 1. Double 3 = 6
    // 2. Add 5 = 11
    // 3. Square 11 = 121
    // Should output: { value: 121 }
    expect(value).toEqual({ value: 121 });

    const valueAgain = await workflow.run({ value: 3 });
    expect(valueAgain).toEqual({ value: 121 });
  });
});
