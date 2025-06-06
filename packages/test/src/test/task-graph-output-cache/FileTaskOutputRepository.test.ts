//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach } from "bun:test";
import { FsFolderTaskOutputRepository } from "../../binding/FsFolderTaskOutputRepository";
import { TaskInput, TaskOutput } from "@podley/task-graph";
import { rmdirSync } from "node:fs";

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
