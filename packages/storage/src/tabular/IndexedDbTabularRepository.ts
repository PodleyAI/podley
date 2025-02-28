//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ensureIndexedDbTable, ExpectedIndexDefinition } from "../util/IndexedDbTable";
import { BaseValueSchema, BasePrimaryKeySchema, BasicKeyType } from "./ITabularRepository";
import { TabularRepository } from "./TabularRepository";
/**
 * A tabular repository implementation using IndexedDB for browser-based storage.
 *
 * @template Key - The type of the primary key object
 * @template Value - The type of the value object to be stored
 * @template PrimaryKeySchema - Schema definition for the primary key
 * @template ValueSchema - Schema definition for the value
 * @template Combined - Combined type of Key & Value
 */
export class IndexedDbTabularRepository<
  Key extends Record<string, BasicKeyType>,
  Value extends Record<string, any>,
  PrimaryKeySchema extends BasePrimaryKeySchema,
  ValueSchema extends BaseValueSchema,
  Combined extends Record<string, any> = Key & Value,
> extends TabularRepository<Key, Value, PrimaryKeySchema, ValueSchema, Combined> {
  /** Promise that resolves to the IndexedDB database instance */
  private dbPromise: Promise<IDBDatabase> | undefined;

  /**
   * Creates a new IndexedDB-based tabular repository.
   * @param table - Name of the IndexedDB store to use.
   * @param primaryKeySchema - Schema defining the structure of primary keys.
   * @param valueSchema - Schema defining the structure of values.
   * @param searchable - Array of columns or column arrays to make searchable. Each string creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    public table: string = "tabular_store",
    primaryKeySchema: PrimaryKeySchema,
    valueSchema: ValueSchema,
    searchableIndex: Array<keyof Combined | Array<keyof Combined>> = []
  ) {
    super(primaryKeySchema, valueSchema, searchableIndex as Array<keyof Combined>);
    const pkColumns = super.primaryKeyColumns() as string[];

    // Create index definitions for both single and compound indexes
    const expectedIndexes: ExpectedIndexDefinition[] = [];

    for (const spec of this.searchable) {
      // Handle compound index
      const columns = spec as Array<keyof Combined>;
      // Skip if this is just the primary key or a prefix of it
      if (columns.length <= pkColumns.length) {
        const isPkPrefix = columns.every((col, idx) => col === pkColumns[idx]);
        if (isPkPrefix) continue;
      }

      // Create compound index name and keyPath
      const columnNames = columns.map((col) => String(col));
      const indexName = columnNames.join("_");
      expectedIndexes.push({
        name: indexName,
        keyPath: columnNames.length === 1 ? columnNames[0] : columnNames,
        options: { unique: false },
      });
    }

    const primaryKey = pkColumns.length === 1 ? pkColumns[0] : pkColumns;

    // Ensure that our table is created/upgraded only if the structure (indexes) has changed.
    this.dbPromise = ensureIndexedDbTable(this.table, primaryKey, expectedIndexes);
  }

  /**
   * Stores a row in the repository.
   * @param key - The key object.
   * @param value - The value object to store.
   * @emits put - Emitted when the value is successfully stored
   */
  async put(record: Combined): Promise<void> {
    const { key } = this.separateKeyValueFromCombined(record);
    if (!this.dbPromise) throw new Error("Database not initialized");
    const db = await this.dbPromise;
    // Merge key and value, ensuring all fields are at the root level for indexing
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readwrite");
      const store = transaction.objectStore(this.table);
      const request = store.put(record);
      request.onerror = () => {
        reject(request.error);
      };
      request.onsuccess = () => {
        this.events.emit("put", record);
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
  async get(key: Key): Promise<Combined | undefined> {
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
        this.events.emit("get", key, request.result);
        resolve(request.result);
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
      const indexName = bestIndex.join("_");
      const primaryKeyName = this.primaryKeyColumns().join("_");
      const isPrimaryKey = indexName === primaryKeyName;

      // Get the values for the index columns that we have
      const indexValues: IDBValidKey[] = [];

      // Collect values for consecutive columns from the start of the index
      for (const col of bestIndex) {
        const val = key[col];
        // Break on first undefined value for compound index
        if (val === undefined) break;
        if (typeof val !== "string" && typeof val !== "number") {
          throw new Error(`Invalid value type for indexed column ${String(col)}`);
        }
        indexValues.push(val);
      }

      // If we have at least one valid index value, use it
      let request: IDBRequest;
      if (indexValues.length > 0) {
        if (isPrimaryKey && indexValues.length < bestIndex.length) {
          // For primary key prefix search, use IDBKeyRange
          const keyRange = IDBKeyRange.bound(
            indexValues,
            indexValues.concat(["\uffff"]), // Use high value for upper bound
            true, // Include lower bound
            true // Include upper bound
          );
          request = store.getAll(keyRange);
        } else {
          // For regular indexes or exact primary key match
          const index = isPrimaryKey ? store : store.index(indexName);
          request = index.getAll(indexValues.length === 1 ? indexValues[0] : indexValues);
        }
      } else {
        throw new Error(`No valid values provided for indexed columns: ${bestIndex.join(", ")}`);
      }

      request.onsuccess = () => {
        // Filter results for any additional search keys
        const results = request.result.filter((item: Combined) =>
          Object.entries(key).every(([k, v]) => item[k] === v)
        );
        resolve(results.length > 0 ? results : undefined);
      };

      request.onerror = () => {
        console.error("Search error:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Deletes a row from the repository.
   * @param key - The key object to delete.
   */
  async delete(key: Key): Promise<void> {
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
   * Returns the total number of rows in the repository.
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
