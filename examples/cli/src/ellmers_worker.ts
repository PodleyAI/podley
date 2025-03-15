#!/usr/bin/env bun

import { register_HFT_ClientJobFns, register_TFMP_InlineJobFns } from "@ellmers/ai-provider";
import { getTaskQueueRegistry } from "@ellmers/task-graph";
import {
  register_HFT_InMemoryQueue,
  register_TFMP_InMemoryQueue,
  registerHuggingfaceLocalModels,
  registerMediaPipeTfJsLocalModels,
} from "@ellmers/test";
import { argv } from "bun";
import { program } from "commander";
import { AddBaseCommands } from "./TaskCLI";

program.version("1.0.0").description("A CLI to run Ellmers.");

AddBaseCommands(program);

await registerHuggingfaceLocalModels();
await register_HFT_ClientJobFns(
  new Worker(new URL("./worker_hft.ts", import.meta.url), {
    // @ts-ignore
    preload: new URL("./worker_error.ts", import.meta.url).href,
  })
);
await register_HFT_InMemoryQueue();

await registerMediaPipeTfJsLocalModels();
await register_TFMP_InlineJobFns();
await register_TFMP_InMemoryQueue();

await program.parseAsync(argv);

getTaskQueueRegistry().stopQueues();
