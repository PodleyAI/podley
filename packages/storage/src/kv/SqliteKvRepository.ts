//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  JSONValue,
  KeyOptionType,
  ValueOptionType,
  KeyOption,
  ValueOption,
} from "../tabular/ITabularRepository";
import { KvRepository } from "./KvRepository";
import { SqliteTabularRepository } from "../tabular/SqliteTabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema, IKvRepository } from "./IKvRepository";
import { createServiceToken } from "@ellmers/util";

export const SQLITE_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.sqlite"
);

/**
 * Abstract base class for key-value storage repositories.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class SqliteKvRepository<
  Key extends KeyOptionType = KeyOptionType,
  Value extends ValueOptionType = JSONValue,
  Combined = { key: Key; value: Value },
> extends KvRepository<Key, Value, Combined> {
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
    primaryKeyType: KeyOption,
    valueType: ValueOption
  ) {
    super(primaryKeyType, valueType);
    this.tabularRepository = new SqliteTabularRepository(
      db,
      dbName,
      DefaultKeyValueSchema,
      DefaultKeyValueKey
    );
  }
}
