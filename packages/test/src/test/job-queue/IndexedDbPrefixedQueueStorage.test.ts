/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexedDbQueueStorage } from "@workglow/storage";
import "fake-indexeddb/auto";
import { describe } from "vitest";
import { runGenericPrefixedQueueStorageTests } from "./genericPrefixedQueueStorageTests";

describe("IndexedDbPrefixedQueueStorage", () => {
  runGenericPrefixedQueueStorageTests(
    (queueName: string, options) => new IndexedDbQueueStorage(queueName, options)
  );
});
