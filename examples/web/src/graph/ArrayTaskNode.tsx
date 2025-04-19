//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ArrayTask, ITask, TaskStatus } from "@ellmers/task-graph";
import { Node, NodeProps } from "@xyflow/react";
import React, { useEffect, useState } from "react";
import { NodeContainer } from "./NodeContainer";
import { NodeHeader } from "./NodeHeader";
import { ProgressBar } from "../components/ProgressBar";
import { TaskDataButtons } from "../components/TaskDataButtons";

export type ArrayTaskNodeData = {
  task: ArrayTask;
};

export const ArrayTaskNode: React.FC<NodeProps<Node<ArrayTaskNodeData, string>>> = ({
  data,
  isConnectable,
}) => {
  const [status, setStatus] = useState<TaskStatus>(data.task.status);
  const [progress, setProgress] = useState<number>(data.task.progress);
  const [subTasks, setSubTasks] = useState<ITask[]>([]);

  useEffect(() => {
    const task = data.task;

    setStatus(task.status);
    setProgress(task.progress);
    if (task.hasChildren()) {
      setSubTasks(task.subGraph.getTasks());
    }

    const unsubscribes: (() => void)[] = [];

    unsubscribes.push(
      task.subscribe("status", () => {
        setStatus(task.status);
        setProgress(task.progress);
      })
    );

    unsubscribes.push(
      task.subscribe("progress", (progress) => {
        setProgress(progress);
      })
    );

    unsubscribes.push(
      task.subscribe("regenerate", () => {
        console.log("regenerate", task);
        setSubTasks(task.subGraph.getTasks());
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [data.task, data.task.subGraph]);

  return (
    <NodeContainer isConnectable={isConnectable} status={status}>
      <NodeHeader title={data.task.type} description={data.task.config.name} status={status} />
      <TaskDataButtons task={data.task} />
      <ProgressBar progress={progress} status={status} showText={true} />

      {/* Sub-tasks progress */}
      {subTasks.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold mb-2">
            <span className="text-gray-500 ml-2">
              {subTasks.filter((t) => t.status === TaskStatus.COMPLETED).length}/{subTasks.length}{" "}
              completed
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {subTasks.map((subTask) => (
              <ArraySubTask key={subTask.config.id as string} subTask={subTask} />
            ))}
          </div>
        </div>
      )}
    </NodeContainer>
  );
};

const ArraySubTask: React.FC<{ subTask: ITask }> = ({ subTask }) => {
  const [progress, setProgress] = useState<number>(subTask.progress);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [status, setStatus] = useState<TaskStatus>(subTask.status);

  useEffect(() => {
    setProgress(subTask.progress || 0);
    setStatus(subTask.status);

    const unsubscribes: (() => void)[] = [];

    unsubscribes.push(
      subTask.subscribe("status", () => {
        setStatus(subTask.status);
        setProgress(subTask.progress);
        if (subTask.status === TaskStatus.COMPLETED && subTask.runOutputData.text) {
          setProgressMessage(subTask.runOutputData.text as string);
        }
      })
    );

    unsubscribes.push(
      subTask.subscribe("progress", (progress, message, details) => {
        setProgress(progress);
        setProgressMessage(details?.text || details?.file || message);
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [subTask.progress, subTask.status]);

  return (
    <div key={subTask.config.id as string} className="text-xs subtask-progress">
      <div className="flex justify-between mb-1">
        <span className="truncate">{progressMessage}</span>
        <span className="text-gray-500">{Math.round(progress || 0)}%</span>
      </div>
      <div className="progress-container">
        <ProgressBar progress={progress || 0} status={status} showText={false} />
      </div>
    </div>
  );
};
