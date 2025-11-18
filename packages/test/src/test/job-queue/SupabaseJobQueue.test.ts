/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryRateLimiter } from "@podley/job-queue";
import { SupabaseQueueStorage } from "@podley/storage";
import { describe } from "vitest";
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
