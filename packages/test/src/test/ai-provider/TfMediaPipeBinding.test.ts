//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  AiJob,
  AiProviderInput,
  getGlobalModelRepository,
  InMemoryModelRepository,
  Model,
  setGlobalModelRepository,
} from "@podley/ai";
import { TENSORFLOW_MEDIAPIPE, register_TFMP_InlineJobFns } from "@podley/ai-provider";
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

describe("TfMediaPipeBinding", () => {
  beforeEach(() => {
    setTaskQueueRegistry(null);
  });

  describe("InMemoryJobQueue", () => {
    it("should initialize without errors", async () => {
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        TENSORFLOW_MEDIAPIPE,
        AiJob<TaskInput, TaskOutput>,
        {
          storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
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

      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        TENSORFLOW_MEDIAPIPE,
        AiJob<TaskInput, TaskOutput>,
        {
          storage: new SqliteQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
            db,
            TENSORFLOW_MEDIAPIPE
          ),
          limiter: new SqliteRateLimiter(db, TENSORFLOW_MEDIAPIPE, {
            maxExecutions: 4,
            windowSizeInSeconds: 1,
          }),
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
