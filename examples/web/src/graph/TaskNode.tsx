//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ITask, TaskStatus } from "@ellmers/task-graph";
import { Node, NodeProps } from "@xyflow/react";
import React, { useEffect, useState } from "react";
import { FiCloud, FiCloudLightning } from "react-icons/fi";
import { NodeContainer } from "./NodeContainer";
import { NodeHeader } from "./NodeHeader";
import { ProgressBar } from "../components/ProgressBar";
import { TaskDataButtons } from "../components/TaskDataButtons";

export type TaskNodeData = {
  task: ITask;
};

export const TaskNode: React.FC<NodeProps<Node<TaskNodeData, string>>> = ({
  data,
  isConnectable,
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);

  useEffect(() => {
    const task = data.task;

    setProgress(task.progress);
    setStatus(task.status);

    const unsubscribes: (() => void)[] = [];

    unsubscribes.push(
      task.subscribe("status", () => {
        setStatus(task.status);
        setProgress(task.progress);
      })
    );

    // Update on progress events
    unsubscribes.push(
      task.subscribe("progress", (progress) => {
        setProgress(progress);
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [data.task]);

  return (
    <>
      <NodeContainer isConnectable={isConnectable} status={status}>
        <NodeHeader title={data.task.type} description={data.task.config.name} status={status} />
        <TaskDataButtons task={data.task} />
        <ProgressBar progress={progress} status={status} showText={true} />
      </NodeContainer>
      <div className="cloud gradient">
        <div>{data.task.status === TaskStatus.PROCESSING ? <FiCloudLightning /> : <FiCloud />}</div>
      </div>
    </>
  );
};
