//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { afterAll, describe, expect, it } from "bun:test";
import {
  getTaskQueueRegistry,
  setTaskQueueRegistry,
  TaskGraphBuilder,
  TaskInput,
  TaskOutput,
} from "@ellmers/task-graph";
import { getGlobalModelRepository, Model, AiJob, setGlobalModelRepository } from "@ellmers/ai";
import { InMemoryModelRepository } from "@ellmers/ai";
import { SqliteJobQueue } from "@ellmers/job-queue";
import { registerMediaPipeTfJsLocalTasks } from "../bindings/registerTasks";
import { sleep } from "@ellmers/task-graph";
import { MEDIA_PIPE_TFJS_MODEL } from "../model/MediaPipeModel";
import { InMemoryJobQueue, ConcurrencyLimiter } from "@ellmers/job-queue";

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
    it("should not fail", async () => {
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new InMemoryJobQueue<TaskInput, TaskOutput>(
        MEDIA_PIPE_TFJS_MODEL,
        new ConcurrencyLimiter(1, 10),
        AiJob<TaskInput, TaskOutput>,
        10
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
      expect(queue?.queue).toEqual(MEDIA_PIPE_TFJS_MODEL);

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
      getGlobalModelRepository().addModel(universal_sentence_encoder);
      getGlobalModelRepository().connectTaskToModel(
        "TextEmbeddingTask",
        universal_sentence_encoder.name
      );

      const jobQueue = new SqliteJobQueue<TaskInput, TaskOutput>(
        getDatabase(":memory:"),
        MEDIA_PIPE_TFJS_MODEL,
        new ConcurrencyLimiter(1, 10),
        AiJob<TaskInput, TaskOutput>,
        10
      );
      jobQueue.ensureTableExists();

      getTaskQueueRegistry().registerQueue(jobQueue);
      const queue = getTaskQueueRegistry().getQueue(MEDIA_PIPE_TFJS_MODEL);
      expect(queue).toBeDefined();
      expect(queue?.queue).toEqual(MEDIA_PIPE_TFJS_MODEL);

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
