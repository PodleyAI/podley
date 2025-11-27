/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, JsonSchema } from "@workglow/util";
import { InMemoryTabularRepository } from "../tabular/InMemoryTabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema, IKvRepository } from "./IKvRepository";
import { KvViaTabularRepository } from "./KvViaTabularRepository";

export const MEMORY_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.inMemory"
);

/**
 * An in-memory key-value repository implementation for fast, ephemeral storage.
 * Uses a tabular repository abstraction for in-memory persistence.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class InMemoryKvRepository extends KvViaTabularRepository {
  public tabularRepository: InMemoryTabularRepository<
    typeof DefaultKeyValueSchema,
    typeof DefaultKeyValueKey
  >;

  /**
   * Creates a new KvRepository instance
   */
  constructor(keySchema: JsonSchema = { type: "string" }, valueSchema: JsonSchema = {}) {
    super(keySchema, valueSchema);
    this.tabularRepository = new InMemoryTabularRepository(
      DefaultKeyValueSchema,
      DefaultKeyValueKey
    );
  }
}
