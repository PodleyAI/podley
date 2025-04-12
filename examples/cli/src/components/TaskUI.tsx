//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ITask, ITaskGraph, TaskStatus, ArrayTask } from "@ellmers/task-graph";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { Box, Text } from "tuir";
import { createBar, Spinner, symbols } from "./Elements";
import TaskGraphUI from "./TaskGraphUI";
import { DownloadModelTask } from "@ellmers/ai";

const getSymbol = (state: TaskStatus) => {
  if (state === TaskStatus.PROCESSING) {
    return (
      <Text color="yellow">
        <Spinner />
      </Text>
    );
  }

  if (state === TaskStatus.ABORTING) {
    return <Text color="yellow">{symbols.warning}</Text>;
  }

  if (state === TaskStatus.FAILED) {
    return <Text color="red">{symbols.cross}</Text>;
  }

  if (state === TaskStatus.SKIPPED) {
    return <Text color="gray">{symbols.info}</Text>;
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
  task: ITask;
  graph: ITaskGraph;
}> = ({ task, graph }) => {
  const [count, setCount] = useState<number>(0);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [progress, setProgress] = useState<number>(task.progress);
  const [message, setMessage] = useState<string>("");
  const [details, setDetails] = useState<any>(undefined);
  const [text, setText] = useState<string>("");
  const [subGraph, setSubGraph] = useState<ITaskGraph | null>(null);
  const [dependantChildren, setDependantChildren] = useState<ITask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [arrayProgress, setArrayProgress] = useState<{ completed: number; total: number } | null>(
    null
  );

  useEffect(() => {
    const onStart = () => {
      setStatus(TaskStatus.PROCESSING);
    };

    const onProgress = (...args: any[]) => {
      const [progress, message, details] = args;
      setProgress(progress);
      setMessage(message);
      if (message === "Downloading model" && details) {
        setDetails((oldDetails: any) => {
          if (oldDetails == null) {
            return [details];
          }
          const found = oldDetails.find((d: any) => d.file === details.file);
          if (found) {
            return oldDetails.map((d: any) => (d.file === details.file ? details : d));
          }
          return [...oldDetails, details];
        });
      } else if (message == "Generating") {
        setText((text) => text + details.text);
      }
      setCount((count) => count + 1);
    };

    const onComplete = () => {
      setStatus(TaskStatus.COMPLETED);
    };

    const onError = (error: any) => {
      setStatus(TaskStatus.FAILED);
      setError((err: string | null) => (err ? `${err}\n${error.message}` : error.message));
    };

    const onRegenerate = () => {
      setCount((counter) => counter + 1);
      if (
        task &&
        task instanceof ArrayTask &&
        !(task instanceof DownloadModelTask) &&
        task.hasChildren()
      ) {
        const tasks = task.subGraph.getTasks();
        setArrayProgress({
          completed: tasks.filter((t: ITask) => t.status === TaskStatus.COMPLETED).length,
          total: tasks.length,
        });
        setSubGraph(null);
      } else {
        setSubGraph(task.hasChildren() ? task.subGraph : null);
      }
      setDependantChildren(graph.getTargetTasks(task.config.id));
    };

    const onAbort = () => {
      setStatus(TaskStatus.ABORTING);
      setError((err: string | null) => (err ? `${err}\nAborted` : "Aborted"));
    };

    onRegenerate();

    task.on("start", onStart);
    task.on("progress", onProgress);
    task.on("complete", onComplete);
    task.on("error", onError);
    task.on("regenerate", onRegenerate);
    task.on("abort", onAbort);

    return () => {
      task.off("start", onStart);
      task.off("progress", onProgress);
      task.off("complete", onComplete);
      task.off("error", onError);
      task.off("regenerate", onRegenerate);
      task.off("abort", onAbort);
    };
  }, [task, graph]);

  let icon = getSymbol(task.status);

  const containerKey = `${task.config.id}-${count}`;

  return (
    <Box key={containerKey} flexDirection="column">
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
            <Text color="gray">{`${symbols.arrowDashedRight} ${createBar(d.progress / 100, 10)} ${d.file} ${Math.round(d.progress)}%`}</Text>
          </Box>
        ))}
      {status == TaskStatus.PROCESSING && text && message == "Generating" && (
        <Box marginLeft={2}>
          <Text color="gray">{`${symbols.arrowDashedRight} ${createBar(progress / 100, 10)} ${text}`}</Text>
        </Box>
      )}
      {status == TaskStatus.PROCESSING ? (
        <Box marginLeft={2}>
          <Text color="gray">{`${symbols.arrowRight} ${JSON.stringify(task.runInputData).slice(0, 200)}`}</Text>
        </Box>
      ) : null}
      {status == TaskStatus.COMPLETED ? (
        <Box marginLeft={2}>
          <Text color="gray">{`${symbols.arrowDown} ${JSON.stringify(task.runOutputData).slice(0, 200)}`}</Text>
        </Box>
      ) : null}
      {error ? (
        <Box marginLeft={2}>
          <Text color="red">{`${symbols.warning} ${error}`}</Text>
        </Box>
      ) : null}
      {arrayProgress ? (
        <Box marginLeft={2}>
          <Text color="gray">{`${symbols.arrowDashedRight} Processing array tasks: ${arrayProgress.completed}/${arrayProgress.total} completed ${createBar(arrayProgress.completed / arrayProgress.total, 10)}`}</Text>
        </Box>
      ) : subGraph && !(task instanceof ArrayTask) ? (
        <Box flexDirection="row" marginLeft={2} borderStyle="round">
          <TaskGraphUI graph={subGraph} />
        </Box>
      ) : null}
      {dependantChildren && (
        <Box flexDirection="row" marginLeft={2}>
          {dependantChildren.map((taskItem) => (
            <TaskUI key={`${taskItem.config.id}`} task={taskItem} graph={graph} />
          ))}
        </Box>
      )}
    </Box>
  );
};
