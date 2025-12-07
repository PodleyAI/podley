#!/usr/bin/env bun

import { register_HFT_ClientJobFns } from "@workglow/ai-provider";
import { getTaskQueueRegistry } from "@workglow/task-graph";
import { registerHuggingfaceLocalModels } from "@workglow/test";
import { program } from "commander";
import { AddBaseCommands } from "./TaskCLI";

program.version("1.0.0").description("A CLI to run tasks.");

AddBaseCommands(program);

await registerHuggingfaceLocalModels();
await register_HFT_ClientJobFns(
  new Worker(new URL("./worker_hft.ts", import.meta.url), { type: "module" })
);

// await registerMediaPipeTfJsLocalModels();
// await register_TFMP_ClientJobFns(
//   new Worker(new URL("./worker_tfmp.ts", import.meta.url), { type: "module" })
// );

await program.parseAsync(process.argv);

getTaskQueueRegistry().stopQueues();
