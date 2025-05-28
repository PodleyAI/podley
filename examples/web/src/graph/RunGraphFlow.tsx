//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Dataflow, TaskGraph, TaskGraphEvents } from "@podley/task-graph";
import {
  Controls,
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import React, { createContext, Dispatch, SetStateAction, useEffect, useRef } from "react";
import { FiClipboard, FiDownload, FiFileText, FiUpload } from "react-icons/fi";
import { computeLayout, GraphPipelineCenteredLayout, GraphPipelineLayout } from "../layout";
import { DataflowEdge, DataflowEdgeData } from "./DataflowEdge";
import { TaskNode, TaskNodeData } from "./TaskNode";
import { updateNode } from "./util";

import "@xyflow/react/dist/base.css";
import "./RunGraphFlow.css";

// Define node types
const nodeTypes: NodeTypes = {
  task: TaskNode,
};

// Define edge types
const edgeTypes: EdgeTypes = {
  dataflow: DataflowEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: "dataflow",
  animated: false,
};

function doNodeLayout(
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>
) {
  let edges = [];
  setEdges((es) => {
    edges = es.map((n) => {
      return {
        ...n,
        style: { opacity: 1 },
      };
    });
    setNodes((nodes) => {
      const computedNodes = computeLayout(
        nodes,
        edges,
        new GraphPipelineCenteredLayout<Node<TaskNodeData>>(),
        new GraphPipelineLayout<Node<TaskNodeData>>({ startTop: 100, startLeft: 20 })
      ) as Node<TaskNodeData>[];
      const sortedNodes = sortNodes(computedNodes);
      sortedNodes.map((n) => {
        n.style = { opacity: 1 };
        return n;
      });
      return sortedNodes;
    });
    return edges;
  });
}

// const categoryIcons = {
//   "Text Model": <FiFileText />,
//   Input: <FiUpload />,
//   Output: <FiDownload />,
//   Utility: <FiClipboard />,
// };

function sortNodes(nodes: Node<TaskNodeData>[]): Node<TaskNodeData>[] {
  // Map to hold nodes grouped by their parent ID
  const parentMap: Map<string | undefined, Node<TaskNodeData>[]> = new Map();

  // Group nodes by parent ID
  nodes.forEach((node) => {
    const parent = node.parentId || "###root###";
    if (!parentMap.has(parent)) {
      parentMap.set(parent, []);
    }
    parentMap.get(parent)?.push(node);
  });

  // Recursive function to get a node and all its descendants
  const appendChildren = (nodeId: string | "###root###"): Node<TaskNodeData>[] => {
    const children = parentMap.get(nodeId) || [];
    const result: Node<TaskNodeData>[] = [];

    children.forEach((child) => {
      // Append the child and its descendants
      result.push(child, ...appendChildren(child.id));
    });

    return result;
  };

  // Start the recursion from the root nodes
  return appendChildren("###root###");
}

export const RunGraphFlow: React.FC<{
  graph: TaskGraph;
}> = ({ graph }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const graphRef = useRef<TaskGraph | null>(null);
  const { fitView } = useReactFlow();

  // Function to build nodes from tasks
  const buildNodesFromTasks = (taskGraph: TaskGraph) => {
    const tasks = taskGraph.getTasks();
    const dataFlows = taskGraph.getDataflows();

    // Create nodes
    const newNodes = tasks.map((task, index) => {
      // Determine node type based on task type
      let type = "task";
      let data: TaskNodeData = { task };

      return {
        id: task.config.id,
        type,
        data,
      };
    });

    // Create edges
    const newEdges = dataFlows.map((flow) => ({
      id: flow.id,
      source: flow.sourceTaskId,
      target: flow.targetTaskId,
      type: "dataflow",
      data: {
        dataflow: flow,
      } as DataflowEdgeData,
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    doNodeLayout(setNodes, setEdges);
  };

  // Function to update edge status based on task status
  const updateEdgeStatus = (dataflow: Dataflow) => {
    setEdges((currentEdges) => {
      return currentEdges.map((edge) => {
        // Update outgoing edges when a task is completed
        if (edge.id === dataflow.id) {
          return {
            ...edge,
            data: {
              dataflow,
            },
          };
        }
        return edge;
      });
    });
  };

  useEffect(() => {
    if (graph && graph !== graphRef.current) {
      graphRef.current = graph;

      // Build initial nodes
      buildNodesFromTasks(graph);

      const unsubscribes: (() => void)[] = [];
      const statusEvents = ["start", "complete", "error", "skipped", "abort", "reset"] as const;

      // Handle task events
      const tasks = graph.getTasks();
      tasks.forEach((task) => {
        // Status change events that need edge updates
        statusEvents.forEach((eventName) => {
          const unsub = task.subscribe(eventName, () => {
            updateNode(setNodes, task);
          });
          unsubscribes.push(unsub);
        });

        // Progress events (just node update)
        const progressUnsub = task.subscribe("progress", () => updateNode(setNodes, task));
        unsubscribes.push(progressUnsub);

        // For compound tasks, handle regenerate events
        // if (task instanceof GraphAsTask || task instanceof ArrayTask) {
        //   const regenerateUnsub = task.subscribe("regenerate", () => buildNodesFromTasks(graph));
        //   unsubscribes.push(regenerateUnsub);
        // }
      });

      const dataflows = graph.getDataflows();
      dataflows.forEach((dataflow) => {
        statusEvents.forEach((eventName) => {
          const unsub = dataflow.subscribe(eventName, () => updateEdgeStatus(dataflow));
          unsubscribes.push(unsub);
        });
      });

      // Handle graph structure events
      const graphEvents: TaskGraphEvents[] = ["task_added", "dataflow_added"];
      graphEvents.forEach((eventName) => {
        const unsub = graph.subscribe(eventName, () => buildNodesFromTasks(graph));
        unsubscribes.push(unsub);
      });

      // Clean up subscriptions
      return () => unsubscribes.forEach((unsub) => unsub());
    }
  }, [graph]);

  // Fit view when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [nodes.length, fitView]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <svg>
          <defs>
            <linearGradient id="edge-gradient">
              <stop offset="0%" stopColor="#ae53ba" />
              <stop offset="100%" stopColor="#2a8af6" />
            </linearGradient>

            <marker
              id="edge-circle"
              viewBox="-5 -5 10 10"
              refX="0"
              refY="0"
              markerUnits="strokeWidth"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <circle stroke="#2a8af6" strokeOpacity="0.75" r="2" cx="0" cy="0" />
            </marker>
          </defs>
        </svg>
        <Controls />
      </ReactFlow>
    </div>
  );
};
