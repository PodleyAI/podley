/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskInput, TaskOutput } from "@podley/task-graph";
import { beforeEach, describe, expect, it } from "bun:test";
import { rmdirSync } from "node:fs";
import { FsFolderTaskOutputRepository } from "../../binding/FsFolderTaskOutputRepository";

describe("FsFolderTaskOutputRepository", () => {
  let repository: FsFolderTaskOutputRepository;

  beforeEach(() => {
    try {
      rmdirSync(".cache/test/file-task-output", { recursive: true });
    } catch {}
    repository = new FsFolderTaskOutputRepository(".cache/test/file-task-output");
  });

  it("should initialize the tabularRepository", () => {
    expect(repository.tabularRepository).toBeDefined();
  });

  it("should store and retrieve task outputs", async () => {
    const input: TaskInput = { id: "task1" };
    const output: TaskOutput = { result: "success" };
    const taskType: string = "taskType1";

    await repository.saveOutput(taskType, input, output);
    const retrievedOutput = await repository.getOutput(taskType, input);

    expect(retrievedOutput).toEqual(output);
  });

  it("should return undefined for non-existent task outputs", async () => {
    const input: TaskInput = { id: "task2" };
    const taskType: string = "taskType1";

    const retrievedOutput = await repository.getOutput(taskType, input);

    expect(retrievedOutput).toBeUndefined();
  });
});
