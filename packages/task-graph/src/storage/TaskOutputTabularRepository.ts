//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { type TabularRepository } from "@ellmers/storage";
import { compress, decompress, makeFingerprint } from "@ellmers/util";
import { TaskInput, TaskOutput } from "../task/TaskTypes";
import { TaskOutputRepository } from "./TaskOutputRepository";

export type TaskOutputPrimaryKey = {
  key: string;
  taskType: string;
};

export const TaskOutputSchema = {
  key: "string",
  taskType: "string",
  value: "blob",
  createdAt: "date",
} as const;

export const TaskOutputPrimaryKeyNames = ["key", "taskType"] as const;

export type TaskOutputRepositoryStorage = TabularRepository<
  typeof TaskOutputSchema,
  typeof TaskOutputPrimaryKeyNames
>;

export type TaskOutputRepositoryOptions = {
  tabularRepository: TaskOutputRepositoryStorage;
  outputCompression?: boolean;
};

/**
 * Abstract class for managing task outputs in a repository
 * Provides methods for saving, retrieving, and clearing task outputs
 */
export class TaskOutputTabularRepository extends TaskOutputRepository {
  /**
   * The tabular repository for the task outputs
   */
  tabularRepository: TaskOutputRepositoryStorage;

  /**
   * Whether to compress the output
   */
  outputCompression: boolean;

  /**
   * Constructor for the TaskOutputTabularRepository
   * @param options The options for the repository
   */
  constructor({ tabularRepository, outputCompression = true }: TaskOutputRepositoryOptions) {
    super({ outputCompression });
    this.tabularRepository = tabularRepository;
    this.outputCompression = outputCompression;
  }

  public async keyFromInputs(inputs: TaskInput): Promise<string> {
    return await makeFingerprint(inputs);
  }

  /**
   * Saves a task output to the repository
   * @param taskType The type of task to save the output for
   * @param inputs The input parameters for the task
   * @param output The task output to save
   */
  async saveOutput(
    taskType: string,
    inputs: TaskInput,
    output: TaskOutput,
    createdAt = new Date() // for testing purposes
  ): Promise<void> {
    const key = await this.keyFromInputs(inputs);
    const value = JSON.stringify(output);
    if (this.outputCompression) {
      const compressedValue = await compress(value);
      await this.tabularRepository.put({
        taskType,
        key,
        value: compressedValue,
        createdAt: createdAt,
      });
    } else {
      const valueBuffer = Buffer.from(value);
      await this.tabularRepository.put({
        taskType,
        key,
        value: valueBuffer,
        createdAt: createdAt,
      });
    }
    this.emit("output_saved", taskType);
  }

  /**
   * Retrieves a task output from the repository
   * @param taskType The type of task to retrieve the output for
   * @param inputs The input parameters for the task
   * @returns The retrieved task output, or undefined if not found
   */
  async getOutput(taskType: string, inputs: TaskInput): Promise<TaskOutput | undefined> {
    const key = await this.keyFromInputs(inputs);
    const output = await this.tabularRepository.get({ key, taskType });
    this.emit("output_retrieved", taskType);
    if (output?.value) {
      if (this.outputCompression) {
        const decompressedValue = await decompress(output.value);
        const value = JSON.parse(decompressedValue) as TaskOutput;
        return value as TaskOutput;
      } else {
        const stringValue = output.value.toString();
        const value = JSON.parse(stringValue) as TaskOutput;
        return value as TaskOutput;
      }
    } else {
      return undefined;
    }
  }

  /**
   * Clears all task outputs from the repository
   * @emits output_cleared when the operation completes
   */
  async clear(): Promise<void> {
    await this.tabularRepository.deleteAll();
    this.emit("output_cleared");
  }

  /**
   * Returns the number of task outputs stored in the repository
   * @returns The count of stored task outputs
   */
  async size(): Promise<number> {
    return await this.tabularRepository.size();
  }

  /**
   * Clear all task outputs from the repository that are older than the given date
   * @param olderThanInMs The time in milliseconds to clear task outputs older than
   */
  async clearOlderThan(olderThanInMs: number): Promise<void> {
    const date = new Date(Date.now() - olderThanInMs);
    await this.tabularRepository.deleteSearch("createdAt", date, "<");
    this.emit("output_pruned");
  }
}
