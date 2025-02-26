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
  setGlobalModelRepository,
} from "@ellmers/ai";
import { ConcurrencyLimiter, JobQueue, SqliteRateLimiter } from "@ellmers/job-queue";
import {
  getTaskQueueRegistry,
  setTaskQueueRegistry,
  Workflow,
  TaskInput,
  TaskOutput,
} from "@ellmers/task-graph";
import { sleep } from "@ellmers/util";
import { registerHuggingfaceLocalTasks } from "../bindings/registerTasks";
import { LOCAL_ONNX_TRANSFORMERJS } from "../model/ONNXTransformerJsModel";
import { AiProviderInput } from "@ellmers/ai";
import { SqliteQueueStorage } from "@ellmers/storage";

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
      registerHuggingfaceLocalTasks();
      setGlobalModelRepository(new InMemoryModelRepository());
      const queueRegistry = getTaskQueueRegistry();
      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        LOCAL_ONNX_TRANSFORMERJS,
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
        provider: LOCAL_ONNX_TRANSFORMERJS,
        pipeline: "text2text-generation",
      };

      await getGlobalModelRepository().addModel(model);
      await getGlobalModelRepository().connectTaskToModel("TextGenerationTask", model.name);
      await getGlobalModelRepository().connectTaskToModel("TextRewriterTask", model.name);

      const queue = queueRegistry.getQueue(LOCAL_ONNX_TRANSFORMERJS);
      expect(queue).toBeDefined();
      expect(queue!.queueName).toEqual(LOCAL_ONNX_TRANSFORMERJS);

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

      const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
        "test",
        AiJob<TaskInput, TaskOutput>,
        {
          storage: new SqliteQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
            getDatabase(":memory:"),
            "test"
          ),
          limiter: new SqliteRateLimiter(getDatabase(":memory:"), "test", 4, 1),
          waitDurationInMilliseconds: 1,
        }
      );

      getTaskQueueRegistry().registerQueue(jobQueue);
      const queue = getTaskQueueRegistry().getQueue(LOCAL_ONNX_TRANSFORMERJS);
      expect(queue).toBeDefined();
      expect(queue?.queueName).toEqual(LOCAL_ONNX_TRANSFORMERJS);

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
