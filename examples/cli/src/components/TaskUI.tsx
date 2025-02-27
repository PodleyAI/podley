import { useEffect, useState } from "react";
import type { FC } from "react";
import { Text, Box } from "tuir";
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
  const [message, setMessage] = useState<string>("");
  const [details, setDetails] = useState<any>(undefined);
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
      // @ts-ignore
      task.on("progress", (progress: number, message: string, details: any) => {
        setProgress(progress);
        setMessage(message);
        setDetails((oldDetails: any) => {
          if (oldDetails == null) {
            return [details];
          }
          const found = oldDetails.find((d: any) => d.file == details.file);
          if (found) {
            return oldDetails.map((d: any) => (d.file == details.file ? details : d));
          }
          return [...oldDetails, details];
        });
      });
      task.on("complete", () => setStatus(TaskStatus.COMPLETED));
      task.on("error", () => setStatus(TaskStatus.FAILED));
      task.on("regenerate", () => setSubGraph(task instanceof CompoundTask ? task.subGraph : null));
      task.on("abort", () => setStatus(TaskStatus.ABORTING));
    };

    setupTaskListeners();

    return () => {
      task.events.removeAllListeners();
    };
  }, [task, graph]);

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
            <Text dimColor>
              {progress > 0 &&
                ` ${createBar(progress / 100, 20)} ${message} ${Math.round(progress)}%`}
            </Text>
          </Box>
        ) : null}
      </Box>
      {status == TaskStatus.PROCESSING &&
        details &&
        message == "Downloading model" &&
        details.map((d: any) => (
          <Box marginLeft={2} key={d.file}>
            <Text color="gray">{`${symbols.arrowRight} ${createBar(d.progress / 100, 10)} ${d.file} ${Math.round(d.progress)}%`}</Text>
          </Box>
        ))}
      {Object.keys(task.runOutputData || {}).length > 0 ? (
        <Box marginLeft={2}>
          <Text color="gray">{`${symbols.arrowRight} ${JSON.stringify(task.runOutputData)}`}</Text>
        </Box>
      ) : null}
      {subGraph && (
        <Box flexDirection="column" marginLeft={2}>
          <TaskGraphUI graph={subGraph} />
        </Box>
      )}
      {dependantChildren && (
        <Box flexDirection="column" marginLeft={2}>
          {dependantChildren.map((taskItem) => (
            <TaskUI key={String(taskItem.config.id)} task={taskItem} graph={graph} />
          ))}
        </Box>
      )}
    </Box>
  );
};
