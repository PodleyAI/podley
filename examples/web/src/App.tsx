//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { AiJob, AiProviderInput } from "@podley/ai";
import {
  HF_TRANSFORMERS_ONNX,
  register_HFT_ClientJobFns,
  register_TFMP_ClientJobFns,
  TENSORFLOW_MEDIAPIPE,
} from "@podley/ai-provider";
import { ConcurrencyLimiter, JobQueue } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";
import {
  getTaskQueueRegistry,
  JsonTaskItem,
  TaskGraph,
  TaskInput,
  TaskOutput,
  Workflow,
} from "@podley/task-graph";
import { JsonTask } from "@podley/tasks";
import {
  IndexedDbTaskGraphRepository,
  IndexedDbTaskOutputRepository,
  registerHuggingfaceLocalModels,
  registerMediaPipeTfJsLocalModels,
} from "@podley/test";
import { ReactFlowProvider, useEdgesState, useNodesState } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import { GraphStoreStatus } from "./status/GraphStoreStatus";
import { JsonEditor } from "./editor/JsonEditor";
import { OutputRepositoryStatus } from "./status/OutputRepositoryStatus";
import { QueuesStatus } from "./status/QueueStatus";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./Resize";
import { RunGraphFlow } from "./graph/RunGraphFlow";

register_TFMP_ClientJobFns(
  new Worker(new URL("./worker_tfmp.ts", import.meta.url), { type: "module" })
);
register_HFT_ClientJobFns(
  new Worker(new URL("./worker_hft.ts", import.meta.url), { type: "module" })
);

const queueRegistry = getTaskQueueRegistry();

queueRegistry.registerQueue(
  new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(HF_TRANSFORMERS_ONNX, AiJob, {
    limiter: new ConcurrencyLimiter(1, 100),
    storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(HF_TRANSFORMERS_ONNX),
  })
);

queueRegistry.registerQueue(
  new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(TENSORFLOW_MEDIAPIPE, AiJob, {
    limiter: new ConcurrencyLimiter(1, 100),
    storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(TENSORFLOW_MEDIAPIPE),
  })
);

queueRegistry.clearQueues();
queueRegistry.startQueues();

const taskOutputCache = new IndexedDbTaskOutputRepository();
const taskGraphRepo = new IndexedDbTaskGraphRepository();
const resetGraph = () => {
  const workflow = window["workflow"];
  workflow
    .reset()
    .DownloadModel({
      model: ["onnx:Xenova/LaMini-Flan-T5-783M:q8", "onnx:Xenova/m2m100_418M:q8"],
    })
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

window["workflow"] = new Workflow(taskOutputCache);
let graph: TaskGraph | undefined;
try {
  graph = await taskGraphRepo.getTaskGraph("default");
} catch (error) {
  console.error("Task graph loading error, going to reset:", error.message);
  resetGraph();
  graph = window["workflow"].graph;
}

if (graph) {
  window["workflow"].graph = graph;
} else {
  resetGraph();
}

// console access. what happens there will be reflected in the UI
const setupWorkflow = async () => {
  const workflow = window["workflow"];
  const run = workflow.run.bind(workflow);
  workflow.run = async () => {
    console.log("Running task graph...");
    try {
      const result = await run();
      console.log("Task graph complete.", workflow);
      return result;
    } catch (error) {
      console.error("Task graph error:", error.message, error.errors, error);
      throw error;
    }
  };

  workflow.on("changed", () => {
    taskGraphRepo.saveTaskGraph("default", workflow.graph);
  });
  workflow.on("reset", () => {
    taskGraphRepo.saveTaskGraph("default", workflow.graph);
  });
  taskGraphRepo.on("graph_cleared", () => {
    resetGraph();
  });
};
setupWorkflow();
let workflow: Workflow = window["workflow"];

const initialJsonObj: JsonTaskItem[] = workflow.toDependencyJSON();
const initialJson = JSON.stringify(initialJsonObj, null, 2);
await registerHuggingfaceLocalModels();
await registerMediaPipeTfJsLocalModels();

export const App = () => {
  const [graph, setGraph] = useState<TaskGraph>(workflow.graph);
  const [w, setWorkflow] = useState<Workflow>(window["workflow"]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAborting, setIsAborting] = useState<boolean>(false);
  const [jsonData, setJsonData] = useState<string>(initialJson);

  // changes coming from workflow in console
  useEffect(() => {
    const interval = setInterval(() => {
      if (workflow !== window["workflow"] && window["workflow"] instanceof Workflow) {
        workflow = window["workflow"];
        setWorkflow(workflow);
        workflow.graph.outputCache = taskOutputCache;
        setupWorkflow();
      }
    }, 10);

    function listen() {
      setJsonData(JSON.stringify(w.toDependencyJSON(), null, 2));
      setGraph(w.graph);
    }
    workflow.on("changed", listen);
    workflow.on("reset", listen);
    listen();
    return () => {
      workflow.off("changed", listen);
      workflow.off("reset", listen);
      clearInterval(interval);
    };
  }, [w]);

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
  }, [workflow]);

  const setNewJson = useCallback(
    (json: string) => {
      const task = new JsonTask({ json });
      if (task.hasChildren()) {
        workflow.graph = task.subGraph;
      } else {
        workflow.graph = new TaskGraph();
      }
      setJsonData(json);
    },
    [workflow]
  );

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
              run={() => {
                workflow.run();
              }}
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
