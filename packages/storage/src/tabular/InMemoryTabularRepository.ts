//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, makeFingerprint } from "@podley/util";
import { Static, TObject } from "@sinclair/typebox";
import { ExtractPrimaryKey, ExtractValue, ITabularRepository } from "./ITabularRepository";
import { TabularRepository } from "./TabularRepository";

export const MEMORY_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.inMemory"
);

/**
 * A generic in-memory key-value repository implementation.
 * Provides a simple, non-persistent storage solution suitable for testing and caching scenarios.
 *
 * @template Schema - The schema definition for the entity using TypeBox
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export class InMemoryTabularRepository<
  Schema extends TObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Static<Schema>>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = Static<Schema>,
  Value = ExtractValue<Schema, PrimaryKeyNames>,
> extends TabularRepository<Schema, PrimaryKeyNames, PrimaryKey, Entity, Value> {
  /** Internal storage using a Map with fingerprint strings as keys */
  values = new Map<string, Entity>();

  /**
   * Creates a new InMemoryTabularRepository instance
   * @param schema - Schema defining the structure of the entity
   * @param primaryKeyNames - Array of property names that form the primary key
   * @param indexes - Array of columns or column arrays to make searchable. Each string or single column creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    schema: Schema,
    primaryKeyNames: PrimaryKeyNames,
    indexes: Array<keyof Entity | Array<keyof Entity>> = []
  ) {
    super(schema, primaryKeyNames, indexes);
  }

  /**
   * Sets up the database for the repository (no-op for in-memory)
   */
  async setupDatabase(): Promise<void> {
    // No setup needed for in-memory storage
  }

  /**
   * Stores a key-value pair in the repository
   * @param value - The combined object to store
   * @returns The stored entity
   * @emits 'put' event with the stored entity when successful
   */
  async put(value: Entity): Promise<Entity> {
    const { key } = this.separateKeyValueFromCombined(value);
    const id = await makeFingerprint(key);
    this.values.set(id, value);
    this.events.emit("put", value);
    return value;
  }

  /**
   * Stores multiple key-value pairs in the repository in a bulk operation
   * @param values - Array of combined objects to store
   * @returns Array of stored entities
   * @emits 'put' event for each value stored
   */
  async putBulk(values: Entity[]): Promise<Entity[]> {
    return await Promise.all(values.map(async (value) => this.put(value)));
  }

  /**
   * Retrieves a value by its key
   * @param key - The primary key object to look up
   * @returns The value object if found, undefined otherwise
   * @emits 'get' event with the fingerprint ID and value when found
   */
  async get(key: PrimaryKey): Promise<Entity | undefined> {
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
  async search(key: Partial<Entity>): Promise<Entity[] | undefined> {
    const searchKeys = Object.keys(key) as Array<keyof Entity>;
    if (searchKeys.length === 0) {
      return undefined;
    }

    // Find the best matching index
    const bestIndex = this.findBestMatchingIndex(searchKeys);
    if (!bestIndex) {
      throw new Error(
        `No suitable index found for the search criteria, searching for ['${searchKeys.join(
          "', '"
        )}'] with pk ['${this.primaryKeyNames.join("', '")}'] and indexes ['${this.indexes.join(
          "', '"
        )}']`
      );
    }

    // Filter results based on the search criteria
    const results = Array.from(this.values.values()).filter((item) =>
      // @ts-ignore
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
  async delete(value: PrimaryKey | Entity): Promise<void> {
    const { key } = this.separateKeyValueFromCombined(value as Entity);
    const id = await makeFingerprint(key);
    this.values.delete(id);
    this.events.emit("delete", key as keyof Entity);
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
  async getAll(): Promise<Entity[] | undefined> {
    const all = Array.from(this.values.values());
    return all.length > 0 ? all : undefined;
  }

  /**
   * Returns the number of entries in the repository
   * @returns The total count of stored entries
   */
  async size(): Promise<number> {
    return this.values.size;
  }

  /**
   * Deletes all entries with a date column value older than the provided date
   * @param column - The name of the date column to compare against
   * @param value - The value to compare against
   * @param operator - The operator to use for comparison
   */
  async deleteSearch(
    column: keyof Entity,
    value: Entity[keyof Entity],
    operator: "=" | "<" | "<=" | ">" | ">=" = "="
  ): Promise<void> {
    const entries = this.values.entries();

    const entriesToDelete = entries.filter(([_, entity]) => {
      const columnValue = entity[column];
      switch (operator) {
        case "=":
          return columnValue === value;
        case "<":
          return columnValue !== null && columnValue !== undefined && columnValue < value;
        case "<=":
          return columnValue !== null && columnValue !== undefined && columnValue <= value;
        case ">":
          return columnValue !== null && columnValue !== undefined && columnValue > value;
        case ">=":
          return columnValue !== null && columnValue !== undefined && columnValue >= value;
        default:
          return false;
      }
    });
    // Delete the filtered entries
    for (const [id, _] of entriesToDelete) {
      this.values.delete(id);
    }

    if (Array.from(entriesToDelete).length > 0) {
      this.events.emit("delete", column);
    }
  }

  /**
   * Destroys the repository and frees up resources.
   */
  destroy(): void {
    this.values.clear();
  }
}
