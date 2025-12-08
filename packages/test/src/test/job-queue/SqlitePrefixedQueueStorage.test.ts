/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sqlite } from "@workglow/sqlite";
import { SqliteQueueStorage } from "@workglow/storage";
import { describe } from "vitest";
import { runGenericPrefixedQueueStorageTests } from "./genericPrefixedQueueStorageTests";
import { runGenericQueueStorageSubscriptionTests } from "./genericQueueStorageSubscriptionTests";

const db = new Sqlite.Database(":memory:");

describe("SqlitePrefixedQueueStorage", () => {
  runGenericPrefixedQueueStorageTests(
    (queueName: string, options) => new SqliteQueueStorage(db, queueName, options)
  );

  runGenericQueueStorageSubscriptionTests(
    (queueName: string, options) => new SqliteQueueStorage(db, queueName, options),
    { usesPolling: true, pollingIntervalMs: 1 }
  );
});
