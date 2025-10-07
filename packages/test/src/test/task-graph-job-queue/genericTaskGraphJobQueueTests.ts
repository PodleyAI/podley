//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { expect, it, beforeEach, afterEach } from "bun:test";
import { Job, JobQueue, IJobExecuteContext } from "@podley/job-queue";
import { getTaskQueueRegistry, JobQueueTask, TaskInput, TaskOutput } from "@podley/task-graph";
import { TestIOTask } from "../task/TestTasks";

export class TestJob extends Job<TaskInput, TaskOutput> {
  async execute(input: TaskInput, context: IJobExecuteContext): Promise<TaskOutput> {
    return { result: (input as any).a + (input as any).b };
  }
}

export class TestJobTask extends JobQueueTask {
  static readonly type: string = "TestJobTask";
}

export function runGenericTaskGraphJobQueueTests(
  createJobQueue: () => Promise<JobQueue<TaskInput, TaskOutput>>
) {
  let jobQueue: JobQueue<TaskInput, TaskOutput>;

  beforeEach(async () => {
    jobQueue = await createJobQueue();
    getTaskQueueRegistry().registerQueue(jobQueue);
  });

  afterEach(async () => {
    await jobQueue.stop();
    await jobQueue.clear();
  });

  it("should run a task via job queue", async () => {
    await jobQueue.start();
    const task = new TestJobTask(
      { a: 1, b: 2 },
      {
        queueName: jobQueue.queueName,
      }
    );
    const result = await task.run();
    expect(result).toEqual({ result: 3 });
  });
  it("should not run a task via job queue if not started", async () => {
    const task = new TestJobTask(
      { a: 1, b: 2 },
      {
        queueName: jobQueue.queueName,
      }
    );
    const wait = (ms: number, result: any) =>
      new Promise((resolve) => setTimeout(resolve, ms, result));
    const result = await Promise.race([task.run(), wait(10, "STOP")]);
    expect(result).toEqual("STOP");
  });
}
