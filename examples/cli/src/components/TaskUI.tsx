import { useEffect, useState } from "react";
import type { FC } from "react";
import { Text, Box } from "ink";
import { TaskStatus, TaskGraph, Task, CompoundTask } from "@ellmers/task-graph";
import spinners from "cli-spinners";
import TaskGraphUI from "./TaskGraphUI";
import { createBar, symbols, Spinner } from "./Elements";

const getSymbol = (state: TaskStatus) => {
  if (state === TaskStatus.PROCESSING) {
    return (
      <Text color="yellow">
        <Spinner spinner={spinners.dots} />
      </Text>
    );
  }

  if (state === TaskStatus.ABORTING) {
    return <Text color="yellow">{symbols.warning}</Text>;
  }

  if (state === TaskStatus.FAILED) {
    return <Text color="red">{symbols.cross}</Text>;
  }

  if (state === TaskStatus.COMPLETED) {
    return <Text color="green">{symbols.tick}</Text>;
  }

  if (state === TaskStatus.PENDING) {
    return <Text color="gray">{symbols.squareSmallFilled}</Text>;
  }

  return " ";
};

export const TaskUI: FC<{
  task: Task;
  graph: TaskGraph;
}> = ({ task, graph }) => {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [progress, setProgress] = useState<number>(task.progress);
  const [subGraph, setSubGraph] = useState<TaskGraph | null>(
    task instanceof CompoundTask ? task.subGraph : null
  );
  const [dependantChildren, setDependantChildren] = useState<Task[]>(
    graph.getTargetTasks(task.config.id)
  );

  useEffect(() => {
    const setupTaskListeners = () => {
      // Set up listeners for this task
      task.on("start", () => setStatus(TaskStatus.PROCESSING));
      task.on("progress", () => setProgress(task.progress));
      task.on("complete", () => setStatus(TaskStatus.COMPLETED));
      task.on("error", () => setStatus(TaskStatus.FAILED));
      task.on("regenerate", () => setSubGraph(task instanceof CompoundTask ? task.subGraph : null));
      task.on("abort", () => setStatus(TaskStatus.ABORTING));
    };

    setupTaskListeners();

    return () => {
      task.events.removeAllListeners();
    };
  }, [task.status, task.progress, graph]);

  let icon = getSymbol(task.status);

  return (
    <Box flexDirection="column">
      <Box>
        <Box marginRight={1}>
          <Text>{icon}</Text>
        </Box>
        <Text>{task.config.name || (task.config.id as string)}</Text>
        {status === TaskStatus.PROCESSING ? (
          <Box marginLeft={1}>
            <Text dimColor>[{status}]</Text>
            <Text dimColor>{progress > 0 && `${Math.round(progress)}%`}</Text>
            {/* <Box width={20}>
              <Text>{progress > 0 && createBar(progress, 20)}</Text>
            </Box> */}
          </Box>
        ) : null}
      </Box>
      {Object.keys(task.runOutputData || {}).length > 0 ? (
        <Box marginLeft={2}>
          <Text color="gray">{`${symbols.arrowRight} ${JSON.stringify(task.runOutputData)}`}</Text>
        </Box>
      ) : null}
      {dependantChildren && (
        <Box flexDirection="column" marginLeft={2}>
          {dependantChildren.map((taskItem) => (
            <TaskUI key={String(taskItem.config.id)} task={taskItem} graph={graph} />
          ))}
        </Box>
      )}
      {subGraph && (
        <Box flexDirection="column" marginLeft={2}>
          <TaskGraphUI graph={subGraph} />
        </Box>
      )}
    </Box>
  );
};
