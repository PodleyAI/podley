//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { simplifySchema } from "@ellmers/util";
import { Static } from "@sinclair/typebox";
import type { TabularRepository } from "../tabular/TabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema } from "./IKvRepository";
import { KvRepository } from "./KvRepository";

/**
 * Abstract base class for key-value storage repositories that uses a tabular repository for storage.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export abstract class KvViaTabularRepository<
  Key extends string = string,
  Value extends any = any,
  Combined = { key: Key; value: Value },
> extends KvRepository<Key, Value, Combined> {
  public abstract tabularRepository: TabularRepository<
    typeof DefaultKeyValueSchema,
    typeof DefaultKeyValueKey,
    (typeof DefaultKeyValueSchema)["key"],
    Static<typeof DefaultKeyValueSchema>
  >;

  /**
   * Stores a row in the repository.
   * @param key - The primary key
   * @param value - The value to store
   */
  public async put(key: Key, value: Value): Promise<void> {
    // Handle objects that need to be JSON-stringified, TODO(str): should put in the type
    const shouldStringify = !["number", "boolean", "string", "blob"].includes(
      simplifySchema(this.valueSchema).type
    );

    if (shouldStringify) {
      value = JSON.stringify(value) as Value;
    }
    return await this.tabularRepository.put({ key, value });
  }

  /**
   * Retrieves a value by its key.
   * This is a convenience method that automatically converts simple types to structured format if using default schema.
   *
   * @param key - Primary key to look up (basic key like default schema)
   * @returns The stored value or undefined if not found
   */
  public async get(key: Key): Promise<Value | undefined> {
    const result = await this.tabularRepository.get({ key });
    if (result) {
      const shouldParse = !["number", "boolean", "string", "blob"].includes(
        simplifySchema(this.valueSchema).type
      );

      if (shouldParse) {
        try {
          return JSON.parse(result.value as unknown as string) as Value;
        } catch (e) {
          return result.value as unknown as Value;
        }
      } else {
        return result.value as unknown as Value;
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
    return await this.tabularRepository.delete({ key });
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
            value: (() => {
              const shouldParse = !["number", "boolean", "string"].includes(
                simplifySchema(this.valueSchema).type
              );

              if (shouldParse && typeof value.value === "string") {
                try {
                  return JSON.parse(value.value);
                } catch (e) {
                  return value.value;
                }
              }
              return value.value;
            })(),
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
