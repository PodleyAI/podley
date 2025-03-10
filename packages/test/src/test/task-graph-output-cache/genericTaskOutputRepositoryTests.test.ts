//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { expect, it, beforeEach, afterEach } from "bun:test";
import { TaskOutputRepository, TaskInput, TaskOutput } from "@ellmers/task-graph";

export function runGenericTaskOutputRepositoryTests(
  createRepository: () => Promise<TaskOutputRepository>
) {
  let repository: TaskOutputRepository;

  beforeEach(async () => {
    repository = await createRepository();
  });

  afterEach(async () => {
    await repository.clear();
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
}
