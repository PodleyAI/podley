#!/usr/bin/env bun

import { register_HFT_ClientJobFns } from "@workglow/ai-provider";
import { getTaskQueueRegistry } from "@workglow/task-graph";
import { register_HFT_InMemoryQueue, registerHuggingfaceLocalModels } from "@workglow/test";
import { program } from "commander";
import { AddBaseCommands } from "./TaskCLI";

program.version("1.0.0").description("A CLI to run tasks.");

AddBaseCommands(program);

await registerHuggingfaceLocalModels();
await register_HFT_ClientJobFns(
  new Worker(new URL("./worker_hft.ts", import.meta.url), { type: "module" })
);
await register_HFT_InMemoryQueue();

// await registerMediaPipeTfJsLocalModels();
// await register_TFMP_InlineJobFns();
// await register_TFMP_InMemoryQueue();

await program.parseAsync(process.argv);

getTaskQueueRegistry().stopQueues();
