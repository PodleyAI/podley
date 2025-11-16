//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryRateLimiter } from "@podley/job-queue";
import { SupabaseQueueStorage } from "@podley/storage";
import { describe } from "bun:test";
import { createSupabaseMockClient } from "../helpers/SupabaseMockClient";
import { runGenericJobQueueTests } from "./genericJobQueueTests";

const client = createSupabaseMockClient();

describe("SupabaseJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new SupabaseQueueStorage(client, queueName),
    (queueName: string, maxExecutions: number, windowSizeInSeconds: number) =>
      new InMemoryRateLimiter({ maxExecutions, windowSizeInSeconds })
  );
});
