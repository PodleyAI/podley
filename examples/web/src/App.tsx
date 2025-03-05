//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { useCallback, useEffect, useState } from "react";
import { env } from "@huggingface/transformers";
import { ReactFlowProvider } from "@xyflow/react";
import { AiJob } from "@ellmers/ai";
import {
  ONNX_TRANSFORMERJS,
  registerHuggingfaceLocalTasks,
} from "@ellmers/ai-provider/hf-transformers";
import {
  MEDIA_PIPE_TFJS_MODEL,
  registerMediaPipeTfJsLocalTasks,
} from "@ellmers/ai-provider/tf-mediapipe";
import { ConcurrencyLimiter, JobQueue } from "@ellmers/job-queue";
import {
  getTaskQueueRegistry,
  IndexedDbTaskGraphRepository,
  IndexedDbTaskOutputRepository,
  JsonTaskItem,
  TaskGraph,
  TaskInput,
  TaskOutput,
  Workflow,
} from "@ellmers/task-graph";
import { JsonTask } from "@ellmers/tasks";
import { registerHuggingfaceLocalModels, registerMediaPipeTfJsLocalModels } from "@ellmers/test";
import { GraphStoreStatus } from "./GraphStoreStatus";
import { JsonEditor } from "./JsonEditor";
import { OutputRepositoryStatus } from "./OutputRepositoryStatus";
import { QueuesStatus } from "./QueueStatus";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./Resize";
import { RunGraphFlow } from "./RunGraphFlow";

env.backends.onnx.wasm.proxy = true;

const queueRegistry = getTaskQueueRegistry();

registerHuggingfaceLocalTasks();
queueRegistry.registerQueue(
  new JobQueue<TaskInput, TaskOutput>(ONNX_TRANSFORMERJS, AiJob<TaskInput, TaskOutput>, {
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
    console.error("Task graph error:", error.message, error.errors, error);
    throw error;
  }
};

const taskGraphRepo = new IndexedDbTaskGraphRepository();
const resetGraph = () => {
  workflow
    .reset()
    .DownloadModel({ model: ["onnx:Xenova/LaMini-Flan-T5-783M:q8", "onnx:Xenova/m2m100_418M:q8"] })
    .TextRewriter({
      text: "The quick brown fox jumps over the lazy dog.",
      prompt: ["Rewrite the following text in reverse:", "Rewrite this to sound like a pirate:"],
    })
    .rename("model_translation", "model", -2)
    .TextTranslation({
      source_lang: "en",
      target_lang: "es",
    })
    .rename("*", "console")
    .rename("*", "console", -2)
    .DebugLog({ log_level: "info" });
  taskGraphRepo.saveTaskGraph("default", workflow.graph);
};
let graph: TaskGraph | undefined;
try {
  graph = await taskGraphRepo.getTaskGraph("default");
} catch (error) {
  console.error("Task graph loading error, going to reset:", error.message);
  resetGraph();
  graph = workflow.graph;
}

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
    const task = new JsonTask({ json });
    if (task.hasChildren()) {
      workflow.graph = task.subGraph;
    } else {
      workflow.graph = new TaskGraph();
    }
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
