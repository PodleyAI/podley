//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  AiJob,
  AiJobInput,
  getGlobalModelRepository,
  InMemoryModelRepository,
  setGlobalModelRepository,
} from "@podley/ai";
import { HF_TRANSFORMERS_ONNX, register_HFT_InlineJobFns } from "@podley/ai-provider";
import { ConcurrencyLimiter, JobQueue, SqliteRateLimiter } from "@podley/job-queue";
import { Sqlite } from "@podley/sqlite";
import { InMemoryQueueStorage, SqliteQueueStorage } from "@podley/storage";
import {
  getTaskQueueRegistry,
  setTaskQueueRegistry,
  TaskInput,
  TaskOutput,
  Workflow,
} from "@podley/task-graph";
import { sleep } from "@podley/util";
import { afterAll, beforeEach, describe, expect, it } from "bun:test";

const db = new Sqlite.Database(":memory:");

describe("HFTransformersBinding", () => {
  beforeEach(() => {
    setTaskQueueRegistry(null);
  });
  describe("InMemoryJobQueue", () => {
    it("Should have an item queued", async () => {
      register_HFT_InlineJobFns();
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new JobQueue<AiJobInput<TaskInput>, TaskOutput>(
        HF_TRANSFORMERS_ONNX,
        AiJob<AiJobInput<TaskInput>, TaskOutput>,
        {
          limiter: new ConcurrencyLimiter(1, 10),
          storage: new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
            HF_TRANSFORMERS_ONNX
          ),
        }
      );
      queueRegistry.registerQueue(jobQueue);

      const model = {
        name: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
        url: "Xenova/LaMini-Flan-T5-783M",
        availableOnBrowser: true,
        availableOnServer: true,
        provider: HF_TRANSFORMERS_ONNX,
        pipeline: "text2text-generation",
      };

      setGlobalModelRepository(new InMemoryModelRepository());
      await getGlobalModelRepository().addModel(model);
      await getGlobalModelRepository().connectTaskToModel("TextGenerationTask", model.name);
      await getGlobalModelRepository().connectTaskToModel("TextRewriterTask", model.name);

      const queue = queueRegistry.getQueue(HF_TRANSFORMERS_ONNX);
      expect(queue).toBeDefined();
      expect(queue!.queueName).toEqual(HF_TRANSFORMERS_ONNX);

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
      register_HFT_InlineJobFns();
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new JobQueue<AiJobInput<TaskInput>, TaskOutput>(
        HF_TRANSFORMERS_ONNX,
        AiJob<AiJobInput<TaskInput>, TaskOutput>,
        {
          storage: new SqliteQueueStorage<AiJobInput<TaskInput>, TaskOutput>(db, "test"),
          limiter: new SqliteRateLimiter(db, "test", { maxExecutions: 4, windowSizeInSeconds: 1 }),
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
        provider: HF_TRANSFORMERS_ONNX,
        pipeline: "text2text-generation",
      };

      await getGlobalModelRepository().addModel(model);
      await getGlobalModelRepository().connectTaskToModel("TextGenerationTask", model.name);
      await getGlobalModelRepository().connectTaskToModel("TextRewriterTask", model.name);

      const queue = queueRegistry.getQueue(HF_TRANSFORMERS_ONNX);
      expect(queue).toBeDefined();
      expect(queue?.queueName).toEqual(HF_TRANSFORMERS_ONNX);

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
