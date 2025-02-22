//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter } from "@ellmers/util";
import { makeFingerprint } from "@ellmers/util";
import {
  TabularEventName,
  TabularEventListener,
  TabularEventListeners,
  TabularEventParameters,
  ITabularRepository,
  BasePrimaryKeySchema,
  BaseValueSchema,
  BasicKeyType,
  BasicValueType,
  DefaultPrimaryKeyType,
  DefaultValueType,
  DefaultPrimaryKeySchema,
  DefaultValueSchema,
} from "./ITabularRepository";

/**
 * Abstract base class for tabular storage repositories.
 * Provides functionality for storing and retrieving data with typed
 * primary keys and values, and supports compound keys and partial key lookup.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key object
 * @template Value - The type of the value object being stored
 * @template PrimaryKeySchema - Schema definition for the primary key
 * @template ValueSchema - Schema definition for the value
 * @template Combined - Combined type of Key & Value
 */
export abstract class TabularRepository<
  Key extends Record<string, BasicKeyType> = DefaultPrimaryKeyType,
  Value extends Record<string, any> = DefaultValueType,
  PrimaryKeySchema extends BasePrimaryKeySchema = typeof DefaultPrimaryKeySchema,
  ValueSchema extends BaseValueSchema = typeof DefaultValueSchema,
  Combined extends Record<string, any> = Key & Value,
> implements ITabularRepository<Key, Value, Combined>
{
  /** Event emitter for repository events */
  protected events = new EventEmitter<TabularEventListeners<Key, Value, Combined>>();

  /**
   * Indexes for primary key and value columns which are _only_ populated if the
   * key or value schema has a single field.
   */
  protected primaryKeyIndex: string | undefined = undefined;
  protected valueIndex: string | undefined = undefined;
  protected searchable: Array<Array<keyof Combined>>;
  /**
   * Creates a new TabularRepository instance
   * @param primaryKeySchema - Schema defining the structure of primary keys
   * @param valueSchema - Schema defining the structure of values
   * @param searchable - Array of columns or column arrays to make searchable. Each string or single column creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    protected primaryKeySchema: PrimaryKeySchema = DefaultPrimaryKeySchema as PrimaryKeySchema,
    protected valueSchema: ValueSchema = DefaultValueSchema as ValueSchema,
    searchableInput: Array<keyof Combined | Array<keyof Combined>> = []
  ) {
    this.primaryKeySchema = primaryKeySchema;
    this.valueSchema = valueSchema;
    if (this.primaryKeyColumns().length === 1) {
      this.primaryKeyIndex = this.primaryKeyColumns()[0] as string;
    }
    if (this.valueColumns().length === 1) {
      this.valueIndex = this.valueColumns()[0] as string;
    }

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
    this.searchable = searchableInput.map((spec) => (Array.isArray(spec) ? spec : [spec])) as Array<
      Array<keyof Combined>
    >;

    // searchable is an arrya of compound keys, which are arrays of columns
    // clean up searchable array by removing any compoundkeys that are a prefix of another compoundkey
    // or a prefix of the primary key
    this.searchable = this.filterCompoundKeys(
      this.primaryKeyColumns() as Array<keyof Combined>,
      this.searchable
    );

    // Validate searchable columns
    for (const compoundIndex of this.searchable) {
      for (const column of compoundIndex) {
        if (!(column in this.primaryKeySchema) && !(column in this.valueSchema)) {
          throw new Error(
            `Searchable column ${String(column)} is not in the primary key schema or value schema`
          );
        }
      }
    }
  }

  protected filterCompoundKeys(
    primaryKey: Array<keyof Combined>,
    potentialKeys: Array<keyof Combined>[]
  ): Array<keyof Combined>[] {
    // Function to check if one array is a prefix of another
    const isPrefix = (prefix: Array<keyof Combined>, arr: Array<keyof Combined>): boolean => {
      if (prefix.length > arr.length) return false;
      return prefix.every((val, index) => val === arr[index]);
    };

    // Sort potential keys by length
    potentialKeys.sort((a, b) => a.length - b.length);

    let filteredKeys: Array<keyof Combined>[] = [];

    for (let i = 0; i < potentialKeys.length; i++) {
      let key = potentialKeys[i];

      // Skip if the key is a prefix of the primary key
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
    fn: TabularEventListener<Event, Key, Value, Combined>
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
    fn: TabularEventListener<Event, Key, Value, Combined>
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
    fn: TabularEventListener<Event, Key, Value, Combined>
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
    ...args: TabularEventParameters<Event, Key, Value, Combined>
  ) {
    this.events.emit(name, ...args);
  }

  /**
   * Returns when the event was emitted (promise form of once)
   * @param name The name of the event to check
   * @returns true if the event has listeners, false otherwise
   */
  emitted<Event extends TabularEventName>(
    name: Event
  ): Promise<TabularEventParameters<Event, Key, Value, Combined>> {
    return this.events.emitted(name) as Promise<
      TabularEventParameters<Event, Key, Value, Combined>
    >;
  }

  /**
   * Core abstract methods that must be implemented by concrete repositories
   */
  abstract putKeyValue(key: Key, value: Value): Promise<void>;
  abstract getKeyValue(key: Key): Promise<Value | undefined>;
  abstract deleteKeyValue(key: Key | Combined): Promise<void>;
  abstract getAll(): Promise<Combined[] | undefined>;
  abstract deleteAll(): Promise<void>;
  abstract size(): Promise<number>;

  /**
   * Abstract method to be implemented by concrete repositories to search for rows
   * based on a partial key.
   *
   * @param key - Partial key to search for
   * @returns Promise resolving to an array of combined row objects or undefined if not found
   */
  public abstract search(key: Partial<Combined>): Promise<Combined[] | undefined>;

  /**
   * Retrieves both key and value as a combined object.
   * @param key - The primary key to look up
   * @returns Combined row object or undefined if not found
   */
  public async getCombined(key: Key): Promise<Combined | undefined> {
    const value = await this.getKeyValue(key);
    if (typeof value !== "object") return undefined;
    return Object.assign({}, key, value) as Combined;
  }

  /**
   * Deletes a row from the repository.
   * @param key - The primary key of the row to delete
   */
  public delete(key: Key | BasicKeyType): Promise<void> {
    if (typeof key !== "object" && this.primaryKeyIndex) {
      key = { [this.primaryKeyIndex]: key } as Key;
    }
    return this.deleteKeyValue(key as Key);
  }

  protected primaryKeyColumns(): Array<keyof Key> {
    const columns: Array<keyof Key> = [];
    for (const [k, type] of Object.entries(this.primaryKeySchema)) {
      columns.push(k as keyof Key);
    }
    return columns;
  }

  protected valueColumns(): Array<keyof Value> {
    const columns: Array<keyof Value> = [];
    for (const [k, type] of Object.entries(this.valueSchema)) {
      columns.push(k as keyof Value);
    }
    return columns;
  }

  /**
   * Utility method to separate a combined object into its key and value components
   * for storage.
   * @param obj - Combined row object
   * @returns Separated key and value objects
   */
  protected separateKeyValueFromCombined(obj: Combined): { value: Value; key: Key } {
    if (obj === null) {
      console.warn("Key is null");
      return { value: {} as Value, key: {} as Key };
    }
    if (typeof obj !== "object") {
      console.warn("Object is not an object");
      return { value: {} as Value, key: {} as Key };
    }
    const primaryKeyNames = this.primaryKeyColumns();
    const valueNames = this.valueColumns();
    const value: Partial<Value> = {};
    const key: Partial<Key> = {};
    for (const k of primaryKeyNames) {
      key[k] = obj[k as keyof Combined];
    }
    for (const k of valueNames) {
      value[k] = obj[k as keyof Combined];
    }

    return { value: value as Value, key: key as Key };
  }

  /**
   * Generates a consistent string identifier for a given key.
   *
   * @param key - Primary key to convert
   * @returns Promise resolving to a string fingerprint of the key
   */
  protected async getKeyAsIdString(key: Key | BasicKeyType): Promise<string> {
    if (this.primaryKeyIndex && typeof key === "object") {
      key = key[this.primaryKeyIndex];
    }
    return await makeFingerprint(key);
  }

  /**
   * Converts a primary key object into an ordered array based on the schema
   * This ensures consistent parameter ordering for storage operations
   * @param key - The primary key object to convert
   * @returns Array of key values ordered according to the schema
   */
  protected getPrimaryKeyAsOrderedArray(key: Key): BasicKeyType[] {
    const orderedParams: BasicKeyType[] = [];
    for (const [k, type] of Object.entries(this.primaryKeySchema)) {
      if (k in key) {
        orderedParams.push(key[k]);
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
    unorderedSearchKey: Array<keyof Combined>
  ): Array<keyof Combined> | undefined {
    if (!unorderedSearchKey.length) return undefined;

    // Combine all possible indexes: primary key + searchable indexes
    const allKeys: Array<keyof Combined>[] = [
      this.primaryKeyColumns() as Array<keyof Combined>,
      ...(this.searchable as Array<keyof Combined>[]),
    ];

    // Convert search keys to a Set for efficient lookup
    const searchKeySet = new Set(unorderedSearchKey);

    // Helper function to check if any search key matches the start of the index
    const hasMatchingPrefix = (index: Array<keyof Combined>): boolean => {
      // Check if the first column of the index is in our search keys
      return index.length > 0 && searchKeySet.has(index[0]);
    };

    let bestMatch: Array<keyof Combined> | undefined;
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
