//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  JSONValue,
  ValueOptionType,
} from "../tabular/ITabularRepository";
import { Type, TSchema } from "@sinclair/typebox";
import { KvViaTabularRepository } from "./KvViaTabularRepository";
import { IndexedDbTabularRepository } from "../tabular/IndexedDbTabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema, IKvRepository } from "./IKvRepository";
import { createServiceToken } from "@ellmers/util";

export const IDB_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.indexedDb"
);

/**
 * Abstract base class for key-value storage repositories.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class IndexedDbKvRepository<
  Key = string,
  Value extends ValueOptionType = JSONValue,
  Combined = { key: Key; value: Value },
> extends KvViaTabularRepository<Key, Value, Combined> {
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
