/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayTask, ITask, TaskStatus } from "@podley/task-graph";
import { Node, NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import { FiCloud, FiCloudLightning } from "react-icons/fi";
import { ProgressBar } from "../components/ProgressBar";
import { TaskDataButtons } from "../components/TaskDataButtons";
import { NodeContainer } from "./NodeContainer";
import { NodeHeader } from "./NodeHeader";

export type TaskNodeData = {
  task: ITask;
};

export function TaskNode(props: NodeProps<Node<TaskNodeData, string>>) {
  const { data, isConnectable } = props;
  const [status, setStatus] = useState<TaskStatus>(data.task.status);
  const [progress, setProgress] = useState<number>(data.task.progress);
  const [subTasks, setSubTasks] = useState<ITask[]>([]);
  const [isExpanded, setIsExpanded] = useState(data.task instanceof ArrayTask);
  const [isExpandable, setIsExpandable] = useState(false);

  useEffect(() => {
    const task = data.task;

    setStatus(task.status);
    setProgress(task.progress);
    if (task.hasChildren()) {
      setSubTasks(task.subGraph.getTasks());
    }
    setIsExpandable(task.hasChildren());

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
        setSubTasks(task.subGraph.getTasks());
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [data.task, data.task.subGraph]);

  return (
    <>
      <NodeContainer isConnectable={isConnectable} status={status}>
        <NodeHeader title={data.task.type} description={data.task.config.name} status={status} />
        <TaskDataButtons task={data.task} />
        <ProgressBar progress={progress} status={status} showText={true} />

        {isExpandable && (
          <div className="flex items-center justify-between mt-3 mb-1">
            <div className="text-xs font-semibold">
              {data.task instanceof ArrayTask ? "Array" : "Graph"} Task
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs bg-gray-800 hover:bg-gray-700 rounded px-2 py-0.5 transition-colors"
            >
              {isExpanded ? "Hide" : "Show"} sub-graph
            </button>
          </div>
        )}
        {/* Sub-tasks progress */}
        {isExpanded && (
          <div className="mt-3">
            <div className="text-xs font-semibold mb-2">
              <span className="text-gray-500 ml-2">
                {subTasks.filter((t) => t.status === TaskStatus.COMPLETED).length}/{subTasks.length}{" "}
                completed
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {subTasks.map((subTask) => (
                <SubTask key={subTask.config.id as string} subTask={subTask} />
              ))}
            </div>
          </div>
        )}
      </NodeContainer>
      <div className="cloud gradient">
        <div>{data.task.status === TaskStatus.PROCESSING ? <FiCloudLightning /> : <FiCloud />}</div>
      </div>
    </>
  );
}

function SubTask({ subTask }: { subTask: ITask }) {
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
}
