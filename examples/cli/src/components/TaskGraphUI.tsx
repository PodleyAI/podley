//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React, { useState, useEffect } from "react";
import { Box } from "ink";
import { Task, TaskStatus, TaskGraph } from "@ellmers/task-graph";
import { TaskUI } from "./TaskUI";

type TaskGraphUIProps = {
  graph: TaskGraph;
};

const TaskGraphUI: React.FC<TaskGraphUIProps> = ({ graph }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const rootTasks = graph
    .getNodes()
    .filter((task) => graph.getSourceTasks(task.config.id).length === 0);

  // Force a re-render
  const forceUpdate = () => {
    setStatus(
      tasks.find((task) => task.status === TaskStatus.FAILED)
        ? TaskStatus.FAILED
        : TaskStatus.COMPLETED
    );
  };

  // Set up event listeners for task status changes
  useEffect(() => {
    const setupTaskListeners = (currentTask: Task) => {
      // Set up listeners for this task
      currentTask.on("start", forceUpdate);
      currentTask.on("progress", forceUpdate);
      currentTask.on("complete", forceUpdate);
      currentTask.on("error", forceUpdate);
      currentTask.on("regenerate", forceUpdate);
      currentTask.on("abort", forceUpdate);

      // If this is a compound task, set up listeners for all subtasks
      if (currentTask.isCompound && (currentTask as any).subGraph) {
        const subGraph = (currentTask as any).subGraph;
        subGraph.getNodes().forEach((subTask: Task) => {
          setupTaskListeners(subTask);
        });
      }
    };

    // Set up listeners for the main task and all its subtasks
    rootTasks.forEach((task) => setupTaskListeners(task));
    setTasks(rootTasks);

    // Set up a timer to periodically refresh the UI

    return () => {
      rootTasks.forEach((task) => task.events.removeAllListeners());
    };
  }, [graph]); // Added graph as a dependency to ensure the effect runs when the graph changes

  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        {tasks.map((taskItem) => (
          <TaskUI key={String(taskItem.config.id)} graph={graph} task={taskItem} />
        ))}
      </Box>
    </Box>
  );
};

export default TaskGraphUI;
