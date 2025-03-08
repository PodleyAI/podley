//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  AiJob,
  AiProviderInput,
  getGlobalModelRepository,
  InMemoryModelRepository,
  setGlobalModelRepository,
} from "@ellmers/ai";
import {
  ONNX_TRANSFORMERJS,
  registerHuggingfaceLocalTasks,
} from "@ellmers/ai-provider/hf-transformers";
import { ConcurrencyLimiter, JobQueue, SqliteRateLimiter } from "@ellmers/job-queue";
import { SqliteQueueStorage } from "@ellmers/storage";
import {
  getTaskQueueRegistry,
  setTaskQueueRegistry,
  TaskInput,
  TaskOutput,
  Workflow,
} from "@ellmers/task-graph";
import { sleep, Sqlite } from "@ellmers/util";
import { afterAll, beforeEach, describe, expect, it } from "bun:test";

const db = new Sqlite.Database(":memory:");

describe("HFTransformersBinding", () => {
  beforeEach(() => {
    setTaskQueueRegistry(null);
  });
  describe("InMemoryJobQueue", () => {
    it("Should have an item queued", async () => {
      registerHuggingfaceLocalTasks();
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        ONNX_TRANSFORMERJS,
        AiJob<TaskInput, TaskOutput>,
        {
          limiter: new ConcurrencyLimiter(1, 10),
        }
      );
      queueRegistry.registerQueue(jobQueue);

      const model = {
        name: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
        url: "Xenova/LaMini-Flan-T5-783M",
        availableOnBrowser: true,
        availableOnServer: true,
        provider: ONNX_TRANSFORMERJS,
        pipeline: "text2text-generation",
      };

      setGlobalModelRepository(new InMemoryModelRepository());
      await getGlobalModelRepository().addModel(model);
      await getGlobalModelRepository().connectTaskToModel("TextGenerationTask", model.name);
      await getGlobalModelRepository().connectTaskToModel("TextRewriterTask", model.name);

      const queue = queueRegistry.getQueue(ONNX_TRANSFORMERJS);
      expect(queue).toBeDefined();
      expect(queue!.queueName).toEqual(ONNX_TRANSFORMERJS);

      const workflow = new Workflow();
      workflow.DownloadModel({
        model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      });
      workflow.run();
      await sleep(1);
      expect(await queue?.size()).toEqual(1);
      workflow.reset();
      await queue?.clear();
    });
  });

  describe("SqliteJobQueue", () => {
    it("Should have an item queued", async () => {
      registerHuggingfaceLocalTasks();
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        ONNX_TRANSFORMERJS,
        AiJob<TaskInput, TaskOutput>,
        {
          storage: new SqliteQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(db, "test"),
          limiter: new SqliteRateLimiter(db, "test", 4, 1),
          waitDurationInMilliseconds: 1,
        }
      );

      queueRegistry.registerQueue(jobQueue);

      setGlobalModelRepository(new InMemoryModelRepository());
      const model = {
        name: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
        url: "Xenova/LaMini-Flan-T5-783M",
        availableOnBrowser: true,
        availableOnServer: true,
        provider: ONNX_TRANSFORMERJS,
        pipeline: "text2text-generation",
      };

      await getGlobalModelRepository().addModel(model);
      await getGlobalModelRepository().connectTaskToModel("TextGenerationTask", model.name);
      await getGlobalModelRepository().connectTaskToModel("TextRewriterTask", model.name);

      const queue = queueRegistry.getQueue(ONNX_TRANSFORMERJS);
      expect(queue).toBeDefined();
      expect(queue?.queueName).toEqual(ONNX_TRANSFORMERJS);

      const workflow = new Workflow();
      workflow.DownloadModel({
        model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      });
      workflow.run();
      await sleep(1);
      expect(await queue?.size()).toEqual(1);
      workflow.reset();
      await queue?.clear();
    });
  });

  afterAll(async () => {
    getTaskQueueRegistry().stopQueues().clearQueues();
    setTaskQueueRegistry(null);
  });
});
