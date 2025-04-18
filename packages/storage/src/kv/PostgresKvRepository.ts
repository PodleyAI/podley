//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@ellmers/util";
import { TSchema, Type } from "@sinclair/typebox";
import { PostgresTabularRepository } from "../tabular/PostgresTabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema, IKvRepository } from "./IKvRepository";
import { KvViaTabularRepository } from "./KvViaTabularRepository";

export const POSTGRES_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.postgres"
);

/**
 * A key-value repository implementation that uses PostgreSQL for persistent storage.
 * Leverages a tabular repository abstraction for PostgreSQL operations.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class PostgresKvRepository extends KvViaTabularRepository {
  public tabularRepository: PostgresTabularRepository<
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
    this.tabularRepository = new PostgresTabularRepository(
      db,
      dbName,
      DefaultKeyValueSchema,
      DefaultKeyValueKey
    );
  }
}
