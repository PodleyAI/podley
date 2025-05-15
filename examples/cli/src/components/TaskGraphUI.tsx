//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ITask, ITaskGraph } from "@ellmers/task-graph";
import React, { useEffect, useState } from "react";
import { Box } from "retuink";
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

  useEffect(() => {
    const rootTasks = findRootTasks(graph);
    setTasks(rootTasks);

    const events = ["task_added", "task_removed", "task_replaced"] as const;
    const graphCleanupFunctions = events.map((event) => graph.subscribe(event, forceUpdate));

    return () => {
      graphCleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [graph]);

  const height = tasks.length > 10 ? true : undefined;
  const filteredTasks = height ? tasks.slice(tasks.length - 5, tasks.length) : tasks;

  return (
    <Box
      flexDirection="column"
      borderStyle={height ? "round" : undefined}
      borderColor="gray"
      key={status}
    >
      {filteredTasks.map((taskItem) => (
        <TaskUI key={`${taskItem.config.id}`} graph={graph} task={taskItem} />
      ))}
    </Box>
  );
};

export default TaskGraphUI;
