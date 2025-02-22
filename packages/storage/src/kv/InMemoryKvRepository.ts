//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { JSONValue } from "./IKvRepository";
import { KvRepository } from "./KvRepository";
import { InMemoryTabularRepository } from "../tabular/InMemoryTabularRepository";
import { BasicKeyType } from "../tabular/ITabularRepository";

/**
 * Abstract base class for key-value storage repositories.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class InMemoryKvRepository<
  Key extends BasicKeyType = BasicKeyType,
  Value extends JSONValue = JSONValue,
  Combined = { key: Key; value: Value },
> extends KvRepository<Key, Value, Combined> {
  public tabularRepository: InMemoryTabularRepository;

  /**
   * Creates a new KvRepository instance
   */
  constructor(
    primaryKeyType: "string" | "number" | "bigint" | "uuid4",
    valueType: "string" | "number" | "bigint" | "json"
  ) {
    super(primaryKeyType, valueType);
    this.tabularRepository = new InMemoryTabularRepository();
  }
}
