//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { JSONValue, KeyOptionType, ValueOptionType } from "../tabular/ITabularRepository";
import type { TabularRepository } from "../tabular/TabularRepository";
import {
  DefaultKeyValueKey,
  DefaultKeyValueSchema,
  DefaultKvPk,
  DefaultKvValue,
} from "./IKvRepository";
import { KvRepository } from "./KvRepository";

/**
 * Abstract base class for key-value storage repositories.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export abstract class KvViaTabularRepository<
  Key extends KeyOptionType = KeyOptionType,
  Value extends ValueOptionType = JSONValue,
  Combined = { key: Key; value: Value },
> extends KvRepository<Key, Value, Combined> {
  public abstract tabularRepository: TabularRepository<
    typeof DefaultKeyValueSchema,
    typeof DefaultKeyValueKey
  >;

  /**
   * Stores a row in the repository.
   * @param key - The primary key
   * @param value - The value to store
   */
  public async put(key: Key, value: Value): Promise<void> {
    const tKey = { key } as DefaultKvPk;
    let tValue: DefaultKvValue;
    if (this.valueType === "json") {
      tValue = { value: JSON.stringify(value) } as DefaultKvValue;
    } else {
      tValue = { value } as DefaultKvValue;
    }
    return await this.tabularRepository.put({ ...tKey, ...tValue });
  }

  /**
   * Retrieves a value by its key.
   * This is a convenience method that automatically converts simple types to structured format if using default schema.
   *
   * @param key - Primary key to look up (basic key like default schema)
   * @returns The stored value or undefined if not found
   */
  public async get(key: Key): Promise<Value | undefined> {
    const result = await this.tabularRepository.get({ key } as DefaultKvPk);
    if (result) {
      if (this.valueType === "json") {
        return JSON.parse(result.value as string) as Value;
      } else {
        return result.value as Value;
      }
    } else {
      return undefined;
    }
  }

  /**
   * Deletes a row from the repository.
   * @param key - The primary key of the row to delete
   */
  public async delete(key: Key): Promise<void> {
    return await this.tabularRepository.delete({ key } as DefaultKvPk);
  }

  /**
   * Retrieves all rows from the repository.
   * @returns An array of all rows in the repository or undefined if empty
   */
  public async getAll(): Promise<Combined[] | undefined> {
    const values = await this.tabularRepository.getAll();
    if (values) {
      return values.map(
        (value) =>
          ({
            key: value.key,
            value: this.valueType === "json" ? JSON.parse(value.value as string) : value.value,
          }) as Combined
      );
    }
  }

  /**
   * Deletes all rows from the repository.
   */
  public async deleteAll(): Promise<void> {
    return await this.tabularRepository.deleteAll();
  }

  /**
   * Retrieves the number of rows in the repository.
   * @returns The number of rows in the repository
   */
  public async size(): Promise<number> {
    return await this.tabularRepository.size();
  }
}
