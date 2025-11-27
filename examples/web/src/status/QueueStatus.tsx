/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { JobStatus } from "@workglow/job-queue";
import { getTaskQueueRegistry } from "@workglow/task-graph";
import { useCallback, useEffect, useState } from "react";

export function QueueStatus({ queueType }: { queueType: string }) {
  const queue = getTaskQueueRegistry().getQueue(queueType);
  const [pending, setPending] = useState<number>(0);
  const [processing, setProcessing] = useState<number>(0);
  const [completed, setCompleted] = useState<number>(0);
  const [aborting, setAborting] = useState<number>(0);
  const [errors, setErrors] = useState<number>(0);
  const [disabled, setDisabled] = useState<number>(0);

  useEffect(() => {
    async function listen() {
      setPending(await queue.size(JobStatus.PENDING));
      setProcessing(await queue.size(JobStatus.PROCESSING));
      setCompleted(await queue.size(JobStatus.COMPLETED));
      setAborting(await queue.size(JobStatus.ABORTING));
      setErrors(await queue.size(JobStatus.FAILED));
      setDisabled(await queue.size(JobStatus.DISABLED));
    }

    queue.on("job_start", listen);
    queue.on("job_complete", listen);
    queue.on("job_error", listen);
    queue.on("job_aborting", listen);
    queue.on("job_disabled", listen);
    listen();

    return () => {
      queue.off("job_start", listen);
      queue.off("job_complete", listen);
      queue.off("job_error", listen);
      queue.off("job_aborting", listen);
      queue.off("job_disabled", listen);
    };
  }, []);

  const clear = useCallback(() => {
    queue.clear();
    setPending(0);
    setProcessing(0);
    setCompleted(0);
    setAborting(0);
    setErrors(0);
    setDisabled(0);
  }, [queue]);

  return (
    <span>
      <span>{queue.queueName.split("_").pop()}</span>: <span title="Pending">{pending}</span> /{" "}
      <span title="Processing">{processing}</span> / <span title="Completed">{completed}</span> /{" "}
      <span title="Aborting">{aborting}</span> / <span title="Errors">{errors}</span> /{" "}
      <span title="Disabled">{disabled}</span>
      <button className="float-right" onClick={clear}>
        Clear
      </button>
    </span>
  );
}

export function QueuesStatus() {
  const queues = getTaskQueueRegistry().queues;
  const queueKeys = Array.from(queues.keys());

  return (
    <div>
      <h2>Queue Status</h2>

      {queueKeys.map((queueKey, i) => (
        <div key={queueKey}>
          <QueueStatus queueType={queueKey} />
        </div>
      ))}
    </div>
  );
}
