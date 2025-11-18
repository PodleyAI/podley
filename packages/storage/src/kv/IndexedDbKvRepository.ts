/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken } from "@podley/util";
import { TSchema, Type } from "@sinclair/typebox";
import { IndexedDbTabularRepository } from "../tabular/IndexedDbTabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema, IKvRepository } from "./IKvRepository";
import { KvViaTabularRepository } from "./KvViaTabularRepository";

export const IDB_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.indexedDb"
);

/**
 * A key-value repository implementation that uses IndexedDB for persistent storage in the browser.
 * Leverages a tabular repository abstraction for IndexedDB operations.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class IndexedDbKvRepository extends KvViaTabularRepository {
  public tabularRepository: IndexedDbTabularRepository<
    typeof DefaultKeyValueSchema,
    typeof DefaultKeyValueKey
  >;

  /**
   * Creates a new KvRepository instance
   */
  constructor(
    public dbName: string,
    keySchema: TSchema = Type.String(),
    valueSchema: TSchema = Type.Any()
  ) {
    super(keySchema, valueSchema);
    this.tabularRepository = new IndexedDbTabularRepository(
      dbName,
      DefaultKeyValueSchema,
      DefaultKeyValueKey
    );
  }
}
