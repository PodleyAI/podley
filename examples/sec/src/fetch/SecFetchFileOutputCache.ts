//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskInput, TaskOutput, TaskOutputRepository } from "@ellmers/task-graph";
import { FetchTaskOutput } from "@ellmers/tasks";
import { mkdirSync } from "node:fs";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

interface SecFetchFileOutputCacheOptions {
  folderPath: string;
  outputCompression?: boolean;
  inputToFileName: (input: any) => string;
  outputSerializer?: (output: FetchTaskOutput) => string | Blob;
  outputDeserializer?: (output: string | Blob) => FetchTaskOutput;
  response_type?: string;
}

export class SecFetchFileOutputCache extends TaskOutputRepository {
  private folderPath: string;
  private inputToFileName: (input: any) => string;

  constructor({ folderPath, outputCompression, inputToFileName }: SecFetchFileOutputCacheOptions) {
    super({ outputCompression });
    this.folderPath = path.join(folderPath);
    this.inputToFileName = inputToFileName;
    mkdirSync(this.folderPath, { recursive: true });
  }

  outputSerializer(output: FetchTaskOutput, response_type: string): any {
    if (response_type === "json") {
      return JSON.stringify(output.json);
    } else if (response_type === "text") {
      return output.text;
    } else if (response_type === "blob") {
      return output.blob;
    } else {
      throw new Error(`Unsupported response type: ${response_type}`);
    }
  }

  outputDeserializer(data: any, response_type: string): FetchTaskOutput {
    const result: FetchTaskOutput = {};
    if (response_type === "json") {
      result.json = JSON.parse(data as string);
    }
    if (response_type === "text") {
      result.text = data.toString();
    }
    if (response_type === "blob") {
      result.blob = data as Blob;
    }
    return result;
  }

  /**
   * Saves a task output to the repository
   * @param taskType The type of task to save the output for
   * @param input The input parameters for the task
   * @param output The task output to save
   */
  async saveOutput(taskType: string, input: TaskInput, output: TaskOutput): Promise<void> {
    const filePath = path.join(this.folderPath, this.inputToFileName(input));
    const response_type = filePath.split(".").pop() ?? "json";
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, this.outputSerializer(output, response_type), {
      encoding: response_type !== "blob" ? "utf-8" : "binary",
    });
    this.emit("output_saved", taskType);
  }

  /**
   * Retrieves a task output from the repository
   * @param taskType The type of task to retrieve the output for
   * @param inputs The input parameters for the task
   * @returns The retrieved task output, or undefined if not found
   */
  async getOutput(
    taskType: string,
    inputs: TaskInput & { date?: string }
  ): Promise<TaskOutput | undefined> {
    const filePath = path.join(this.folderPath, this.inputToFileName(inputs));
    try {
      if (inputs.date) {
        const stats = await stat(filePath);
        // if the file was created a day before the date, return undefined
        const fileDate = new Date(stats.mtime).toISOString().split("T")[0];
        const inputDate = inputs.date;
        if (fileDate < inputDate) {
          return undefined;
        }
      }

      const data = await readFile(filePath);
      if (data) {
        this.emit("output_retrieved", taskType);
        const response_type = filePath.split(".").pop() ?? "json";
        return this.outputDeserializer(data, response_type);
      }
    } catch (error) {}
    return undefined;
  }

  async clear(): Promise<void> {
    this.emit("output_cleared");
  }

  async size(): Promise<number> {
    return 0;
  }

  async clearOlderThan(olderThanInMs: number): Promise<void> {
    return undefined;
  }
}
