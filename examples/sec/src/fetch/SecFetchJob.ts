//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { JobQueueTaskConfig } from "@ellmers/task-graph";
import { FetchJob, FetchTaskInput } from "@ellmers/tasks";
import { SecUserAgent } from "../config/Constants";

export class SecFetchJob extends FetchJob {
  constructor(config: JobQueueTaskConfig & { input: FetchTaskInput }) {
    // Set SEC-specific headers
    config.input.headers = {
      "User-Agent": SecUserAgent,
      ...config.input.headers,
    };
    super(config);
  }
}
