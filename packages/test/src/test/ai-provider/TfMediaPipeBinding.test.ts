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
  Model,
  setGlobalModelRepository,
} from "@workglow/ai";
import { register_TFMP_InlineJobFns, TENSORFLOW_MEDIAPIPE } from "@workglow/ai-provider";
import { ConcurrencyLimiter, JobQueue, SqliteRateLimiter } from "@workglow/job-queue";
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

describe("TfMediaPipeBinding", () => {
  beforeEach(() => {
    setTaskQueueRegistry(null);
  });

  describe("InMemoryJobQueue", () => {
    it("should initialize without errors", async () => {
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new JobQueue<AiJobInput<TaskInput>, TaskOutput>(
        TENSORFLOW_MEDIAPIPE,
        AiJob<AiJobInput<TaskInput>, TaskOutput>,
        {
          storage: new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
            TENSORFLOW_MEDIAPIPE
          ),
          limiter: new ConcurrencyLimiter(1, 10),
          waitDurationInMilliseconds: 1,
        }
      );
      queueRegistry.registerQueue(jobQueue);

      register_TFMP_InlineJobFns();
      setGlobalModelRepository(new InMemoryModelRepository());

      const universal_sentence_encoder: Model = {
        name: "media-pipe:Universal Sentence Encoder",
        url: "https://storage.googleapis.com/mediapipe-tasks/text_embedder/universal_sentence_encoder.tflite",
        nativeDimensions: 100,
        availableOnBrowser: true,
        availableOnServer: false,
        provider: TENSORFLOW_MEDIAPIPE,
      };
      await getGlobalModelRepository().addModel(universal_sentence_encoder);
      await getGlobalModelRepository().connectTaskToModel(
        "TextEmbeddingTask",
        universal_sentence_encoder.name
      );

      const queue = queueRegistry.getQueue(TENSORFLOW_MEDIAPIPE);
      expect(queue).toBeDefined();
      expect(queue?.queueName).toEqual(TENSORFLOW_MEDIAPIPE);

      const workflow = new Workflow();
      workflow.DownloadModel({
        model: "media-pipe:Universal Sentence Encoder",
      });
      workflow.run();
      await sleep(1);
      expect(await queue?.size()).toEqual(1);
      workflow.reset();
      await queue?.clear();
    });
  });

  describe("SqliteJobQueue", () => {
    it("should not fail", async () => {
      register_TFMP_InlineJobFns();
      setGlobalModelRepository(new InMemoryModelRepository());
      const universal_sentence_encoder: Model = {
        name: "media-pipe:Universal Sentence Encoder",
        url: "https://storage.googleapis.com/mediapipe-tasks/text_embedder/universal_sentence_encoder.tflite",
        nativeDimensions: 100,
        availableOnBrowser: true,
        availableOnServer: false,
        provider: TENSORFLOW_MEDIAPIPE,
      };
      await getGlobalModelRepository().addModel(universal_sentence_encoder);
      await getGlobalModelRepository().connectTaskToModel(
        "TextEmbeddingTask",
        universal_sentence_encoder.name
      );

      const storage = new SqliteQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
        db,
        TENSORFLOW_MEDIAPIPE
      );
      await storage.setupDatabase();
      const limiter = new SqliteRateLimiter(db, TENSORFLOW_MEDIAPIPE, {
        maxExecutions: 4,
        windowSizeInSeconds: 1,
      });
      limiter.ensureTableExists();
      const jobQueue = new JobQueue<AiJobInput<TaskInput>, TaskOutput>(
        TENSORFLOW_MEDIAPIPE,
        AiJob<AiJobInput<TaskInput>, TaskOutput>,
        {
          storage: storage,
          limiter: limiter,
          waitDurationInMilliseconds: 1,
        }
      );

      getTaskQueueRegistry().registerQueue(jobQueue);
      const queue = getTaskQueueRegistry().getQueue(TENSORFLOW_MEDIAPIPE);
      expect(queue).toBeDefined();
      expect(queue?.queueName).toEqual(TENSORFLOW_MEDIAPIPE);

      const workflow = new Workflow();
      workflow.DownloadModel({
        model: "media-pipe:Universal Sentence Encoder",
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
