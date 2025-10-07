//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe } from "bun:test";
import { SupabaseQueueStorage } from "@podley/storage";
import { runGenericJobQueueTests } from "./genericJobQueueTests";
import { createSupabaseMockClient } from "../helpers/SupabaseMockClient";
import { InMemoryRateLimiter } from "@podley/job-queue";

const client = createSupabaseMockClient();

class SupabaseJobQueue extends SupabaseQueueStorage<any, any> {
  protected isSetup = false; // force setup to run, which is not the default
}

describe("SupabaseJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new SupabaseJobQueue(client, queueName),
    (queueName: string, maxExecutions: number, windowSizeInSeconds: number) =>
      new InMemoryRateLimiter({ maxExecutions, windowSizeInSeconds })
  );
});
