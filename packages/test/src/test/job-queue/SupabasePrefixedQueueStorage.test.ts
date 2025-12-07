/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupabaseQueueStorage } from "@workglow/storage";
import { describe } from "vitest";
import { createSupabaseMockClient } from "../helpers/SupabaseMockClient";
import { runGenericPrefixedQueueStorageTests } from "./genericPrefixedQueueStorageTests";

const client = createSupabaseMockClient();

describe("SupabasePrefixedQueueStorage", () => {
  runGenericPrefixedQueueStorageTests(
    (queueName: string, options) => new SupabaseQueueStorage(client, queueName, options)
  );
});
