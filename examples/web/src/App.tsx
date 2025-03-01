//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React, { useCallback, useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { JsonTask } from "@ellmers/tasks";
import {
  JsonTaskItem,
  TaskGraph,
  Workflow,
  TaskInput,
  TaskOutput,
  getTaskQueueRegistry,
  IndexedDbTaskGraphRepository,
  IndexedDbTaskOutputRepository,
} from "@ellmers/task-graph";
import { ConcurrencyLimiter, JobQueue } from "@ellmers/job-queue";
import {
  LOCAL_ONNX_TRANSFORMERJS,
  registerHuggingfaceLocalTasks,
} from "@ellmers/ai-provider/hf-transformers";
import {
  MEDIA_PIPE_TFJS_MODEL,
  registerMediaPipeTfJsLocalTasks,
} from "@ellmers/ai-provider/tf-mediapipe";
import { registerMediaPipeTfJsLocalModels, registerHuggingfaceLocalModels } from "@ellmers/test";
import { env } from "@huggingface/transformers";
import { AiJob } from "@ellmers/ai";

import { RunGraphFlow } from "./RunGraphFlow";
import { JsonEditor } from "./JsonEditor";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./Resize";
import { QueuesStatus } from "./QueueStatus";
import { OutputRepositoryStatus } from "./OutputRepositoryStatus";
import { GraphStoreStatus } from "./GraphStoreStatus";

env.backends.onnx.wasm.proxy = true;

const queueRegistry = getTaskQueueRegistry();

registerHuggingfaceLocalTasks();
queueRegistry.registerQueue(
  new JobQueue<TaskInput, TaskOutput>(LOCAL_ONNX_TRANSFORMERJS, AiJob<TaskInput, TaskOutput>, {
    limiter: new ConcurrencyLimiter(1, 10),
  })
);

registerMediaPipeTfJsLocalTasks();
queueRegistry.registerQueue(
  new JobQueue<TaskInput, TaskOutput>(MEDIA_PIPE_TFJS_MODEL, AiJob<TaskInput, TaskOutput>, {
    limiter: new ConcurrencyLimiter(1, 10),
  })
);

queueRegistry.clearQueues();
queueRegistry.startQueues();

const taskOutputCache = new IndexedDbTaskOutputRepository();
const workflow = new Workflow(taskOutputCache);
const run = workflow.run.bind(workflow);
workflow.run = async () => {
  console.log("Running task graph...");
  try {
    const result = await run();
    console.log("Task graph complete.");
    return result;
  } catch (error) {
    console.error("Task graph error:", error);
    throw error;
  }
};

const taskGraphRepo = new IndexedDbTaskGraphRepository();
const graph = await taskGraphRepo.getTaskGraph("default");
const resetGraph = () => {
  workflow
    .reset()
    .DownloadModel({ model: ["onnx:Xenova/LaMini-Flan-T5-783M:q8", "onnx:Xenova/m2m100_418M:q8"] })
    .TextRewriter({
      text: "The quick brown fox jumps over the lazy dog.",
      prompt: ["Rewrite the following text in reverse:", "Rewrite this to sound like a pirate:"],
    })
    .TextTranslation({
      model: "onnx:Xenova/m2m100_418M:q8",
      source_lang: "en",
      target_lang: "es",
    })
    .rename("*", "messages")
    .rename("*", "messages", -2)
    .DebugLog({ log_level: "info" });
  taskGraphRepo.saveTaskGraph("default", workflow.graph);
};

if (graph) {
  workflow.graph = graph;
} else {
  resetGraph();
}

workflow.on("changed", () => {
  taskGraphRepo.saveTaskGraph("default", workflow.graph);
});
workflow.on("reset", () => {
  taskGraphRepo.saveTaskGraph("default", workflow.graph);
});
taskGraphRepo.on("graph_cleared", () => {
  resetGraph();
});
const initialJsonObj: JsonTaskItem[] = workflow.toDependencyJSON();
const initialJson = JSON.stringify(initialJsonObj, null, 2);

// console access. what happens there will be reflected in the UI
window["workflow"] = workflow;
window["workflow"] = workflow;

export const App = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAborting, setIsAborting] = useState<boolean>(false);
  const [graph, setGraph] = useState<TaskGraph>(workflow.graph);
  const [jsonData, setJsonData] = useState<string>(initialJson);

  // changes coming from workflow in console
  useEffect(() => {
    async function init() {
      await registerHuggingfaceLocalModels();
      await registerMediaPipeTfJsLocalModels();
    }
    init();

    function listen() {
      setJsonData(JSON.stringify(workflow.toDependencyJSON(), null, 2));
      setGraph(workflow.graph);
    }
    workflow.on("changed", listen);
    workflow.on("reset", listen);
    listen();
    return () => {
      workflow.off("changed", listen);
      workflow.off("reset", listen);
    };
  }, []);

  useEffect(() => {
    function start() {
      setIsRunning(true);
    }
    function complete() {
      setIsRunning(false);
      setIsAborting(false);
    }
    function abort() {
      setIsAborting(true);
    }
    workflow.on("start", start);
    workflow.on("complete", complete);
    workflow.on("error", complete);
    workflow.on("abort", abort);
    return () => {
      workflow.off("start", start);
      workflow.off("complete", complete);
      workflow.off("error", complete);
      workflow.off("abort", abort);
    };
  }, []);

  const setNewJson = useCallback((json: string) => {
    const task = new JsonTask({ input: { json: json } });
    workflow.graph = task.subGraph;
    setJsonData(json);
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>
        <ReactFlowProvider>
          <RunGraphFlow graph={graph} />
        </ReactFlowProvider>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={30}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={82}>
            <JsonEditor
              json={jsonData}
              onJsonChange={setNewJson}
              run={() => workflow.run()}
              stop={() => workflow.abort()}
              running={isRunning}
              aborting={isAborting}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel style={{ backgroundColor: "#222", color: "#bbb", padding: "10px" }}>
            <QueuesStatus />
            <hr className="my-2 border-[#777]" />
            <OutputRepositoryStatus repository={taskOutputCache} />
            <hr className="my-2 border-[#777]" />
            <GraphStoreStatus repository={taskGraphRepo} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
