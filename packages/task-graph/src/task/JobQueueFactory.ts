//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Job, JobConstructorParam, JobQueue, JobQueueOptions } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";
import { createServiceToken, globalServiceRegistry } from "@podley/util";
import type { JobQueueTask, JobQueueTaskConfig } from "./JobQueueTask";
import type { TaskInput, TaskOutput } from "./TaskTypes";

export type JobClassConstructor<Input extends TaskInput, Output extends TaskOutput> = new (
  params: JobConstructorParam<Input, Output>
) => Job<Input, Output>;

export interface JobQueueFactoryParams<Input extends TaskInput, Output extends TaskOutput> {
  queueName: string;
  jobClass: JobClassConstructor<Input, Output>;
  input?: Input;
  config?: JobQueueTaskConfig;
  task?: JobQueueTask<Input, Output>;
  options?: JobQueueOptions<Input, Output>;
}

export type JobQueueFactory = <Input extends TaskInput, Output extends TaskOutput>(
  params: JobQueueFactoryParams<Input, Output>
) => Promise<JobQueue<Input, Output>> | JobQueue<Input, Output>;

export const JOB_QUEUE_FACTORY = createServiceToken<JobQueueFactory>("taskgraph.jobQueueFactory");

const defaultJobQueueFactory: JobQueueFactory = async ({
  queueName,
  jobClass,
  options,
}) => {
  const queueOptions: JobQueueOptions<any, any> = {
    ...(options ?? {}),
  };
  queueOptions.storage ??= new InMemoryQueueStorage(queueName);
  return new JobQueue(queueName, jobClass as JobClassConstructor<any, any>, queueOptions);
};

export function registerJobQueueFactory(factory: JobQueueFactory) {
  globalServiceRegistry.registerInstance(JOB_QUEUE_FACTORY, factory);
}

export function createJobQueueFactoryFromClass(
  QueueCtor: new (
    queueName: string,
    jobCls: JobClassConstructor<any, any>,
    options: JobQueueOptions<any, any>
  ) => JobQueue<any, any>,
  defaultOptions: Partial<JobQueueOptions<any, any>> = {}
): JobQueueFactory {
  return ({ queueName, jobClass, options }) => {
    const mergedOptions: JobQueueOptions<any, any> = {
      ...defaultOptions,
      ...(options ?? {}),
    };
    return new QueueCtor(queueName, jobClass as JobClassConstructor<any, any>, mergedOptions);
  };
}

export function getJobQueueFactory(): JobQueueFactory {
  if (!globalServiceRegistry.has(JOB_QUEUE_FACTORY)) {
    registerJobQueueFactory(defaultJobQueueFactory);
  }
  return globalServiceRegistry.get(JOB_QUEUE_FACTORY);
}

if (!globalServiceRegistry.has(JOB_QUEUE_FACTORY)) {
  registerJobQueueFactory(defaultJobQueueFactory);
}
