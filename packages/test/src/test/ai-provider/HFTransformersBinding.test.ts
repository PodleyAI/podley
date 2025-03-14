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
  HF_TRANSFORMERS_ONNX,
  register_HFT_InlineJobFns,
} from "@ellmers/ai-provider/hf-transformers/inline";
import { ConcurrencyLimiter, JobQueue, SqliteRateLimiter } from "@ellmers/job-queue";
import { InMemoryQueueStorage, SqliteQueueStorage } from "@ellmers/storage";
import {
  getTaskQueueRegistry,
  setTaskQueueRegistry,
  TaskInput,
  TaskOutput,
  Workflow,
} from "@ellmers/task-graph";
import { sleep } from "@ellmers/util";
import { Sqlite } from "@ellmers/sqlite";
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
      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        HF_TRANSFORMERS_ONNX,
        AiJob<TaskInput, TaskOutput>,
        {
          limiter: new ConcurrencyLimiter(1, 10),
          storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
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
      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        HF_TRANSFORMERS_ONNX,
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
