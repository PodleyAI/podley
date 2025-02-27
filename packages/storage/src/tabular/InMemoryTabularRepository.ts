//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { makeFingerprint } from "@ellmers/util";
import {
  BaseValueSchema,
  BasePrimaryKeySchema,
  BasicKeyType,
  DefaultValueType,
  DefaultValueSchema,
  DefaultPrimaryKeyType,
  DefaultPrimaryKeySchema,
} from "./ITabularRepository";
import { TabularRepository } from "./TabularRepository";

/**
 * A generic in-memory key-value repository implementation.
 * Provides a simple, non-persistent storage solution suitable for testing and caching scenarios.
 *
 * @template Key - The type of the primary key object, must be a record of basic types
 * @template Value - The type of the value object being stored
 * @template PrimaryKeySchema - Schema definition for the primary key
 * @template ValueSchema - Schema definition for the value
 * @template Combined - The combined type of Key & Value
 */
export class InMemoryTabularRepository<
  Key extends Record<string, BasicKeyType> = DefaultPrimaryKeyType,
  Value extends Record<string, any> = DefaultValueType,
  PrimaryKeySchema extends BasePrimaryKeySchema = typeof DefaultPrimaryKeySchema,
  ValueSchema extends BaseValueSchema = typeof DefaultValueSchema,
  Combined extends Record<string, any> = Key & Value,
> extends TabularRepository<Key, Value, PrimaryKeySchema, ValueSchema, Combined> {
  /** Internal storage using a Map with fingerprint strings as keys */
  values = new Map<string, Combined>();

  /**
   * Creates a new InMemoryTabularRepository instance
   * @param primaryKeySchema - Schema defining the structure of primary keys
   * @param valueSchema - Schema defining the structure of values
   * @param searchable - Array of columns or column arrays to make searchable. Each string creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    primaryKeySchema: PrimaryKeySchema = DefaultPrimaryKeySchema as PrimaryKeySchema,
    valueSchema: ValueSchema = DefaultValueSchema as ValueSchema,
    searchable: Array<keyof Combined | Array<keyof Combined>> = []
  ) {
    super(primaryKeySchema, valueSchema, searchable);
  }

  /**
   * Stores a key-value pair in the repository
   * @param value - The combined object to store
   * @emits 'put' event with the fingerprint ID when successful
   */
  async put(value: Combined): Promise<void> {
    const { key } = this.separateKeyValueFromCombined(value);
    const id = await makeFingerprint(key);
    this.values.set(id, value);
    this.events.emit("put", value);
  }

  /**
   * Retrieves a value by its key
   * @param key - The primary key object to look up
   * @returns The value object if found, undefined otherwise
   * @emits 'get' event with the fingerprint ID and value when found
   */
  async get(key: Key): Promise<Combined | undefined> {
    const id = await makeFingerprint(key);
    const out = this.values.get(id);
    this.events.emit("get", key, out);
    return out;
  }

  /**
   * Searches for entries matching a partial key
   * @param key - Partial key object to search for
   * @returns Array of matching combined objects
   * @throws Error if search criteria outside of searchable fields
   */
  async search(key: Partial<Combined>): Promise<Combined[] | undefined> {
    const searchKeys = Object.keys(key);
    if (searchKeys.length === 0) {
      return undefined;
    }

    // Find the best matching index
    const bestIndex = this.findBestMatchingIndex(searchKeys);
    if (!bestIndex) {
      throw new Error("No suitable index found for the search criteria");
    }

    // Filter results based on the search criteria
    const results = Array.from(this.values.values()).filter((item) =>
      Object.entries(key).every(([k, v]) => item[k] === v)
    );

    if (results.length > 0) {
      this.events.emit("search", key, results);
      return results;
    } else {
      this.events.emit("search", key, undefined);
      return undefined;
    }
  }

  /**
   * Deletes an entry by its key
   * @param key - The primary key object of the entry to delete
   * @emits 'delete' event with the fingerprint ID when successful
   */
  async delete(value: Key | Combined): Promise<void> {
    const { key } = this.separateKeyValueFromCombined(value as Combined);
    const id = await makeFingerprint(key);
    this.values.delete(id);
    this.events.emit("delete", key);
  }

  /**
   * Removes all entries from the repository
   * @emits 'clearall' event when successful
   */
  async deleteAll(): Promise<void> {
    this.values.clear();
    this.events.emit("clearall");
  }

  /**
   * Returns an array of all entries in the repository
   * @returns Array of all entries in the repository
   */
  async getAll(): Promise<Combined[] | undefined> {
    return Array.from(this.values.values());
  }

  /**
   * Returns the number of entries in the repository
   * @returns The total count of stored entries
   */
  async size(): Promise<number> {
    return this.values.size;
  }
}
