#!/usr/bin/env bun

import { program } from "commander";
import { AddBaseCommands } from "./TaskCLI";
import {
  registerHuggingfaceLocalModels,
  registerHuggingfaceLocalTasksInMemory,
  registerMediaPipeTfJsLocalInMemory,
  registerMediaPipeTfJsLocalModels,
} from "@ellmers/test";
import { getTaskQueueRegistry } from "@ellmers/task-graph";
import { registerHuggingfaceLocalTasks } from "@ellmers/ai-provider/hf-transformers/inline";
import { registerMediaPipeTfJsLocalTasks } from "@ellmers/ai-provider/tf-mediapipe/inline";
import { argv } from "bun";

program.version("1.0.0").description("A CLI to run Ellmers.");

AddBaseCommands(program);

// const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
// const worker = new Worker(new URL("./worker_hft.ts", import.meta.url), {
//   // @ts-ignore
//   preload: new URL("./worker_error.ts", import.meta.url).href,
// });
// workerManager.registerWorker(ONNX_TRANSFORMERJS, worker);

await registerHuggingfaceLocalModels();
await registerHuggingfaceLocalTasks();
await registerHuggingfaceLocalTasksInMemory();

await registerMediaPipeTfJsLocalModels();
await registerMediaPipeTfJsLocalTasks();
await registerMediaPipeTfJsLocalInMemory();

await program.parseAsync(argv);

getTaskQueueRegistry().stopQueues();
