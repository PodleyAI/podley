/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AiJob,
  AiJobInput,
  getGlobalModelRepository,
  InMemoryModelRepository,
  setGlobalModelRepository,
} from "@workglow/ai";
import { HF_TRANSFORMERS_ONNX, register_HFT_InlineJobFns } from "@workglow/ai-provider";
import {
  ConcurrencyLimiter,
  JobQueueClient,
  JobQueueServer,
  SqliteRateLimiter,
} from "@workglow/job-queue";
import { Sqlite } from "@workglow/sqlite";
import { InMemoryQueueStorage, SqliteQueueStorage } from "@workglow/storage";
import {
  getTaskQueueRegistry,
  setTaskQueueRegistry,
  TaskInput,
  TaskOutput,
  Workflow,
} from "@workglow/task-graph";
import { sleep } from "@workglow/util";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const db = new Sqlite.Database(":memory:");

describe("HFTransformersBinding", () => {
  beforeEach(() => {
    setTaskQueueRegistry(null);
  });

  describe("InMemoryJobQueue", () => {
    it("Should have an item queued", async () => {
      register_HFT_InlineJobFns();
      const queueRegistry = getTaskQueueRegistry();

      const storage = new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
        HF_TRANSFORMERS_ONNX
      );
      await storage.setupDatabase();

      const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(
        AiJob<AiJobInput<TaskInput>, TaskOutput>,
        {
          storage,
          queueName: HF_TRANSFORMERS_ONNX,
          limiter: new ConcurrencyLimiter(1, 10),
          pollIntervalMs: 1,
        }
      );

      const client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
        storage,
        queueName: HF_TRANSFORMERS_ONNX,
      });

      client.attach(server);

      queueRegistry.registerQueue({ server, client, storage });

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

      const registeredQueue = queueRegistry.getQueue(HF_TRANSFORMERS_ONNX);
      expect(registeredQueue).toBeDefined();
      expect(registeredQueue!.server.queueName).toEqual(HF_TRANSFORMERS_ONNX);

      const workflow = new Workflow();
      workflow.DownloadModel({
        model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      });
      workflow.run();
      await sleep(1);
      expect(await registeredQueue?.client.size()).toEqual(1);
      workflow.reset();
      await registeredQueue?.storage.deleteAll();
    });
  });

  describe("SqliteJobQueue", () => {
    it("Should have an item queued", async () => {
      register_HFT_InlineJobFns();
      const queueRegistry = getTaskQueueRegistry();
      const storage = new SqliteQueueStorage<AiJobInput<TaskInput>, TaskOutput>(db, "test");
      await storage.setupDatabase();
      const limiter = new SqliteRateLimiter(db, "test", {
        maxExecutions: 4,
        windowSizeInSeconds: 1,
      });
      limiter.ensureTableExists();

      const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(
        AiJob<AiJobInput<TaskInput>, TaskOutput>,
        {
          storage,
          queueName: HF_TRANSFORMERS_ONNX,
          limiter,
          pollIntervalMs: 1,
        }
      );

      const client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
        storage,
        queueName: HF_TRANSFORMERS_ONNX,
      });

      client.attach(server);

      queueRegistry.registerQueue({ server, client, storage });

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

      const registeredQueue = queueRegistry.getQueue(HF_TRANSFORMERS_ONNX);
      expect(registeredQueue).toBeDefined();
      expect(registeredQueue?.server.queueName).toEqual(HF_TRANSFORMERS_ONNX);

      const workflow = new Workflow();
      workflow.DownloadModel({
        model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      });
      workflow.run();
      await sleep(1);
      expect(await registeredQueue?.client.size()).toEqual(1);
      workflow.reset();
      await registeredQueue?.storage.deleteAll();
    });
  });

  afterAll(async () => {
    getTaskQueueRegistry().stopQueues().clearQueues();
    setTaskQueueRegistry(null);
  });
});
