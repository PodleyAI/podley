//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
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
  CreateWorkflow,
  DataPortSchema,
  IExecuteContext,
  Task,
  TaskAbortedError,
  TaskConfig,
  TaskError,
  TaskFailedError,
  TaskInput,
  Workflow,
} from "@podley/task-graph";
import { sleep } from "@podley/util";

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

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        key: {
          type: "string",
          default: "default",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        reactiveOnly: {
          type: "boolean",
        },
        all: {
          type: "boolean",
        },
        key: {
          type: "string",
          default: "default",
        },
      },
    } as DataPortSchema;
  }

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

  // Define input schema
  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        value: {
          type: "string",
          description: "Input value to process",
          default: "default",
        },
      },
    } as DataPortSchema;
  }

  // Define output schema
  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        processed: {
          type: "boolean",
          description: "Flag indicating if the value was processed",
        },
        result: {
          type: "string",
          description: "Processed result value",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Full implementation for processing input values
   * Demonstrates progress reporting
   */
  async execute(
    input: SimpleProcessingInput,
    { updateProgress }: IExecuteContext
  ): Promise<SimpleProcessingOutput> {
    await updateProgress(0.5);
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

  // Define input schema
  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        in: {
          type: "number",
          description: "Input number",
          default: 0,
        },
      },
    } as DataPortSchema;
  }

  // Define output schema
  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        out: {
          type: "number",
          description: "Output number",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Always throws an error to simulate task failure
   */
  async execute(input: TaskInput, executeContext: IExecuteContext): Promise<{ out: number }> {
    // Add a small delay to ensure abortion has time to take effect
    await sleep(5);
    if (executeContext.signal?.aborted) {
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

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        key: {
          type: "string",
          default: "default",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        reactiveOnly: {
          type: "boolean",
        },
        all: {
          type: "boolean",
        },
        key: {
          type: "string",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Executes the task with configurable behavior for testing
   */
  async execute(input: TestIOTaskInput, { updateProgress, signal }: IExecuteContext): Promise<any> {
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
      throw new TaskError("Test error");
    }

    return {
      reactiveOnly: false,
      all: true,
      key: input.key,
    };
  }
}

/**
 * Input type for squaring a number
 */
export type TestSquareTaskInput = {
  input: number;
};

/**
 * Output type for squared number
 */
export type TestSquareTaskOutput = {
  output: number;
};

/**
 * Task that squares its input number
 */
export class TestSquareTask extends Task<TestSquareTaskInput, TestSquareTaskOutput> {
  static readonly type = "TestSquareTask";

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        input: {
          type: "number",
          description: "Number to square",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "number",
          description: "Squared number",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Reactive implementation that squares the input number
   */
  async executeReactive(input: TestSquareTaskInput): Promise<TestSquareTaskOutput> {
    return {
      output: input.input * input.input,
    };
  }
}

/**
 * Non-reactive version of TestSquareTask
 * Only implements execute() for testing differences between reactive and non-reactive tasks
 */
export class TestSquareNonReactiveTask extends Task<TestSquareTaskInput, TestSquareTaskOutput> {
  static readonly type = "TestSquareNonReactiveTask";

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        input: {
          type: "number",
          description: "Number to square",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "number",
          description: "Squared number",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Non-reactive implementation that squares the input number
   */
  async execute(input: TestSquareTaskInput): Promise<TestSquareTaskOutput> {
    return { output: input.input * input.input };
  }
}

/**
 * Input type for doubling a number
 */
export type TestDoubleTaskInput = {
  input: number;
};

/**
 * Output type for doubled number
 */
export type TestDoubleTaskOutput = {
  output: number;
};

/**
 * Task that doubles its input number
 */
export class TestDoubleTask extends Task<TestDoubleTaskInput, TestDoubleTaskOutput> {
  static readonly type = "TestDoubleTask";

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        input: {
          type: "number",
          description: "Number to double",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "number",
          description: "Doubled number",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Reactive implementation that doubles the input number
   */
  async executeReactive(input: TestDoubleTaskInput): Promise<TestDoubleTaskOutput> {
    return {
      output: input.input * 2,
    };
  }
}

/**
 * Task that throws errors under specific conditions
 * Used for testing error handling in the task system
 */
export class TestSquareErrorTask extends Task<TestSquareTaskInput, TestSquareTaskOutput> {
  static readonly type = "TestSquareErrorTask";

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        input: {
          type: "number",
          description: "Number to square (will throw error)",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "number",
          description: "Squared number (never returned due to error)",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Always throws an error to test error handling
   */
  async executeReactive(input: TestSquareTaskInput): Promise<TestSquareTaskOutput> {
    throw new TaskError("Test error");
  }
}

/**
 * Simple single task
 */
export class TestSimpleTask extends Task<{ input: string }, { output: string }> {
  static type = "TestSimpleTask";

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Input string",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "string",
          description: "Output string",
        },
      },
    } as DataPortSchema;
  }

  async execute(input: { input: string }): Promise<{ output: string }> {
    return { output: `processed-${input.input}` };
  }
}

/**
 * Task that uses a custom output property name
 */
export class TestOutputTask extends Task<{ input: string }, { customOutput: string }> {
  static type = "TestOutputTask";
  declare runInputData: { input: string };
  declare runOutputData: { customOutput: string };

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Input string",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        customOutput: {
          type: "string",
          description: "Custom output string",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Returns the input in a custom output property
   */
  async execute(input: TaskInput): Promise<any> {
    return { customOutput: (input as { input: string }).input };
  }
}

/**
 * Task that uses a custom input property name
 */
export class TestInputTask extends Task<{ customInput: string }, { output: string }> {
  static type = "TestInputTask";
  declare runInputData: { customInput: string };
  declare runOutputData: { output: string };

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        customInput: {
          type: "string",
          description: "Custom input string",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "string",
          description: "Output string",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Returns the custom input in the output property
   */
  async execute(input: TaskInput): Promise<any> {
    return { output: (input as { customInput: string }).customInput };
  }
}

/**
 * Task that runs for a long time to test task abortion
 */
export class LongRunningTask extends Task {
  static type = "LongRunningTask";

  /**
   * Runs indefinitely until aborted
   */
  async execute(input: TaskInput, executeContext: IExecuteContext): Promise<any> {
    while (true) {
      if (executeContext.signal?.aborted) {
        throw new TaskAbortedError(ABORT_MESSAGE);
      }
      await sleep(100);
    }
  }
}

/**
 * Task that copies string input
 */
export class StringTask extends Task<{ input: string }, { output: string }, TaskConfig> {
  static type = "StringTask";

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Input string",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "string",
          description: "Output string",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Returns the input string as output
   */
  async execute() {
    return { output: this.runInputData.input };
  }
}

/**
 * Task that copies string input
 */
export class NumberToStringTask extends Task<{ input: number }, { output: string }, TaskConfig> {
  static type = "NumberToStringTask";

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        input: {
          type: "number",
          description: "Input number",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "string",
          description: "Output string",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Returns the input string as output
   */
  async execute() {
    return { output: String(this.runInputData.input) };
  }
}

/**
 * Task that processes number input
 */
export class NumberTask extends Task<{ input: number }, { output: number }, TaskConfig> {
  static type = "NumberTask";

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        input: {
          type: "number",
          description: "Input number",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "number",
          description: "Output number",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Returns the input number as output
   */
  async execute() {
    return { output: this.runInputData.input };
  }
}

/**
 * Input type for adding two numbers
 */
type TestAddTaskInput = {
  a: number;
  b: number;
};

/**
 * Output type for sum of two numbers
 */
type TestAddTaskOutput = {
  output: number;
};

/**
 * Task that adds two numbers
 */
export class TestAddTask extends Task<TestAddTaskInput, TestAddTaskOutput> {
  static readonly type = "TestAddTask";

  static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        a: {
          type: "number",
          description: "First number",
        },
        b: {
          type: "number",
          description: "Second number",
        },
      },
    } as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {
        output: {
          type: "number",
          description: "Sum of a and b",
        },
      },
    } as DataPortSchema;
  }

  /**
   * Adds the two input numbers
   */
  async executeReactive(input: TestAddTaskInput) {
    return {
      output: input.a + input.b,
    };
  }
}

/**
 * Module augmentation to register test task types in the workflow system
 */
declare module "@podley/task-graph" {
  interface Workflow {
    TestSimpleTask: CreateWorkflow<{ input: string }, { output: string }, TaskConfig>;
    TestOutputTask: CreateWorkflow<{ input: string }, { customOutput: string }, TaskConfig>;
    TestInputTask: CreateWorkflow<{ customInput: string }, { output: string }, TaskConfig>;
    FailingTask: CreateWorkflow<{}, {}, TaskConfig>;
    LongRunningTask: CreateWorkflow<{}, {}, TaskConfig>;
    StringTask: CreateWorkflow<{ input: string }, { output: string }, TaskConfig>;
    NumberToStringTask: CreateWorkflow<{ input: number }, { output: string }, TaskConfig>;
    NumberTask: CreateWorkflow<{ input: number }, { output: number }, TaskConfig>;
    TestAddTask: CreateWorkflow<TestAddTaskInput, TestAddTaskOutput, TaskConfig>;
  }
}

// Register test tasks with the workflow system
Workflow.prototype.TestSimpleTask = CreateWorkflow(TestSimpleTask);
Workflow.prototype.TestOutputTask = CreateWorkflow(TestOutputTask);
Workflow.prototype.TestInputTask = CreateWorkflow(TestInputTask);
Workflow.prototype.FailingTask = CreateWorkflow(FailingTask);
Workflow.prototype.LongRunningTask = CreateWorkflow(LongRunningTask);
Workflow.prototype.StringTask = CreateWorkflow(StringTask);
Workflow.prototype.NumberToStringTask = CreateWorkflow(NumberToStringTask);
Workflow.prototype.NumberTask = CreateWorkflow(NumberTask);
Workflow.prototype.TestAddTask = CreateWorkflow(TestAddTask);
