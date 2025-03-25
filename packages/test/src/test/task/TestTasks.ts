//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/**
 * This file contains various task implementations used for testing the task graph
 * system. It includes basic task types, specialized testing tasks, and examples
 * of different task behaviors like error handling and progress reporting.
 */

import {
  TaskOutputRepository,
  CreateWorkflow,
  IExecuteConfig,
  Task,
  TaskInput,
  TaskAbortedError,
  TaskError,
  TaskFailedError,
  TaskConfig,
  TaskInputDefinition,
  TaskOutputDefinition,
  arrayTaskFactory,
  JobQueueTaskConfig,
  Workflow,
} from "@ellmers/task-graph";
import { ConvertAllToArrays, ConvertSomeToOptionalArray, sleep } from "@ellmers/util";

/**
 * Standard input type for basic test tasks
 */
export type TestIOTaskInput = {
  key: string;
};

/**
 * Standard output type for basic test tasks with flags for different run modes
 */
export type TestIOTaskOutput = {
  reactiveOnly: boolean; // Indicates if the result came from reactive run
  all: boolean; // Indicates if the result came from full run
  key: string; // Echo of the input key
};

/**
 * Basic implementation of a test task with both reactive and full run modes
 * Used as a foundation for testing task execution and data flow
 */
export class TestIOTask extends Task<TestIOTaskInput, TestIOTaskOutput> {
  static readonly type = "TestIOTask";
  static readonly isCompound = false;

  // Define input schema
  static readonly inputs = [
    {
      id: "key",
      name: "Input",
      valueType: "text",
      defaultValue: "default",
    },
  ] as const;

  // Define output schema
  static readonly outputs = [
    {
      id: "reactiveOnly",
      name: "Output",
      valueType: "boolean",
    },
    {
      id: "all",
      name: "Output",
      valueType: "boolean",
    },
    {
      id: "key",
      name: "Output",
      valueType: "text",
      optional: true,
    },
  ] as const;

  /**
   * Implementation of reactive run mode
   * if execute ran then there will be output data
   * if not then we send the input data
   */
  async executeReactive(
    input: TestIOTaskInput,
    output: TestIOTaskOutput
  ): Promise<TestIOTaskOutput> {
    return {
      all: output.all ?? false,
      key: output.key !== "default" && output.key !== undefined ? output.key : input.key,
      reactiveOnly: output.reactiveOnly ?? true,
    };
  }

  /**
   * Implementation of full run mode - returns complete results
   */
  async execute(): Promise<TestIOTaskOutput> {
    return { all: true, key: "full", reactiveOnly: false };
  }
}

// Define test types for more complex task implementations
/**
 * Input type for processing string values
 */
type SimpleProcessingInput = {
  value: string;
};

/**
 * Output type for processed string values with a status flag
 */
type SimpleProcessingOutput = {
  processed: boolean;
  result: string;
};

/**
 * A more complex test task implementation that demonstrates
 * progress reporting and error simulation capabilities
 */
export class SimpleProcessingTask extends Task<SimpleProcessingInput, SimpleProcessingOutput> {
  static readonly type = "SimpleProcessingTask";

  // Define input/output definitions
  static readonly inputs = [
    {
      id: "value",
      name: "Input Value",
      valueType: "text",
      defaultValue: "default",
    },
  ] as const;

  static readonly outputs = [
    {
      id: "processed",
      name: "Processed Flag",
      valueType: "boolean",
    },
    {
      id: "result",
      name: "Result Value",
      valueType: "text",
    },
  ] as const;

  /**
   * Full implementation for processing input values
   * Demonstrates progress reporting
   */
  async execute(
    input: SimpleProcessingInput,
    { updateProgress }: IExecuteConfig
  ): Promise<SimpleProcessingOutput> {
    updateProgress(0.5);
    // Process the input value
    const result = `Processed: ${input.value}`;
    return { processed: true, result };
  }

  /**
   * Reactive implementation for real-time feedback
   */
  async executeReactive(input: SimpleProcessingInput, output: SimpleProcessingOutput) {
    // For testing purposes, just return a different result
    return { processed: output.processed ?? false, result: `Reactive: ${input.value}` };
  }
}

// Constants for standard error messages
export const FAILURE_MESSAGE = "Task failed intentionally" as const;
export const ABORT_MESSAGE = "Task aborted intentionally" as const;

/**
 * A task that always fails - useful for testing error handling
 * and recovery mechanisms in the task system
 */
export class FailingTask extends Task {
  static readonly type = "FailingTask";
  declare runInputData: { in: number };
  declare runOutputData: { out: number };

  // Define input/output definitions
  static inputs = [
    {
      id: "in",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
  ] as const;

  static outputs = [
    {
      id: "out",
      name: "Output",
      valueType: "number",
    },
  ] as const;

  /**
   * Implementation that always throws an error after checking for abort signals
   */
  async execute(input: TaskInput, executeConfig: IExecuteConfig): Promise<{ out: number }> {
    // Add a small delay to ensure abortion has time to take effect
    await sleep(5);
    if (executeConfig.signal.aborted) {
      throw new TaskAbortedError(ABORT_MESSAGE);
    }
    throw new TaskFailedError(FAILURE_MESSAGE);
  }
}

/**
 * Test task with configurable behavior for testing event handling,
 * progress reporting, and error conditions
 */
export class EventTestTask extends Task<TestIOTaskInput, TestIOTaskOutput> {
  static readonly type = "EventTestTask";

  // Control flags for testing different behaviors
  shouldThrowError = false;
  shouldEmitProgress = false;
  progressValue = 0.5;
  delayMs = 0;

  /**
   * Implementation with configurable behavior based on instance properties
   */
  async execute(input: TaskInput, { updateProgress, signal }: IExecuteConfig): Promise<any> {
    if (signal.aborted) {
      throw new TaskAbortedError("Task aborted");
    }

    if (this.shouldEmitProgress) {
      updateProgress(this.progressValue);
    }

    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (signal.aborted) {
      throw new TaskAbortedError("Task aborted");
    }

    if (this.shouldThrowError) {
      throw new Error("Controlled test error");
    }

    return { success: true };
  }
}

/**
 * Input type for number squaring task
 */
export type TestSquareTaskInput = {
  input: number;
};

/**
 * Output type for number squaring task
 */
export type TestSquareTaskOutput = {
  output: number;
};

/**
 * Task that squares a number - simple mathematical operation example
 */
export class TestSquareTask extends Task<TestSquareTaskInput, TestSquareTaskOutput> {
  static readonly type = "TestSquareTask";

  static readonly inputs: TaskInputDefinition[] = [
    {
      id: "input",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
  ] as const;

  static readonly outputs: TaskOutputDefinition[] = [
    {
      id: "output",
      name: "Output",
      valueType: "number",
    },
  ] as const;

  /**
   * Squares the input number
   */
  async executeReactive(input: TestSquareTaskInput): Promise<TestSquareTaskOutput> {
    return { output: input.input * input.input };
  }
}

/**
 * Multi-input version of the square task created using the array task factory
 * Allows processing multiple inputs in parallel
 */
export const TestSquareMultiInputTask = arrayTaskFactory<
  ConvertSomeToOptionalArray<TestSquareTaskInput, "input">,
  ConvertAllToArrays<TestSquareTaskOutput>,
  TestSquareTaskInput,
  TestSquareTaskOutput,
  JobQueueTaskConfig
>(TestSquareTask, ["input"]);

/**
 * Task that squares a number - simple mathematical operation example
 */
export class TestSquareNonReactiveTask extends Task<TestSquareTaskInput, TestSquareTaskOutput> {
  static readonly type = "TestSquareNonReactiveTask";

  static readonly inputs: TaskInputDefinition[] = [
    {
      id: "input",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
  ] as const;

  static readonly outputs: TaskOutputDefinition[] = [
    {
      id: "output",
      name: "Output",
      valueType: "number",
    },
  ] as const;

  /**
   * Squares the input number
   */
  async execute(input: TestSquareTaskInput): Promise<TestSquareTaskOutput> {
    return { output: input.input * input.input };
  }
}

/**
 * Multi-input version of the square task created using the array task factory
 * Allows processing multiple inputs in parallel
 */
export const TestSquareNonReactiveMultiInputTask = arrayTaskFactory<
  ConvertSomeToOptionalArray<TestSquareTaskInput, "input">,
  ConvertAllToArrays<TestSquareTaskOutput>,
  TestSquareTaskInput,
  TestSquareTaskOutput,
  JobQueueTaskConfig
>(TestSquareNonReactiveTask, ["input"]);

/**
 * Input type for the double task
 */
export type TestDoubleTaskInput = {
  input: number;
};

/**
 * Output type for the double task
 */
export type TestDoubleTaskOutput = {
  output: number;
};

/**
 * Task that doubles a number - simple mathematical operation example
 * Note: The implementation actually squares the number instead of doubling it.
 * This appears to be a bug in the original code.
 */
export class TestDoubleTask extends Task<TestDoubleTaskInput, TestDoubleTaskOutput> {
  static readonly type = "TestDoubleTask";
  static readonly inputs: TaskInputDefinition[] = [
    {
      id: "input",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
  ] as const;

  static readonly outputs: TaskOutputDefinition[] = [
    {
      id: "output",
      name: "Output",
      valueType: "number",
    },
  ] as const;

  /**
   * Should double the input number but currently squares it
   */
  async executeReactive(input: TestDoubleTaskInput): Promise<TestDoubleTaskOutput> {
    return { output: input.input * 2 };
  }
}

/**
 * Multi-input version of the double task created using the array task factory
 * Allows processing multiple inputs in parallel
 */
export const TestDoubleMultiInputTask = arrayTaskFactory<
  ConvertSomeToOptionalArray<TestDoubleTaskInput, "input">,
  ConvertAllToArrays<TestDoubleTaskOutput>,
  TestDoubleTaskInput,
  TestDoubleTaskOutput,
  JobQueueTaskConfig
>(TestDoubleTask, ["input"]);

/**
 * Task that throws errors under specific conditions
 * Used for testing error handling in the task system
 */
export class TestSquareErrorTask extends Task<TestSquareTaskInput, TestSquareTaskOutput> {
  static readonly type = "TestSquareErrorTask";
  static inputs = [
    {
      id: "input",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
  ] as const;

  static outputs = [
    {
      id: "output",
      name: "Output",
      valueType: "number",
    },
  ] as const;

  /**
   * Throws an error when input is 2, otherwise squares the input
   */
  async executeReactive(input: TestSquareTaskInput): Promise<TestSquareTaskOutput> {
    if (input.input === 2) {
      throw new TaskError("Test error");
    }
    return { output: input.input * input.input };
  }
}

/**
 * Multi-input version of the error-throwing task
 */
export const TestErrorMultiInputTask = arrayTaskFactory<
  ConvertSomeToOptionalArray<TestSquareTaskInput, "input">,
  ConvertAllToArrays<TestSquareTaskOutput>,
  TestSquareTaskInput,
  TestSquareTaskOutput
>(TestSquareErrorTask, ["input"]);

/**
 * Simple single task
 */
export class TestSimpleTask extends Task<{ input: string }, { output: string }> {
  static type = "TestSimpleTask";
  declare runInputData: { input: string };
  declare runOutputData: { output: string };

  static inputs: TaskInputDefinition[] = [{ id: "input", name: "Input", valueType: "string" }];
  static outputs: TaskOutputDefinition[] = [{ id: "output", name: "Output", valueType: "string" }];

  /**
   * Processes input by adding a prefix
   */
  async execute(input: TaskInput): Promise<any> {
    return { output: `processed-${input.input}` };
  }
}

/**
 * Task with custom output field names for testing output mapping
 */
export class TestOutputTask extends Task<{ input: string }, { customOutput: string }> {
  static type = "TestOutputTask";
  declare runInputData: { input: string };
  declare runOutputData: { customOutput: string };

  static inputs: TaskInputDefinition[] = [{ id: "input", name: "Input", valueType: "string" }];
  static outputs: TaskOutputDefinition[] = [
    { id: "customOutput", name: "Custom Output", valueType: "string" },
  ];

  /**
   * Processes input and outputs to a custom field name
   */
  async execute(input: TaskInput): Promise<any> {
    return { customOutput: `processed-${input.input}` };
  }
}

/**
 * Task with custom input field names for testing input mapping
 */
export class TestInputTask extends Task<{ customInput: string }, { output: string }> {
  static type = "TestInputTask";
  declare runInputData: { customInput: string };
  declare runOutputData: { output: string };

  static inputs: TaskInputDefinition[] = [
    { id: "customInput", name: "Custom Input", valueType: "string" },
  ];
  static outputs: TaskOutputDefinition[] = [{ id: "output", name: "Output", valueType: "string" }];

  /**
   * Processes custom input field and returns standard output
   */
  async execute(input: TaskInput): Promise<any> {
    return { output: `processed-${input.customInput}` };
  }
}

/**
 * Task that runs for a long time to test cancellation and progress reporting
 */
export class LongRunningTask extends Task {
  static type = "LongRunningTask";
  static inputs: TaskInputDefinition[] = [];
  static outputs: TaskOutputDefinition[] = [];

  /**
   * Simulates a long-running operation with progress updates
   * Checks for abort signals to demonstrate proper cancellation
   */
  async execute(input: TaskInput, executeConfig: IExecuteConfig): Promise<any> {
    for (let i = 0; i < 10; i++) {
      if (executeConfig.signal.aborted) {
        throw new TaskAbortedError("Task aborted");
      }
      await sleep(10);
      executeConfig.updateProgress(i / 10);
    }
  }
}

/**
 * Simple task for testing string inputs and outputs
 */
export class StringTask extends Task<{ input: string }, { output: string }, TaskConfig> {
  static type = "StringTask";
  static inputs: TaskInputDefinition[] = [{ id: "input", valueType: "string", name: "Input" }];
  static outputs: TaskOutputDefinition[] = [{ id: "output", valueType: "string", name: "Output" }];

  async execute() {
    return { output: "string" };
  }
}

/**
 * Simple task for testing number inputs and outputs
 */
export class NumberTask extends Task<{ input: number }, { output: number }, TaskConfig> {
  static type = "NumberTask";
  static inputs: TaskInputDefinition[] = [{ id: "input", valueType: "number", name: "Input" }];
  static outputs: TaskOutputDefinition[] = [{ id: "output", valueType: "number", name: "Output" }];

  async execute() {
    return { output: 123 };
  }
}
/**
 * Input type for addition task
 */
type TestAddTaskInput = {
  a: number;
  b: number;
};

/**
 * Output type for addition task
 */
type TestAddTaskOutput = {
  output: number;
};

/**
 * Task that adds two numbers together
 */
export class TestAddTask extends Task<TestAddTaskInput, TestAddTaskOutput> {
  static readonly type = "TestAddTask";
  static inputs = [
    {
      id: "a",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
    {
      id: "b",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
  ] as const;

  static outputs = [
    {
      id: "output",
      name: "Output",
      valueType: "number",
    },
  ] as const;

  /**
   * Adds two input numbers
   */
  async executeReactive(input: TestAddTaskInput) {
    return { output: input.a + input.b };
  }
}

/**
 * Module augmentation to register test task types in the workflow system
 */
declare module "@ellmers/task-graph" {
  interface Workflow {
    TestSimpleTask: CreateWorkflow<{ input: string }, { output: string }, TaskConfig>;
    TestOutputTask: CreateWorkflow<{ input: string }, { customOutput: string }, TaskConfig>;
    TestInputTask: CreateWorkflow<{ customInput: string }, { output: string }, TaskConfig>;
    FailingTask: CreateWorkflow<{}, {}, TaskConfig>;
    LongRunningTask: CreateWorkflow<{}, {}, TaskConfig>;
  }
}

// Register test tasks with the workflow system
Workflow.prototype.TestSimpleTask = CreateWorkflow(TestSimpleTask);
Workflow.prototype.TestOutputTask = CreateWorkflow(TestOutputTask);
Workflow.prototype.TestInputTask = CreateWorkflow(TestInputTask);
Workflow.prototype.FailingTask = CreateWorkflow(FailingTask);
Workflow.prototype.LongRunningTask = CreateWorkflow(LongRunningTask);
