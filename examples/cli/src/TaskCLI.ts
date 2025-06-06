//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { Command } from "commander";
import { runTasks } from "./TaskGraphToUI";
import { TaskGraph, Workflow, JsonTaskItem } from "@podley/task-graph";
import { DownloadModelTask, getGlobalModelRepository } from "@podley/ai";
import { DelayTask, JsonTask } from "@podley/tasks";

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
          graph.addTask(new DownloadModelTask({ model: model.name }));
        } else {
          program.error(`Unknown model ${options.model}`);
        }
      }
      try {
        await runTasks(graph);
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
          await runTasks(workflow);
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
          await runTasks(workflow);
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
          await runTasks(workflow);
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
      const task = new JsonTask({ json }, { name: "JSON Task Example" });
      const graph = task.subGraph;
      if (!graph) {
        program.error("Task has no sub-graph");
      }
      try {
        await runTasks(graph);
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
        .TextGeneration({
          prompt: "Where in the sky is the sun?",
        })
        .rename("*", "console")
        .DebugLog();

      try {
        await runTasks(workflow);
      } catch (error) {
        console.error("Error running workflow:", error);
      }
    });

  program
    .command("delay")
    .description("delay for a given number of seconds")
    .option("--seconds <seconds>", "time to delay")
    .action(async (options) => {
      const task = new DelayTask({ delay: parseInt(options.seconds) || 2000 });
      try {
        await runTasks(task);
      } catch (error) {
        console.error("Error running delay task:", error);
      }
    });
}
