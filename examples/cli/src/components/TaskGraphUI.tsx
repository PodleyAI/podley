//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import React, { useState, useEffect } from "react";
import { Box } from "tuir";
import { ITask, ITaskGraph } from "@ellmers/task-graph";
import { TaskUI } from "./TaskUI";

type TaskGraphUIProps = {
  graph: ITaskGraph;
};

function findRootTasks(graph: ITaskGraph): ITask[] {
  return graph.getTasks().filter((task) => graph.getSourceTasks(task.config.id).length === 0);
}

const TaskGraphUI: React.FC<TaskGraphUIProps> = ({ graph }) => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [status, setStatus] = useState<number>(0);

  // Force a re-render
  const forceUpdate = () => {
    setStatus((a) => a + 1);
  };

  // Set up event listeners for task status changes
  useEffect(() => {
    const setupTaskListeners = (currentTask: ITask) => {
      // Set up listeners for this task
      currentTask.on("regenerate", forceUpdate);
    };
    const rootTasks = findRootTasks(graph);

    // Set up listeners for the main task and all its subtasks
    rootTasks.forEach((task) => setupTaskListeners(task));
    setTasks(rootTasks);

    // Set up a timer to periodically refresh the UI

    return () => {
      rootTasks.forEach((task) => task.events.removeAllListeners());
    };
  }, [graph]);

  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        {tasks.map((taskItem) => (
          <TaskUI key={`${taskItem.config.id}`} graph={graph} task={taskItem} />
        ))}
      </Box>
    </Box>
  );
};

export default TaskGraphUI;
