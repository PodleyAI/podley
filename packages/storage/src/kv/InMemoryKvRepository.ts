//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@ellmers/util";
import { TSchema, Type } from "@sinclair/typebox";
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
  constructor(keySchema: TSchema = Type.String(), valueSchema: TSchema = Type.Any()) {
    super(keySchema, valueSchema);
    this.tabularRepository = new InMemoryTabularRepository(
      DefaultKeyValueSchema,
      DefaultKeyValueKey
    );
  }
}
