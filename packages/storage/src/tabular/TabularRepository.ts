//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, EventEmitter, makeFingerprint } from "@podley/util";
import { Static, TObject, Type } from "@sinclair/typebox";
import {
  ExtractPrimaryKey,
  ExtractValue,
  ITabularRepository,
  TabularEventListener,
  TabularEventListeners,
  TabularEventName,
  TabularEventParameters,
} from "./ITabularRepository";
import { ValueOptionType } from "./ITabularRepository";

export const TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository"
);

/**
 * Abstract base class for tabular storage repositories.
 * Provides functionality for storing and retrieving data with typed
 * primary keys and values, and supports compound keys and partial key lookup.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Schema - The schema definition for the entity using TypeBox
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export abstract class TabularRepository<
  Schema extends TObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Static<Schema>>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = Static<Schema>,
  Value = ExtractValue<Schema, PrimaryKeyNames>,
> implements ITabularRepository<Schema, PrimaryKeyNames, PrimaryKey, Entity>
{
  /** Event emitter for repository events */
  protected events = new EventEmitter<TabularEventListeners<PrimaryKey, Entity>>();

  protected indexes: Array<keyof Entity>[];
  protected primaryKeySchema: TObject;
  protected valueSchema: TObject;

  /**
   * Creates a new TabularRepository instance
   * @param schema - Schema defining the structure of the entity
   * @param primaryKeyNames - Array of property names that form the primary key
   * @param indexes - Array of columns or column arrays to make searchable. Each string or single column creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    protected schema: Schema,
    protected primaryKeyNames: PrimaryKeyNames,
    indexes: Array<keyof Entity | Array<keyof Entity>> = []
  ) {
    const primaryKeyProps: Record<string, any> = {};
    const valueProps: Record<string, any> = {};
    const primaryKeySet = new Set(primaryKeyNames);

    // Split the schema properties into primary key and value properties
    for (const [key, typeDef] of Object.entries(schema.properties)) {
      if (primaryKeySet.has(key as keyof Static<Schema>)) {
        primaryKeyProps[key] = { ...typeDef };
      } else {
        valueProps[key] = { ...typeDef };
      }
    }

    this.primaryKeySchema = Type.Object(primaryKeyProps);
    this.valueSchema = Type.Object(valueProps);

    // validate all combined columns names are "identifier" names
    const combinedColumns = [...this.primaryKeyColumns(), ...this.valueColumns()];
    for (const column of combinedColumns) {
      if (typeof column !== "string") {
        throw new Error("Column names must be strings");
      }
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(column)) {
        throw new Error(
          "Column names must start with a letter and contain only letters, digits, and underscores"
        );
      }
    }

    // Normalize searchable into array of arrays
    this.indexes = indexes.map((spec) => (Array.isArray(spec) ? spec : [spec])) as Array<
      Array<keyof Entity>
    >;

    // searchable is an array of compound keys, which are arrays of columns
    // clean up searchable array by removing any compoundkeys that are a prefix of another compoundkey
    // or a prefix of the primary key
    this.indexes = this.filterCompoundKeys(
      this.primaryKeyColumns() as unknown as Array<keyof Entity>,
      this.indexes
    );

    // Validate searchable columns
    for (const compoundIndex of this.indexes) {
      for (const column of compoundIndex) {
        if (
          !(column in this.primaryKeySchema.properties) &&
          !(column in this.valueSchema.properties)
        ) {
          throw new Error(
            `Searchable column ${String(column)} is not in the primary key schema or value schema`
          );
        }
      }
    }
  }

  protected filterCompoundKeys(
    primaryKey: Array<keyof Entity>,
    potentialKeys: Array<keyof Entity>[]
  ): Array<keyof Entity>[] {
    // Function to check if one array is a prefix of another
    const isPrefix = (prefix: Array<keyof Entity>, arr: Array<keyof Entity>): boolean => {
      if (prefix.length > arr.length) return false;
      return prefix.every((val, index) => val === arr[index]);
    };

    // Sort potential keys by length
    potentialKeys.sort((a, b) => a.length - b.length);

    let filteredKeys: Array<keyof Entity>[] = [];

    for (let i = 0; i < potentialKeys.length; i++) {
      let key = potentialKeys[i];

      if (isPrefix(key, primaryKey)) continue;

      // Keep single-column indexes regardless of being a prefix
      if (key.length === 1) {
        filteredKeys.push(key);
        continue;
      }

      // Skip if the key is a prefix of a later key in the list
      let isRedundant = potentialKeys.some((otherKey, j) => j > i && isPrefix(key, otherKey));

      if (!isRedundant) {
        filteredKeys.push(key);
      }
    }

    return filteredKeys;
  }

  /**
   * Adds an event listener for a specific event
   * @param name The name of the event to listen for
   * @param fn The callback function to execute when the event occurs
   */
  on<Event extends TabularEventName>(
    name: Event,
    fn: TabularEventListener<Event, PrimaryKey, Entity>
  ) {
    this.events.on(name, fn);
  }

  /**
   * Removes an event listener for a specific event
   * @param name The name of the event to remove the listener from
   * @param fn The callback function to remove
   */
  off<Event extends TabularEventName>(
    name: Event,
    fn: TabularEventListener<Event, PrimaryKey, Entity>
  ) {
    this.events.off(name, fn);
  }

  /**
   * Adds an event listener that will only be called once
   * @param name The name of the event to listen for
   * @param fn The callback function to execute when the event occurs
   */
  once<Event extends TabularEventName>(
    name: Event,
    fn: TabularEventListener<Event, PrimaryKey, Entity>
  ) {
    this.events.once(name, fn);
  }

  /**
   * Emits an event with the specified name and arguments
   * @param name The name of the event to emit
   * @param args The arguments to pass to the event listeners
   */
  emit<Event extends TabularEventName>(
    name: Event,
    ...args: TabularEventParameters<Event, PrimaryKey, Entity>
  ) {
    this.events.emit(name, ...args);
  }

  /**
   * Returns when the event was emitted (promise form of once)
   * @param name The name of the event to check
   * @returns true if the event has listeners, false otherwise
   */
  waitOn<Event extends TabularEventName>(
    name: Event
  ): Promise<TabularEventParameters<Event, PrimaryKey, Entity>> {
    return this.events.waitOn(name) as Promise<TabularEventParameters<Event, PrimaryKey, Entity>>;
  }

  /**
   * Core abstract methods that must be implemented by concrete repositories
   */
  abstract put(value: Entity): Promise<void>;
  abstract get(key: PrimaryKey): Promise<Entity | undefined>;
  abstract delete(key: PrimaryKey | Entity): Promise<void>;
  abstract getAll(): Promise<Entity[] | undefined>;
  abstract deleteAll(): Promise<void>;
  abstract size(): Promise<number>;
  abstract deleteSearch(
    column: keyof Entity,
    value: Entity[keyof Entity],
    operator: "=" | "<" | "<=" | ">" | ">="
  ): Promise<void>;

  /**
   * Abstract method to be implemented by concrete repositories to search for rows
   * based on a partial key.
   *
   * @param key - Partial key to search for
   * @returns Promise resolving to an array of combined row objects or undefined if not found
   */
  public abstract search(key: Partial<Entity>): Promise<Entity[] | undefined>;

  protected primaryKeyColumns(): Array<keyof PrimaryKey> {
    const columns: Array<keyof PrimaryKey> = [];
    for (const key of Object.keys(this.primaryKeySchema.properties)) {
      columns.push(key as keyof PrimaryKey);
    }
    return columns;
  }

  protected valueColumns(): Array<keyof Value> {
    const columns: Array<keyof Value> = [];
    for (const key of Object.keys(this.valueSchema.properties)) {
      columns.push(key as keyof Value);
    }
    return columns;
  }

  /**
   * Utility method to separate a combined object into its key and value components
   * for storage.
   * @param obj - Entity row object
   * @returns Separated key and value objects
   */
  protected separateKeyValueFromCombined(obj: Entity): { value: Value; key: PrimaryKey } {
    if (obj === null) {
      console.warn("Key is null");
      return { value: {} as Value, key: {} as PrimaryKey };
    }
    if (typeof obj !== "object") {
      console.warn("Object is not an object");
      return { value: {} as Value, key: {} as PrimaryKey };
    }
    const primaryKeyNames = this.primaryKeyColumns();
    const valueNames = this.valueColumns();
    const value: Partial<Value> = {};
    const key: Partial<PrimaryKey> = {};
    for (const k of primaryKeyNames) {
      key[k as keyof PrimaryKey] = obj[k as unknown as keyof Entity] as any;
    }
    for (const k of valueNames) {
      value[k as keyof Value] = obj[k as unknown as keyof Entity] as any;
    }

    return { value: value as Value, key: key as PrimaryKey };
  }

  /**
   * Generates a consistent string identifier for a given key.
   *
   * @param key - Primary key to convert
   * @returns Promise resolving to a string fingerprint of the key
   */
  protected async getKeyAsIdString(key: PrimaryKey): Promise<string> {
    return await makeFingerprint(key);
  }

  /**
   * Converts a primary key object into an ordered array based on the schema
   * This ensures consistent parameter ordering for storage operations
   * @param key - The primary key object to convert
   * @returns Array of key values ordered according to the schema
   */
  protected getPrimaryKeyAsOrderedArray(key: PrimaryKey): ValueOptionType[] {
    const orderedParams: ValueOptionType[] = [];
    const keyObj = key as Record<string, ValueOptionType>;
    for (const k in this.primaryKeySchema.properties) {
      if (k in keyObj) {
        orderedParams.push(keyObj[k]);
      } else {
        throw new Error(`Missing required primary key field: ${k}`);
      }
    }
    return orderedParams;
  }

  /**
   * Finds the best matching index for a set of search keys.
   * @param unorderedSearchKey - Unordered array of keys being searched, can be reordered
   * @returns Array of column names representing the best matching index, or undefined if no suitable index is found
   */
  public findBestMatchingIndex(
    unorderedSearchKey: Array<keyof Entity>
  ): Array<keyof Entity> | undefined {
    if (!unorderedSearchKey.length) return undefined;

    const allKeys: Array<keyof Entity>[] = [
      this.primaryKeyColumns() as unknown as Array<keyof Entity>,
      ...(this.indexes as Array<keyof Entity>[]),
    ];

    const searchKeySet = new Set(unorderedSearchKey);

    const hasMatchingPrefix = (index: Array<keyof Entity>): boolean => {
      // Check if the first column of the index is in our search keys
      return index.length > 0 && searchKeySet.has(index[0]);
    };

    let bestMatch: Array<keyof Entity> | undefined;
    let bestMatchScore = 0;

    for (const index of allKeys) {
      if (hasMatchingPrefix(index)) {
        // Calculate how many consecutive search keys we can use from this index
        let score = 0;
        for (const col of index) {
          if (!searchKeySet.has(col)) break;
          score++;
        }

        if (score > bestMatchScore) {
          bestMatch = index;
          bestMatchScore = score;
        }
      }
    }

    return bestMatch;
  }
}
