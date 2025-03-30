//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React, { Dispatch, SetStateAction, useEffect, useRef } from "react";
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  useNodesInitialized,
  useReactFlow,
  Edge,
  Position,
} from "@xyflow/react";
import { TurboNodeData, SingleNode, CompoundNode } from "./TurboNode";
import TurboEdge from "./TurboEdge";
import { FiFileText, FiClipboard, FiDownload, FiUpload } from "react-icons/fi";
import { ITask, TaskGraph, TaskStatus, TaskWithSubgraph } from "@ellmers/task-graph";
import { GraphPipelineCenteredLayout, GraphPipelineLayout, computeLayout } from "./layout";

import "@xyflow/react/dist/base.css";
import "./RunGraphFlow.css";

let test = false;

const categoryIcons = {
  "Text Model": <FiFileText />,
  Input: <FiUpload />,
  Output: <FiDownload />,
  Utility: <FiClipboard />,
};

function sortNodes(nodes: Node<TurboNodeData>[]): Node<TurboNodeData>[] {
  // Map to hold nodes grouped by their parent ID
  const parentMap: Map<string | undefined, Node<TurboNodeData>[]> = new Map();

  // Group nodes by parent ID
  nodes.forEach((node) => {
    const parent = node.parentId || "###root###";
    if (!parentMap.has(parent)) {
      parentMap.set(parent, []);
    }
    parentMap.get(parent)?.push(node);
  });

  // Recursive function to get a node and all its descendants
  const appendChildren = (nodeId: string | "###root###"): Node<TurboNodeData>[] => {
    const children = parentMap.get(nodeId) || [];
    const result: Node<TurboNodeData>[] = [];

    children.forEach((child) => {
      // Append the child and its descendants
      result.push(child, ...appendChildren(child.id));
    });

    return result;
  };

  // Start the recursion from the root nodes
  return appendChildren("###root###");
}

function convertGraphToNodes(graph: TaskGraph): Node<TurboNodeData>[] {
  const tasks = graph.getTasks();
  const nodes = tasks.flatMap((task, index) => {
    let n: Node<TurboNodeData>[] = [
      {
        id: task.config.id as string,
        position: { x: 0, y: 0 },
        data: {
          icon: categoryIcons[(task.constructor as any).category],
          title: (task.constructor as any).type,
          subline: task.config.name,
        },
        type: task instanceof TaskWithSubgraph ? "compound" : "single",
        selectable: true,
        connectable: false,
        draggable: false,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      },
    ];
    if (task instanceof TaskWithSubgraph && task.hasChildren()) {
      const subNodes = convertGraphToNodes(task.subGraph).map((n) => {
        return {
          ...n,
          parentId: task.config.id as string,
          extent: "parent",
        } as Node<TurboNodeData>;
      });
      n = [...n, ...subNodes];
    }
    return n;
  });
  return nodes;
}

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
        new GraphPipelineCenteredLayout<Node<TurboNodeData>>(),
        new GraphPipelineLayout<Node<TurboNodeData>>({ startTop: 100, startLeft: 20 })
      ) as Node<TurboNodeData>[];
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

function updateNodeData(
  nodeId: unknown,
  newData: Partial<TurboNodeData>,
  setNodes: Dispatch<SetStateAction<Node<TurboNodeData>[]>>
) {
  setNodes((prevNodes) => {
    const newNodes = prevNodes.map((nd) => {
      if (nd.id != nodeId) {
        return nd;
      }
      return {
        ...nd,
        data: {
          ...nd.data,
          ...newData,
        },
      };
    });

    return newNodes;
  });
}

function listenToTask(
  task: ITask<any, any, any>,
  setNodes: Dispatch<SetStateAction<Node<TurboNodeData>[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>
) {
  const cleanupFns: (() => void)[] = [];
  let progressItems: Array<{ id: string; text: string; progress: number }> = [];

  const handleStatusChange = (...args: any[]) => {
    if (task.status === TaskStatus.PROCESSING) {
      progressItems = [{ id: "text", text: "STARTING", progress: 1 }];
    } else if (task.status === TaskStatus.COMPLETED) {
      progressItems =
        progressItems.length > 0
          ? progressItems.map((item) => ({
              id: item.id,
              text: item.id === "text" ? (task.runOutputData?.text ?? "COMPLETED") : item.text,
              progress: 100,
            }))
          : [{ id: "text", text: task.runOutputData?.text ?? "COMPLETED", progress: 100 }];
    } else if (task.status === TaskStatus.FAILED) {
      progressItems = [{ id: "text", text: "Error: " + task.error, progress: 100 }];
    } else if (task.status === TaskStatus.SKIPPED) {
      progressItems = [{ id: "text", text: "Skipped", progress: 100 }];
    } else if (task.status === TaskStatus.ABORTING) {
      progressItems = [{ id: "text", text: "Aborting", progress: 100 }];
    }

    updateNodeData(
      task.config.id,
      {
        active: task.status === TaskStatus.PROCESSING,
        progressItems,
      },
      setNodes
    );

    // Trigger layout update when status changes
    setTimeout(() => {
      doNodeLayout(setNodes, setEdges);
    }, 16);
  };

  const handleProgress = (progress: number, progressText: string, details: any) => {
    if (progressText === "Downloading model") {
      // Remove the start item
      progressItems = progressItems.filter((item) => item.id !== "text");

      const itemId = details.file;
      const itemProgress = details.progress;
      // Find existing progress item or create new one
      const existingItemIndex = progressItems.findIndex((item) => item.id === itemId);

      if (existingItemIndex >= 0) {
        // Update existing item
        progressItems[existingItemIndex] = {
          ...progressItems[existingItemIndex],
          progress: itemProgress,
          text: itemId,
          id: itemId,
        };
      } else {
        // Add new item
        progressItems.push({
          id: itemId,
          progress: itemProgress,
          text: itemId,
        });
      }
    } else if (details?.text) {
      details.text = (task.runOutputData?.text ?? "") + details.text;
      task.runOutputData.text = details.text;
      progressItems = [
        {
          id: "text",
          text: details?.text || progressText,
          progress,
        },
      ];
    }

    updateNodeData(
      task.config.id,
      {
        active: true,
        progressItems,
      },
      setNodes
    );

    // Trigger layout update when progress changes
    setTimeout(() => {
      doNodeLayout(setNodes, setEdges);
    }, 16);
  };

  const handleRegenerate = () => {
    const cleanupFns: (() => void)[] = [];
    if (task instanceof TaskWithSubgraph) {
      setNodes((nodes) => {
        let children = convertGraphToNodes(task.subGraph).map(
          (n) =>
            ({
              ...n,
              parentId: task.config.id as string,
              extent: "parent",
              selectable: false,
              connectable: false,
            }) as Node<TurboNodeData>
        );
        let returnNodes = nodes.filter((n) => n.parentId !== task.config.id); // remove old children
        const self = returnNodes.find((n) => n.id === task.config.id);
        if (self?.type !== "compound" && children.length > 0) {
          // update to true compound
          returnNodes = nodes.filter((n) => n.id !== task.config.id); // remove old self
          const newSelf: Node<TurboNodeData> = {
            ...self,
            type: "compound",
            data: {
              ...self.data,
            },
          };
          children = [...children, newSelf];
        }
        returnNodes = [...returnNodes, ...children]; // add new children
        returnNodes = sortNodes(returnNodes); // sort all nodes
        return returnNodes;
      });
      // Set up listeners for new subtasks
      const newCleanupFns = listenToGraphTasks(task.subGraph, setNodes, setEdges);
      cleanupFns.push(...newCleanupFns);
    }
    cleanupFns.push(() => {
      task.off("regenerate", () => {});
    });
  };

  if (task instanceof TaskWithSubgraph) {
    const subTasks = task.subGraph.getTasks();
    for (const subTask of subTasks) {
      const subCleanupFns = listenToTask(subTask, setNodes, setEdges);
      cleanupFns.push(...subCleanupFns);
    }

    // Listen for regeneration of compound tasks
    task.on("regenerate", handleRegenerate);
    cleanupFns.push(() => {
      task.off("regenerate", handleRegenerate);
    });
  }
  // Register event handlers
  task.on("start", handleStatusChange);
  task.on("complete", handleStatusChange);
  task.on("error", handleStatusChange);
  task.on("abort", handleStatusChange);
  task.on("reset", handleStatusChange);
  task.on("progress", handleProgress);
  // Add cleanup function
  cleanupFns.push(() => {
    task.off("start", handleStatusChange);
    task.off("complete", handleStatusChange);
    task.off("error", handleStatusChange);
    task.off("abort", handleStatusChange);
    task.off("reset", handleStatusChange);
    task.off("progress", handleProgress);
  });

  return cleanupFns;
}

function listenToGraphTasks(
  graph: TaskGraph,
  setNodes: Dispatch<SetStateAction<Node<TurboNodeData>[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>
) {
  const cleanupFns: (() => void)[] = [];
  const nodes = graph.getTasks();
  for (const node of nodes) {
    const taskCleanupFns = listenToTask(node, setNodes, setEdges);
    cleanupFns.push(...taskCleanupFns);
  }
  return cleanupFns;
}

const nodeTypes = {
  single: SingleNode,
  compound: CompoundNode,
};

const edgeTypes = {
  turbo: TurboEdge,
};

const defaultEdgeOptions = {
  type: "turbo",
  markerEnd: "edge-circle",
};

export const RunGraphFlow: React.FC<{
  graph: TaskGraph;
}> = ({ graph }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TurboNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const graphRef = useRef<TaskGraph | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);

  const shouldLayout = useNodesInitialized() && !nodes.some((n) => !n.measured);
  const { fitView } = useReactFlow();

  useEffect(() => {
    let timeoutId: any;
    if (shouldLayout) {
      doNodeLayout(setNodes, setEdges);
      timeoutId = setTimeout(() => {
        fitView();
      }, 5);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [shouldLayout, setNodes, setEdges, fitView]);

  useEffect(() => {
    if (graph !== graphRef.current) {
      // Cleanup previous listeners
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];

      graphRef.current = graph;
      // console.log("Graph changed", graph);
      const nodes = sortNodes(convertGraphToNodes(graph));
      setNodes(
        nodes.map((n) => ({
          ...n,
          style: { opacity: 0 },
        }))
      );

      setEdges(
        graph.getDataflows().map((df) => ({
          id: df.id,
          source: df.sourceTaskId as string,
          target: df.targetTaskId as string,
          style: { opacity: 0 },
        }))
      );

      const newCleanupFns = listenToGraphTasks(graph, setNodes, setEdges);
      cleanupRef.current = newCleanupFns;
    }

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    };
  }, [graph, setNodes, setEdges]);

  // const onConnect = useCallback(
  //   (params: any) => setEdges((els) => addEdge(params, els)),
  //   [setEdges]
  // );

  const controls = <Controls showInteractive={false} />;
  if (!test) {
    console.log(controls);
    test = true;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      // onConnect={onConnect}
      // fitView
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
    >
      {controls}

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
    </ReactFlow>
  );
};
