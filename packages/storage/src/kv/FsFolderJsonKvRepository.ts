//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@podley/util";
import { TSchema, Type } from "typebox";
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
    keySchema: TSchema = Type.String(),
    valueSchema: TSchema = Type.Any()
  ) {
    super(keySchema, valueSchema);
    this.tabularRepository = new FsFolderTabularRepository(
      folderPath,
      DefaultKeyValueSchema,
      DefaultKeyValueKey
    );
  }
}
