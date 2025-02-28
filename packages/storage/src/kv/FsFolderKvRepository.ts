//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  JSONValue,
  ValueOptionType,
  KeyOptionType,
  KeyOption,
  ValueOption,
} from "../tabular/ITabularRepository";
import { KvRepository } from "./KvRepository";
import { FsFolderTabularRepository } from "../tabular/FsFolderTabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema } from "./IKvRepository";

/**
 * Abstract base class for key-value storage repositories.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class FsFolderKvRepository<
  Key extends KeyOptionType = KeyOptionType,
  Value extends ValueOptionType = JSONValue,
  Combined = { key: Key; value: Value },
> extends KvRepository<Key, Value, Combined> {
  public tabularRepository: FsFolderTabularRepository<
    typeof DefaultKeyValueSchema,
    typeof DefaultKeyValueKey
  >;

  /**
   * Creates a new KvRepository instance
   */
  constructor(
    public folderPath: string,
    primaryKeyType: KeyOption,
    valueType: ValueOption
  ) {
    super(primaryKeyType, valueType);
    this.tabularRepository = new FsFolderTabularRepository(
      folderPath,
      DefaultKeyValueSchema,
      DefaultKeyValueKey
    );
  }
}
