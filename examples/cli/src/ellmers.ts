#!/usr/bin/env bun

import { program } from "commander";
import { AddBaseCommands } from "./TaskCLI";
import {
  registerHuggingfaceLocalModels,
  registerHFTJobFnsInMemoryQueue,
  registerTFMPInMemoryQueue,
  registerMediaPipeTfJsLocalModels,
} from "@ellmers/test";
import { getTaskQueueRegistry } from "@ellmers/task-graph";
import { registerHFTInlineJobFns } from "@ellmers/ai-provider/hf-transformers/inline";
import { registerTFMPInlineJobFns } from "@ellmers/ai-provider/tf-mediapipe/inline";
import { argv } from "bun";

program.version("1.0.0").description("A CLI to run Ellmers.");

AddBaseCommands(program);

// const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
// const worker = new Worker(new URL("./worker_hft.ts", import.meta.url), {
//   // @ts-ignore
//   preload: new URL("./worker_error.ts", import.meta.url).href,
// });
// workerManager.registerWorker(HF_TRANSFORMERS_ONNX, worker);

await registerHuggingfaceLocalModels();
await registerHFTInlineJobFns();
await registerHFTJobFnsInMemoryQueue();

await registerMediaPipeTfJsLocalModels();
await registerTFMPInlineJobFns();
await registerTFMPInMemoryQueue();

await program.parseAsync(argv);

getTaskQueueRegistry().stopQueues();
