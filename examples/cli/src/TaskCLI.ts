//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { Command } from "commander";
import { runTask } from "./TaskGraphToUI";
import "@huggingface/transformers";
import { TaskGraph, Workflow, JsonTaskItem } from "@ellmers/task-graph";
import { DownloadModelTask, getGlobalModelRepository } from "@ellmers/ai";
import { JsonTask } from "@ellmers/tasks";

export function AddBaseCommands(program: Command) {
  program
    .command("download")
    .description("download models")
    .requiredOption("--model <name>", "model to download")
    .action(async (options) => {
      const graph = new TaskGraph();
      if (options.model) {
        const model = await getGlobalModelRepository().findByName(options.model);
        if (model) {
          graph.addTask(new DownloadModelTask({ input: { model: model.name } }));
        } else {
          program.error(`Unknown model ${options.model}`);
        }
      }
      try {
        await runTask(graph);
      } catch (error) {
        console.error("Error running download task:", error);
      }
    });

  program
    .command("embedding")
    .description("get a embedding vector for a piece of text")
    .argument("<text>", "text to embed")
    .option("--model <name>", "model to use")
    .action(async (text: string, options) => {
      const model = options.model
        ? (await getGlobalModelRepository().findByName(options.model))?.name
        : (await getGlobalModelRepository().findModelsByTask("TextEmbeddingTask"))?.map(
            (m) => m.name
          );

      if (!model) {
        program.error(`Unknown model ${options.model}`);
      } else {
        const workflow = new Workflow();
        workflow.TextEmbedding({ model, text });
        try {
          await runTask(workflow.graph);
        } catch (error) {
          console.error("Error running embedding task:", error);
        }
      }
    });

  program
    .command("summarize")
    .description("summarize text")
    .argument("<text>", "text to embed")
    .option("--model <name>", "model to use")
    .action(async (text, options) => {
      const model = options.model
        ? (await getGlobalModelRepository().findByName(options.model))?.name
        : (await getGlobalModelRepository().findModelsByTask("TextSummaryTask"))?.map(
            (m) => m.name
          );
      if (!model) {
        program.error(`Unknown model ${options.model}`);
      } else {
        const workflow = new Workflow();
        workflow.TextSummary({ model, text });
        try {
          await runTask(workflow.graph);
        } catch (error) {
          console.error("Error running summary task:", error);
        }
      }
    });

  program
    .command("rewrite")
    .description("rewrite text")
    .argument("<text>", "text to rewrite")
    .option("--prompt <prompt>", "instruction for how to rewrite", "")
    .option("--model <name>", "model to use")
    .action(async (text, options) => {
      const model = options.model
        ? (await getGlobalModelRepository().findByName(options.model))?.name
        : (await getGlobalModelRepository().findModelsByTask("TextRewriterTask"))?.map(
            (m) => m.name
          );
      if (!model) {
        program.error(`Unknown model ${options.model}`);
      } else {
        const workflow = new Workflow();
        workflow.TextRewriter({ model, text, prompt: options.prompt });
        try {
          await runTask(workflow.graph);
        } catch (error) {
          console.error("Error running rewriter task:", error);
        }
      }
    });

  program
    .command("json")
    .description("run based on json input")
    .argument("[json]", "json text to rewrite and vectorize")
    .action(async (json) => {
      if (!json) {
        const exampleJson: JsonTaskItem[] = [
          {
            id: "1",
            type: "DownloadModelTask",
            name: "Download Model",
            input: {
              model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
            },
          },
          {
            id: "2",
            type: "TextRewriterTask",
            name: "Rewrite Text",
            input: {
              text: "The quick brown fox jumps over the lazy dog at the party.",
              prompt: "Rewrite the following text in reverse:",
            },
            dependencies: {
              model: {
                id: "1",
                output: "model",
              },
            },
          },
        ];
        json = JSON.stringify(exampleJson);
      }
      const task = new JsonTask({ name: "JSON Task Example", input: { json } });
      const graph = new TaskGraph();
      graph.addTask(task);
      try {
        await runTask(graph);
      } catch (error) {
        console.error("Error running JSON task:", error);
      }
    });

  program
    .command("workflow")
    .description("run based on workflow")
    .action(async () => {
      const workflow = new Workflow();
      workflow
        .DownloadModel({ model: "onnx:Xenova/LaMini-Flan-T5-783M:q8" })
        .TextEmbedding({
          text: "The quick brown fox jumps over the lazy dog.",
        })
        .rename("vector", "message")
        .DebugLog();

      try {
        await runTask(workflow.graph);
      } catch (error) {}
    });
}
