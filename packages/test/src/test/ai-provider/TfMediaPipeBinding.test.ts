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
  Model,
  setGlobalModelRepository,
} from "@ellmers/ai";
import {
  MEDIA_PIPE_TFJS_MODEL,
  registerMediaPipeTfJsLocalTasks,
} from "@ellmers/ai-provider/tf-mediapipe";
import { ConcurrencyLimiter, JobQueue, SqliteRateLimiter } from "@ellmers/job-queue";
import { InMemoryQueueStorage, SqliteQueueStorage } from "@ellmers/storage";
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

describe("TfMediaPipeBinding", () => {
  beforeEach(() => {
    setTaskQueueRegistry(null);
  });

  describe("InMemoryJobQueue", () => {
    it("should initialize without errors", async () => {
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        MEDIA_PIPE_TFJS_MODEL,
        AiJob<TaskInput, TaskOutput>,
        {
          storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
            MEDIA_PIPE_TFJS_MODEL
          ),
          limiter: new ConcurrencyLimiter(1, 10),
          waitDurationInMilliseconds: 1,
        }
      );
      queueRegistry.registerQueue(jobQueue);

      registerMediaPipeTfJsLocalTasks();
      setGlobalModelRepository(new InMemoryModelRepository());

      const universal_sentence_encoder: Model = {
        name: "media-pipe:Universal Sentence Encoder",
        url: "https://storage.googleapis.com/mediapipe-tasks/text_embedder/universal_sentence_encoder.tflite",
        nativeDimensions: 100,
        availableOnBrowser: true,
        availableOnServer: false,
        provider: MEDIA_PIPE_TFJS_MODEL,
      };
      await getGlobalModelRepository().addModel(universal_sentence_encoder);
      await getGlobalModelRepository().connectTaskToModel(
        "TextEmbeddingTask",
        universal_sentence_encoder.name
      );

      const queue = queueRegistry.getQueue(MEDIA_PIPE_TFJS_MODEL);
      expect(queue).toBeDefined();
      expect(queue?.queueName).toEqual(MEDIA_PIPE_TFJS_MODEL);

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
      registerMediaPipeTfJsLocalTasks();
      setGlobalModelRepository(new InMemoryModelRepository());
      const universal_sentence_encoder: Model = {
        name: "media-pipe:Universal Sentence Encoder",
        url: "https://storage.googleapis.com/mediapipe-tasks/text_embedder/universal_sentence_encoder.tflite",
        nativeDimensions: 100,
        availableOnBrowser: true,
        availableOnServer: false,
        provider: MEDIA_PIPE_TFJS_MODEL,
      };
      await getGlobalModelRepository().addModel(universal_sentence_encoder);
      await getGlobalModelRepository().connectTaskToModel(
        "TextEmbeddingTask",
        universal_sentence_encoder.name
      );

      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        MEDIA_PIPE_TFJS_MODEL,
        AiJob<TaskInput, TaskOutput>,
        {
          storage: new SqliteQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
            db,
            MEDIA_PIPE_TFJS_MODEL
          ),
          limiter: new SqliteRateLimiter(db, MEDIA_PIPE_TFJS_MODEL, 4, 1),
          waitDurationInMilliseconds: 1,
        }
      );

      getTaskQueueRegistry().registerQueue(jobQueue);
      const queue = getTaskQueueRegistry().getQueue(MEDIA_PIPE_TFJS_MODEL);
      expect(queue).toBeDefined();
      expect(queue?.queueName).toEqual(MEDIA_PIPE_TFJS_MODEL);

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
