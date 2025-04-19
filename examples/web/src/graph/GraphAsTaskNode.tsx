//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { GraphAsTask, TaskGraph, TaskStatus } from "@ellmers/task-graph";
import { Node, NodeProps } from "@xyflow/react";
import React, { useEffect, useState } from "react";
import { NodeContainer } from "./NodeContainer";
import { NodeHeader } from "./NodeHeader";
import { ProgressBar } from "../components/ProgressBar";
import { TaskDataButtons } from "../components/TaskDataButtons";
import { getStatusColorBg, getTruncatedTaskId } from "./util";

export type GraphAsTaskNodeData = {
  task: GraphAsTask;
};

export const GraphAsTaskNode: React.FC<NodeProps<Node<GraphAsTaskNodeData, string>>> = ({
  data,
  isConnectable,
}) => {
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [subGraph, setSubGraph] = useState<TaskGraph | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState<number>(data.task.progress);

  useEffect(() => {
    const task = data.task;

    // Initial state
    setStatus(task.status);
    setSubGraph(task.subGraph);

    // Subscribe to all relevant task events
    const unsubscribes: (() => void)[] = [];

    unsubscribes.push(
      task.subscribe("status", () => {
        setStatus(task.status);
      })
    );

    unsubscribes.push(
      task.subscribe("progress", () => {
        setProgress(task.progress);
      })
    );

    unsubscribes.push(
      task.subscribe("regenerate", () => {
        setSubGraph(task.subGraph);
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [data.task]);

  // Render a mini graph visualization
  const renderMiniGraph = () => {
    if (!subGraph) return null;

    const tasks = subGraph.getTasks();
    const dataflows = subGraph.getDataflows();

    // Simple mini-graph visualization
    return (
      <div className="mini-graph fade-in">
        <div className="text-xs font-semibold p-2">
          Sub-graph ({tasks.length} tasks):
          <span className="text-gray-500 ml-2">
            {tasks.filter((t) => t.status === TaskStatus.COMPLETED).length} completed
          </span>
        </div>

        {/* Task nodes */}
        {tasks.map((task, index) => {
          const x = (index % 3) * 33 + 5;
          const y = Math.floor(index / 3) * 30 + 25; // Offset to account for the header
          const statusColor = getStatusColorBg(task.status);

          return (
            <div
              key={task.config.id}
              className={`mini-graph-node ${statusColor.replace("bg-", "bg-opacity-20 border-")} border`}
              style={{
                left: `${x}%`,
                top: `${y}px`,
                maxWidth: "30%",
              }}
            >
              <div className="truncate">{getTruncatedTaskId(task.config.id as string)}</div>
            </div>
          );
        })}

        {/* Dataflow edges */}
        <svg className="mini-graph-svg" width="100%" height="100%">
          {dataflows.map((flow, i) => {
            const sourceIndex = tasks.findIndex((t) => t.config.id === flow.sourceTaskId);
            const targetIndex = tasks.findIndex((t) => t.config.id === flow.targetTaskId);

            if (sourceIndex === -1 || targetIndex === -1) return null;

            const sourceX = (sourceIndex % 3) * 33 + 15;
            const sourceY = Math.floor(sourceIndex / 3) * 30 + 30; // Offset to account for the header
            const targetX = (targetIndex % 3) * 33 + 15;
            const targetY = Math.floor(targetIndex / 3) * 30 + 30; // Offset to account for the header

            // Check status of source and target tasks
            const sourceTask = tasks.find((t) => t.config.id === flow.sourceTaskId);
            const sourceCompleted = sourceTask && sourceTask.status === TaskStatus.COMPLETED;

            return (
              <line
                key={i}
                x1={`${sourceX}%`}
                y1={sourceY}
                x2={`${targetX}%`}
                y2={targetY}
                stroke={sourceCompleted ? "#2a8af6" : "#888"}
                strokeWidth={sourceCompleted ? "1.5" : "1"}
                strokeDasharray={sourceCompleted ? "none" : "2"}
                strokeOpacity={sourceCompleted ? "0.8" : "0.5"}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <NodeContainer isConnectable={isConnectable} status={status}>
      <NodeHeader title={data.task.type} description={data.task.config.name} status={status} />
      <TaskDataButtons task={data.task} />
      <ProgressBar progress={progress} status={status} showText={true} />

      {/* Sub-graph controls */}
      {subGraph && (
        <div className="flex items-center justify-between mt-3 mb-1">
          <div className="text-xs font-semibold">Graph Task</div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs bg-gray-800 hover:bg-gray-700 rounded px-2 py-0.5 transition-colors"
          >
            {isExpanded ? "Hide" : "Show"} sub-graph
          </button>
        </div>
      )}

      {/* Sub-graph visualization (when expanded) */}
      {isExpanded && renderMiniGraph()}
    </NodeContainer>
  );
};
