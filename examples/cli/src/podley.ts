#!/usr/bin/env bun

import { register_HFT_InlineJobFns, register_TFMP_InlineJobFns } from "@podley/ai-provider";
import { getTaskQueueRegistry } from "@podley/task-graph";
import {
  register_HFT_InMemoryQueue,
  register_TFMP_InMemoryQueue,
  registerHuggingfaceLocalModels,
  registerMediaPipeTfJsLocalModels,
} from "@podley/test";
import { program } from "commander";
import { AddBaseCommands } from "./TaskCLI";

program.version("1.0.0").description("A CLI to run tasks.");

AddBaseCommands(program);

await registerHuggingfaceLocalModels();
await register_HFT_InlineJobFns();
await register_HFT_InMemoryQueue();

// await registerMediaPipeTfJsLocalModels();
// await register_TFMP_InlineJobFns();
// await register_TFMP_InMemoryQueue();

program.parse(process.argv);

getTaskQueueRegistry().stopQueues();
