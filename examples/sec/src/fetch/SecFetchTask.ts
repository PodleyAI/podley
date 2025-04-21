//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { JobQueueTaskConfig, TaskIO } from "@ellmers/task-graph";
import { FetchTask, FetchTaskInput, FetchTaskOutput } from "@ellmers/tasks";
import { SecJobQueueName } from "../config/Constants";
import { SecFetchJob } from "./SecFetchJob";

/**
 * SEC-specific fetch task
 */
export class SecFetchTask<
  Input extends FetchTaskInput = FetchTaskInput,
  Output extends TaskIO = FetchTaskOutput,
  Config extends JobQueueTaskConfig = JobQueueTaskConfig,
> extends FetchTask<Input, Output, Config> {
  constructor(input: FetchTaskInput = {} as FetchTaskInput, config: Config = {} as Config) {
    config.queueName = SecJobQueueName;
    input.queueName = SecJobQueueName;
    input.response_type ??= "text";

    if (input.headers) {
      input.headers["User-Agent"] = "SEC-Fetch-Task <sr@embarc.com>";
    } else {
      input.headers = { "User-Agent": "SEC-Fetch-Task <sr@embarc.com>" };
    }

    super(input as Input, config);
    this.jobClass = SecFetchJob;
  }
}
