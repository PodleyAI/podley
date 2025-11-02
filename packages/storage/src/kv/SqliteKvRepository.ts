//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@podley/util";
import { TSchema, Type } from "typebox";
import { SqliteTabularRepository } from "../tabular/SqliteTabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema, IKvRepository } from "./IKvRepository";
import { KvViaTabularRepository } from "./KvViaTabularRepository";

export const SQLITE_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.sqlite"
);

/**
 * A key-value repository implementation that uses SQLite for persistent storage.
 * Leverages a tabular repository abstraction for SQLite operations.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class SqliteKvRepository extends KvViaTabularRepository {
  public tabularRepository: SqliteTabularRepository<
    typeof DefaultKeyValueSchema,
    typeof DefaultKeyValueKey
  >;

  /**
   * Creates a new KvRepository instance
   */
  constructor(
    public db: any,
    public dbName: string,
    keySchema: TSchema = Type.String(),
    valueSchema: TSchema = Type.Any()
  ) {
    super(keySchema, valueSchema);
    this.tabularRepository = new SqliteTabularRepository(
      db,
      dbName,
      DefaultKeyValueSchema,
      DefaultKeyValueKey
    );
  }
}
