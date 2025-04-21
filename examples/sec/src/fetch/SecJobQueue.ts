//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { FetchTaskInput, FetchTaskOutput } from "@ellmers/tasks";
import { InMemoryRateLimiter, JobQueue } from "@ellmers/job-queue";
import { InMemoryQueueStorage } from "@ellmers/storage";
import { getTaskQueueRegistry } from "@ellmers/task-graph";
import { SecJobQueueName } from "../config/Constants";
import { SecFetchJob } from "./SecFetchJob";

export const SecJobQueue = new JobQueue<FetchTaskInput, FetchTaskOutput, SecFetchJob>(
  SecJobQueueName,
  SecFetchJob,
  {
    storage: new InMemoryQueueStorage(SecJobQueueName),
    limiter: new InMemoryRateLimiter(100, 1),
    waitDurationInMilliseconds: 1,
  }
);
getTaskQueueRegistry().registerQueue(SecJobQueue);
