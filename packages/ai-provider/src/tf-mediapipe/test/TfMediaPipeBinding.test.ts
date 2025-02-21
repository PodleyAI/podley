//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { afterAll, describe, expect, it } from "bun:test";
import {
  AiJob,
  getGlobalModelRepository,
  InMemoryModelRepository,
  Model,
  setGlobalModelRepository,
} from "@ellmers/ai";
import {
  ConcurrencyLimiter,
  IJobQueue,
  InMemoryQueueStorage,
  JobQueue,
  SqliteQueueStorage,
  SqliteRateLimiter,
} from "@ellmers/job-queue";
import {
  getTaskQueueRegistry,
  setTaskQueueRegistry,
  TaskGraphBuilder,
  TaskInput,
  TaskOutput,
} from "@ellmers/task-graph";
import { sleep } from "@ellmers/util";
import { registerMediaPipeTfJsLocalTasks } from "../bindings/registerTasks";
import { MEDIA_PIPE_TFJS_MODEL } from "../model/MediaPipeModel";
import { AiProviderInput } from "@ellmers/ai";

const wrapper = function () {
  if (process["isBun"]) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("bun:sqlite").Database;
  }

  return require("better-sqlite3");
};

const module = wrapper();

let db: any;

export function getDatabase(name = ":memory:"): any {
  if (!db) {
    db = new module(name);
  }
  return db;
}

describe("TfMediaPipeBinding", () => {
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

      const builder = new TaskGraphBuilder();
      builder.DownloadModel({
        model: "media-pipe:Universal Sentence Encoder",
      });
      builder.run();
      await sleep(1);
      expect(await queue?.size()).toEqual(1);
      builder.reset();
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
            getDatabase(":memory:"),
            MEDIA_PIPE_TFJS_MODEL
          ),
          limiter: new SqliteRateLimiter(getDatabase(":memory:"), MEDIA_PIPE_TFJS_MODEL, 4, 1),
          waitDurationInMilliseconds: 1,
        }
      );

      getTaskQueueRegistry().registerQueue(jobQueue);
      const queue = getTaskQueueRegistry().getQueue(MEDIA_PIPE_TFJS_MODEL);
      expect(queue).toBeDefined();
      expect(queue?.queueName).toEqual(MEDIA_PIPE_TFJS_MODEL);

      const builder = new TaskGraphBuilder();
      builder.DownloadModel({
        model: "media-pipe:Universal Sentence Encoder",
      });
      builder.run();
      await sleep(1);
      expect(await queue?.size()).toEqual(1);
      builder.reset();
      await queue?.clear();
    });
  });

  afterAll(async () => {
    getTaskQueueRegistry().stopQueues().clearQueues();
    setTaskQueueRegistry(null);
  });
});
