/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, JsonSchema } from "@workglow/util";
import { FsFolderTabularRepository } from "../tabular/FsFolderTabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema, IKvRepository } from "./IKvRepository";
import { KvViaTabularRepository } from "./KvViaTabularRepository";

export const FS_FOLDER_JSON_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.fsFolderJson"
);

/**
 * A key-value repository implementation that stores values as JSON files in a specified folder.
 * Uses a tabular repository abstraction for file-based persistence.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class FsFolderJsonKvRepository extends KvViaTabularRepository {
  public tabularRepository: FsFolderTabularRepository<
    typeof DefaultKeyValueSchema,
    typeof DefaultKeyValueKey
  >;

  /**
   * Creates a new KvRepository instance
   */
  constructor(
    public folderPath: string,
    keySchema: JsonSchema = { type: "string" },
    valueSchema: JsonSchema = {}
  ) {
    super(keySchema, valueSchema);
    this.tabularRepository = new FsFolderTabularRepository(
      folderPath,
      DefaultKeyValueSchema,
      DefaultKeyValueKey
    );
  }
}
