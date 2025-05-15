//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ITask, ITaskGraph, TaskStatus, ArrayTask } from "@ellmers/task-graph";
import type { FC } from "react";
import { memo, useEffect, useState } from "react";
import { Box, List, Text, useList, useListItem } from "retuink";
import { createBar, Spinner, symbols } from "./Elements";
import TaskGraphUI from "./TaskGraphUI";
import { DownloadModelTask } from "@ellmers/ai";

const StatusIcon = memo(
  ({ status, dependant }: { status: TaskStatus; dependant: boolean }) => {
    const dep = (
      <Text color="grey">{!dependant ? symbols.arrowDashedRight : symbols.arrowDashedDown} </Text>
    );
    let sym = null;
    if (status === TaskStatus.PROCESSING) {
      sym = <Spinner color="yellow" />;
    }

    if (status === TaskStatus.ABORTING) {
      sym = <Text color="yellow">{symbols.warning}</Text>;
    }

    if (status === TaskStatus.FAILED) {
      sym = <Text color="red">{symbols.cross}</Text>;
    }

    if (status === TaskStatus.SKIPPED) {
      sym = <Text color="gray">{symbols.info}</Text>;
    }

    if (status === TaskStatus.COMPLETED) {
      sym = <Text color="green">{symbols.tick}</Text>;
    }

    if (status === TaskStatus.PENDING) {
      sym = <Text color="gray">{symbols.squareSmallFilled}</Text>;
    }

    return (
      <>
        {dep}
        {sym}
      </>
    );
  },
  (prevProps, nextProps) => prevProps.status === nextProps.status
);

export const TaskUI: FC<{
  task: ITask;
  graph: ITaskGraph;
  dependant?: boolean;
}> = ({ task, graph, dependant = false }) => {
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
      const [newProgress, newMessage, newDetails] = args;

      setProgress(newProgress);
      setMessage(newMessage);

      if (newMessage === "Downloading model" && newDetails) {
        setDetails((oldDetails: any) => {
          if (oldDetails == null) {
            return [newDetails];
          }
          const found = oldDetails.find((d: any) => d.file === newDetails.file);
          if (found) {
            return oldDetails.map((d: any) => (d.file === newDetails.file ? newDetails : d));
          }
          return [...oldDetails, newDetails];
        });
      } else if (newMessage === "Generating" && newDetails?.text) {
        setText((prevText) => prevText + newDetails.text);
      }
    };

    const onComplete = () => {
      setStatus(TaskStatus.COMPLETED);
    };

    const onError = (error: any) => {
      setStatus(TaskStatus.FAILED);
      setError((prevErr) => (prevErr ? `${error?.message}` : error?.message));
    };

    const onRegenerate = () => {
      setCount((c) => c + 1);
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
      setError((prevErr) => (prevErr ? `${prevErr}\nAborted` : "Aborted"));
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

  const containerKey = `${task.config.id}-${count}`;

  return (
    <Box key={containerKey} flexDirection="column">
      <Box height={1}>
        <Box marginRight={1} flexShrink={0}>
          <StatusIcon status={status} dependant={dependant} />
        </Box>

        <Box flexShrink={0}>
          <Text>{task.config.name || (task.config.id as string)}</Text>
        </Box>
        {status == TaskStatus.PROCESSING && progress == 0 && (
          <Box marginLeft={2}>
            <Text
              color="gray"
              wrap="truncate-middle"
            >{`${symbols.arrowLeft} ${JSON.stringify(task.runInputData).slice(0, 200)}`}</Text>
          </Box>
        )}

        {status === TaskStatus.PROCESSING && progress > 0 && (
          <Box marginLeft={2} flexShrink={1}>
            <Text dimColor>[{status}]</Text>
            <Text dimColor>
              {progress > 0 &&
                ` ${createBar(progress / 100, 20)} ${message ?? ""} ${Math.round(progress)}%`}
            </Text>
          </Box>
        )}
        {status == TaskStatus.COMPLETED && (
          <Box marginLeft={2} flexShrink={1}>
            <Text
              color="gray"
              wrap="truncate"
            >{`${symbols.arrowRight} ${JSON.stringify(task.runOutputData).slice(0, 150)}`}</Text>
          </Box>
        )}
        {error && (
          <Box marginLeft={2} flexShrink={1}>
            <Text color="red">{`${symbols.warning} ${error}`}</Text>
          </Box>
        )}
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
          <Text color="gray">{`${symbols.arrowDashedRight} ${createBar(progress / 100, 10)} ${text ?? ""}`}</Text>
        </Box>
      )}
      {arrayProgress && (
        <Box marginLeft={2}>
          <Text color="gray">{`${symbols.arrowDashedRight} Processing array tasks: ${arrayProgress.completed}/${arrayProgress.total} completed ${createBar(arrayProgress.completed / arrayProgress.total, 10)}`}</Text>
        </Box>
      )}
      {!arrayProgress && subGraph && !(task instanceof ArrayTask) && (
        <Box flexDirection="column" marginLeft={2} borderColor="gray">
          <TaskGraphUI graph={subGraph} />
        </Box>
      )}
      {dependantChildren && (
        <Box flexDirection="column">
          {dependantChildren.map((taskItem) => (
            <TaskUI key={`${taskItem.config.id}`} task={taskItem} graph={graph} dependant={true} />
          ))}
        </Box>
      )}
    </Box>
  );
};
