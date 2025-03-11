//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { expect, it, beforeEach, afterEach, describe, mock } from "bun:test";
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

  describe("Basics", () => {
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

  describe("clearOlderThan", () => {
    it("should clear outputs older than the specified time", async () => {
      // Mock current time
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

      const recentTask: TaskInput = { query: "recent" };
      const recentOutput: TaskOutput = { result: "recent result" };

      const oldTask: TaskInput = { query: "old" };
      const oldOutput: TaskOutput = { result: "old result" };

      const clearListener = mock((...args) => {});
      repository.on("output_pruned", clearListener);

      await repository.saveOutput("test-type", recentTask, recentOutput, new Date(now));
      await repository.saveOutput("test-type", oldTask, oldOutput, new Date(now - twoDaysInMs));

      expect(await repository.size()).toBe(2);

      await repository.clearOlderThan(oneDayInMs);

      expect(await repository.size()).toBe(1);
      expect(clearListener).toHaveBeenCalled();
    });

    it("should not clear any outputs if none are older than the specified time", async () => {
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

      const task1: TaskInput = { query: "task1" };
      const output1: TaskOutput = { result: "result1" };

      const task2: TaskInput = { query: "task2" };
      const output2: TaskOutput = { result: "result2" };

      const clearListener = mock((...args) => {});
      repository.on("output_pruned", clearListener);

      await repository.saveOutput("test-type", task1, output1, new Date(now));
      await repository.saveOutput("test-type", task2, output2, new Date(now - oneDayInMs));

      expect(await repository.size()).toBe(2);

      await repository.clearOlderThan(twoDaysInMs);

      expect(await repository.size()).toBe(2);
      expect(clearListener).toHaveBeenCalled();
    });
  });
}
