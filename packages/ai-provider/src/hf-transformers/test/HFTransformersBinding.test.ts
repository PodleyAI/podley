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
import { AiJob, getGlobalModelRepository, setGlobalModelRepository } from "@ellmers/ai";
import { InMemoryModelRepository } from "@ellmers/ai";
import { SqliteJobQueue } from "@ellmers/job-queue";
import { registerHuggingfaceLocalTasks } from "../bindings/registerTasks";
import { sleep } from "bun";
import { LOCAL_ONNX_TRANSFORMERJS } from "../model/ONNXTransformerJsModel";
import { ConcurrencyLimiter, InMemoryJobQueue } from "@ellmers/job-queue";

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

describe("HFTransformersBinding", () => {
  describe("InMemoryJobQueue", () => {
    it("Should have an item queued", async () => {
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new InMemoryJobQueue<TaskInput, TaskOutput>(
        LOCAL_ONNX_TRANSFORMERJS,
        new ConcurrencyLimiter(1, 10),
        AiJob<TaskInput, TaskOutput>,
        10
      );
      queueRegistry.registerQueue(jobQueue);

      registerHuggingfaceLocalTasks();
      setGlobalModelRepository(new InMemoryModelRepository());

      const model = {
        name: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
        url: "Xenova/LaMini-Flan-T5-783M",
        availableOnBrowser: true,
        availableOnServer: true,
        provider: LOCAL_ONNX_TRANSFORMERJS,
        pipeline: "text2text-generation",
      };

      await getGlobalModelRepository().addModel(model);
      await getGlobalModelRepository().connectTaskToModel("TextGenerationTask", model.name);
      await getGlobalModelRepository().connectTaskToModel("TextRewriterTask", model.name);

      const queue = queueRegistry.getQueue(LOCAL_ONNX_TRANSFORMERJS);
      expect(queue).toBeDefined();
      expect(queue!.queueName).toEqual(LOCAL_ONNX_TRANSFORMERJS);

      const builder = new TaskGraphBuilder();
      builder.DownloadModel({
        model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      });
      builder.run();
      await sleep(1);
      expect(await queue?.size()).toEqual(1);
      builder.reset();
      await queue?.clear();
    });
  });

  describe("SqliteJobQueue", () => {
    it("Should have an item queued", async () => {
      registerHuggingfaceLocalTasks();
      setGlobalModelRepository(new InMemoryModelRepository());

      const model = {
        name: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
        url: "Xenova/LaMini-Flan-T5-783M",
        availableOnBrowser: true,
        availableOnServer: true,
        provider: LOCAL_ONNX_TRANSFORMERJS,
        pipeline: "text2text-generation",
      };

      await getGlobalModelRepository().addModel(model);
      await getGlobalModelRepository().connectTaskToModel("TextGenerationTask", model.name);
      await getGlobalModelRepository().connectTaskToModel("TextRewriterTask", model.name);

      const jobQueue = new SqliteJobQueue<TaskInput, TaskOutput>(
        getDatabase(":memory:"),
        LOCAL_ONNX_TRANSFORMERJS,
        new ConcurrencyLimiter(1, 10),
        AiJob<TaskInput, TaskOutput>,
        10
      );

      getTaskQueueRegistry().registerQueue(jobQueue);
      const queue = getTaskQueueRegistry().getQueue(LOCAL_ONNX_TRANSFORMERJS);
      expect(queue).toBeDefined();
      expect(queue?.queueName).toEqual(LOCAL_ONNX_TRANSFORMERJS);

      const builder = new TaskGraphBuilder();
      builder.DownloadModel({
        model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
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
