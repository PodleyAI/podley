//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ensureIndexedDbTable, ExpectedIndexDefinition } from "../util/IndexedDbTable";
import {
  BaseValueSchema,
  BasePrimaryKeySchema,
  BasicKeyType,
  DefaultValueType,
  DefaultValueSchema,
  DefaultPrimaryKeyType,
  DefaultPrimaryKeySchema,
} from "./IKVRepository";
import { KVRepository } from "./KVRepository";
/**
 * A key-value repository implementation using IndexedDB for browser-based storage.
 *
 * @template Key - The type of the primary key object
 * @template Value - The type of the value object to be stored
 * @template PrimaryKeySchema - Schema definition for the primary key
 * @template ValueSchema - Schema definition for the value
 * @template Combined - Combined type of Key & Value
 */
export class IndexedDbKVRepository<
  Key extends Record<string, BasicKeyType> = DefaultPrimaryKeyType,
  Value extends Record<string, any> = DefaultValueType,
  PrimaryKeySchema extends BasePrimaryKeySchema = typeof DefaultPrimaryKeySchema,
  ValueSchema extends BaseValueSchema = typeof DefaultValueSchema,
  Combined extends Record<string, any> = Key & Value,
> extends KVRepository<Key, Value, PrimaryKeySchema, ValueSchema, Combined> {
  /** Promise that resolves to the IndexedDB database instance */
  private dbPromise: Promise<IDBDatabase> | undefined;

  /**
   * Creates a new IndexedDB-based key-value repository.
   * @param table - Name of the IndexedDB store to use.
   * @param primaryKeySchema - Schema defining the structure of primary keys.
   * @param valueSchema - Schema defining the structure of values.
   * @param searchable - Array of columns or column arrays to make searchable. Each string creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    public table: string = "kv_store",
    primaryKeySchema: PrimaryKeySchema = DefaultPrimaryKeySchema as PrimaryKeySchema,
    valueSchema: ValueSchema = DefaultValueSchema as ValueSchema,
    searchable: Array<keyof Combined | Array<keyof Combined>> = []
  ) {
    super(primaryKeySchema, valueSchema, searchable as Array<keyof Combined>);
    const pkColumns = super.primaryKeyColumns() as string[];

    // Create index definitions for both single and compound indexes
    const expectedIndexes: ExpectedIndexDefinition[] = [];

    for (const spec of this.searchable) {
      if (Array.isArray(spec)) {
        // Handle compound index
        const columns = spec as Array<keyof Combined>;
        // Skip if this is just the primary key or a prefix of it
        if (columns.length <= pkColumns.length) {
          const isPkPrefix = columns.every((col, idx) => col === pkColumns[idx]);
          if (isPkPrefix) continue;
        }

        // Create compound index name and keyPath
        const indexName = columns.join("_");
        expectedIndexes.push({
          name: indexName,
          keyPath: columns.map((col) => String(col)),
          options: { unique: false },
        });
      } else {
        // Handle single column index
        const field = spec as keyof Combined;
        if (!pkColumns.includes(String(field))) {
          expectedIndexes.push({
            name: String(field),
            keyPath: String(field),
            options: { unique: false },
          });
        }
      }
    }

    const primaryKey = pkColumns.length === 1 ? pkColumns[0] : pkColumns;

    // Ensure that our table is created/upgraded only if the structure (indexes) has changed.
    this.dbPromise = ensureIndexedDbTable(this.table, primaryKey, expectedIndexes);
  }

  /**
   * Stores a key-value pair in the repository.
   * @param key - The key object.
   * @param value - The value object to store.
   * @emits put - Emitted when the value is successfully stored
   */
  async putKeyValue(key: Key, value: Value): Promise<void> {
    if (!this.dbPromise) throw new Error("Database not initialized");
    const db = await this.dbPromise;
    // Merge key and value, ensuring all fields are at the root level for indexing
    const record = { ...key, ...value };
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readwrite");
      const store = transaction.objectStore(this.table);
      const request = store.put(record);
      request.onerror = () => {
        reject(request.error);
      };
      request.onsuccess = () => {
        this.events.emit("put", key, value);
        resolve();
      };
    });
  }

  protected getPrimaryKeyAsOrderedArray(key: Key) {
    return super
      .getPrimaryKeyAsOrderedArray(key)
      .map((value) => (typeof value === "bigint" ? value.toString() : value));
  }

  private getIndexedKey(key: Key): any {
    const keys = super
      .getPrimaryKeyAsOrderedArray(key)
      .map((value) => (typeof value === "bigint" ? value.toString() : value));
    return keys.length === 1 ? keys[0] : keys;
  }

  /**
   * Retrieves a value from the repository by its key.
   * @param key - The key object.
   * @returns The value object or undefined if not found.
   * @emits get - Emitted when the value is successfully retrieved
   */
  async getKeyValue(key: Key): Promise<Value | undefined> {
    if (!this.dbPromise) throw new Error("Database not initialized");
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readonly");
      const store = transaction.objectStore(this.table);
      const request = store.get(this.getIndexedKey(key));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (!request.result) {
          this.events.emit("get", key, undefined);
          resolve(undefined);
          return;
        }
        const { value } = this.separateKeyValueFromCombined(request.result);
        this.events.emit("get", key, value);
        resolve(value);
      };
    });
  }

  /**
   * Returns an array of all entries in the repository.
   * @returns Array of all entries in the repository.
   */
  async getAll(): Promise<Combined[] | undefined> {
    if (!this.dbPromise) throw new Error("Database not initialized");
    const db = await this.dbPromise;
    const transaction = db.transaction(this.table, "readonly");
    const store = transaction.objectStore(this.table);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const values = request.result;
        resolve(values.length > 0 ? values : undefined);
      };
    });
  }

  /**
   * Searches for records matching the specified partial query.
   * It uses an appropriate index if one exists, or scans all records.
   * @param key - Partial query object.
   * @returns Array of matching records or undefined.
   */
  async search(key: Partial<Combined>): Promise<Combined[] | undefined> {
    if (!this.dbPromise) throw new Error("Database not initialized");
    const searchKeys = Object.keys(key);
    if (searchKeys.length === 0) {
      return undefined;
    }

    // Find the best matching index for the search
    const bestIndex = this.findBestMatchingIndex(searchKeys);
    if (!bestIndex) {
      throw new Error("No suitable index found for the search criteria");
    }

    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readonly");
      const store = transaction.objectStore(this.table);

      // For compound indexes, the index name is the columns joined by underscore
      const indexName = Array.isArray(bestIndex) ? bestIndex.join("_") : String(bestIndex);
      const index = store.index(indexName);

      // Get the values for the index columns
      const indexCols = Array.isArray(bestIndex) ? bestIndex : [bestIndex];
      const indexValues: IDBValidKey[] = [];

      // Validate and collect all required index values
      for (const col of indexCols) {
        const val = key[col];
        if (val === undefined || (typeof val !== "string" && typeof val !== "number")) {
          throw new Error(`Missing or invalid value for indexed column: ${String(col)}`);
        }
        indexValues.push(val);
      }

      // Use the index with the collected values
      const request = index.getAll(indexValues.length === 1 ? indexValues[0] : indexValues);

      request.onsuccess = () => {
        // Filter results for any additional search keys
        const results = request.result.filter((item) =>
          Object.entries(key).every(([k, v]) => item[k] === v)
        );
        resolve(results.length > 0 ? results : undefined);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes a key-value pair from the repository.
   * @param key - The key object to delete.
   */
  async deleteKeyValue(key: Key): Promise<void> {
    if (!this.dbPromise) throw new Error("Database not initialized");
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readwrite");
      const store = transaction.objectStore(this.table);
      const request = store.delete(this.getIndexedKey(key));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.events.emit("delete", key);
        resolve();
      };
    });
  }

  /**
   * Deletes all records from the repository.
   * @emits clearall - Emitted when all values are deleted
   */
  async deleteAll(): Promise<void> {
    if (!this.dbPromise) throw new Error("Database not initialized");
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readwrite");
      const store = transaction.objectStore(this.table);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.events.emit("clearall");
        resolve();
      };
    });
  }

  /**
   * Returns the total number of key-value pairs in the repository.
   * @returns Count of stored items.
   */
  async size(): Promise<number> {
    if (!this.dbPromise) throw new Error("Database not initialized");
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readonly");
      const store = transaction.objectStore(this.table);
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}
