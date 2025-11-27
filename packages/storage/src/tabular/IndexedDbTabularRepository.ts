/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, DataPortSchemaObject, FromSchema } from "@workglow/util";
import {
    ensureIndexedDbTable,
    ExpectedIndexDefinition,
    MigrationOptions,
} from "../util/IndexedDbTable";
import { ITabularRepository } from "./ITabularRepository";
import { TabularRepository } from "./TabularRepository";

export const IDB_TABULAR_REPOSITORY = createServiceToken<
  ITabularRepository<any, any, any, any, any>
>("storage.tabularRepository.indexedDb");

/**
 * A tabular repository implementation using IndexedDB for browser-based storage.
 *
 * @template Schema - The schema definition for the entity
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export class IndexedDbTabularRepository<
  Schema extends DataPortSchemaObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Schema["properties"]>,
  // computed types
  Entity = FromSchema<Schema>,
  PrimaryKey = Pick<Entity, PrimaryKeyNames[number] & keyof Entity>,
  Value = Omit<Entity, PrimaryKeyNames[number] & keyof Entity>,
> extends TabularRepository<Schema, PrimaryKeyNames, Entity, PrimaryKey, Value> {
  /** Promise that resolves to the IndexedDB database instance */
  private db: IDBDatabase | undefined;
  /** Migration options for database schema changes */
  private migrationOptions: MigrationOptions;

  /**
   * Creates a new IndexedDB-based tabular repository.
   * @param table - Name of the IndexedDB store to use.
   * @param schema - Schema defining the structure of the entity
   * @param primaryKeyNames - Array of property names that form the primary key
   * @param indexes - Array of columns or column arrays to make searchable. Each string or single column creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   * @param migrationOptions - Options for handling database schema migrations
   */
  constructor(
    public table: string = "tabular_store",
    schema: Schema,
    primaryKeyNames: PrimaryKeyNames,
    indexes: Array<keyof Entity | Array<keyof Entity>> = [],
    migrationOptions: MigrationOptions = {}
  ) {
    super(schema, primaryKeyNames, indexes);
    this.migrationOptions = migrationOptions;
  }

  /**
   * Sets up the IndexedDB database table with the required schema and indexes.
   * Must be called before using any other methods.
   */
  public async setupDatabase(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    const pkColumns = super.primaryKeyColumns() as string[];

    // Create index definitions for both single and compound indexes
    const expectedIndexes: ExpectedIndexDefinition[] = [];

    for (const spec of this.indexes) {
      // Handle compound index
      const columns = spec as Array<keyof Entity>;
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
    this.db = await ensureIndexedDbTable(
      this.table,
      primaryKey,
      expectedIndexes,
      this.migrationOptions
    );
    return this.db;
  }

  /**
   * Stores a row in the repository.
   * @param record - The entity to store.
   * @returns The stored entity
   * @emits put - Emitted when the value is successfully stored
   */
  async put(record: Entity): Promise<Entity> {
    const db = await this.setupDatabase();
    const { key } = this.separateKeyValueFromCombined(record);
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
        resolve(record);
      };
    });
  }

  /**
   * Stores multiple rows in the repository in a bulk operation.
   * @param records - Array of entities to store.
   * @returns Array of stored entities
   * @emits put - Emitted for each record successfully stored
   */
  async putBulk(records: Entity[]): Promise<Entity[]> {
    const db = await this.setupDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readwrite");
      const store = transaction.objectStore(this.table);

      let completed = 0;
      let hasError = false;

      transaction.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(transaction.error);
        }
      };

      transaction.oncomplete = () => {
        if (!hasError) {
          resolve(records);
        }
      };

      // Add all records to the transaction
      for (const record of records) {
        const request = store.put(record);
        request.onsuccess = () => {
          this.events.emit("put", record);
          completed++;
        };
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      }
    });
  }

  protected getPrimaryKeyAsOrderedArray(key: PrimaryKey) {
    return super
      .getPrimaryKeyAsOrderedArray(key)
      .map((value) => (typeof value === "bigint" ? value.toString() : value));
  }

  private getIndexedKey(key: PrimaryKey): any {
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
  async get(key: PrimaryKey): Promise<Entity | undefined> {
    const db = await this.setupDatabase();
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
  async getAll(): Promise<Entity[] | undefined> {
    const db = await this.setupDatabase();
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
  async search(key: Partial<Entity>): Promise<Entity[] | undefined> {
    const db = await this.setupDatabase();
    const searchKeys = Object.keys(key) as Array<keyof Entity>;
    if (searchKeys.length === 0) {
      return undefined;
    }

    // Find the best matching index for the search
    const bestIndex = this.findBestMatchingIndex(searchKeys);
    if (!bestIndex) {
      throw new Error("No suitable index found for the search criteria");
    }

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
      if (indexValues.length > 0) {
        const index = isPrimaryKey ? store : store.index(indexName);
        const isPartialMatch = indexValues.length < bestIndex.length;

        if (isPartialMatch) {
          // For partial matches on compound indexes, we need to handle two cases:
          // 1. If all columns in the compound index are required in the schema,
          //    we can use cursor-based prefix matching (efficient)
          // 2. If any columns are optional (could be undefined), records without those
          //    values won't be in the index, so we must do a full scan

          // Check if all columns in the compound index are required
          const allColumnsRequired = bestIndex.every((col) => {
            const colName = String(col);
            return this.schema.required?.includes(colName);
          });

          if (allColumnsRequired) {
            // All index columns are required, so all records will be in the index
            // We can use cursor-based prefix matching for better performance
            const results: Entity[] = [];
            const keyRange = IDBKeyRange.lowerBound(indexValues);
            const cursorRequest = index.openCursor(keyRange);

            cursorRequest.onsuccess = () => {
              const cursor = cursorRequest.result;
              if (cursor) {
                const item = cursor.value as Entity;
                const cursorKey = Array.isArray(cursor.key) ? cursor.key : [cursor.key];

                // Check if cursor key still matches our prefix
                const prefixMatches = indexValues.every((val, idx) => cursorKey[idx] === val);

                if (!prefixMatches) {
                  // Moved past our prefix range
                  resolve(results.length > 0 ? results : undefined);
                  return;
                }

                // Check all search criteria (including non-indexed columns)
                // @ts-ignore
                const matches = Object.entries(key).every(([k, v]) => item[k] === v);
                if (matches) {
                  results.push(item);
                }
                cursor.continue();
              } else {
                // Cursor exhausted
                resolve(results.length > 0 ? results : undefined);
              }
            };

            cursorRequest.onerror = () => {
              reject(cursorRequest.error);
            };
          } else {
            // Some index columns are optional, records with undefined values won't be indexed
            // Fall back to full scan to ensure we don't miss any matching records
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
              const allRecords: Entity[] = getAllRequest.result;
              const results = allRecords.filter((item) =>
                // @ts-ignore
                Object.entries(key).every(([k, v]) => item[k] === v)
              );
              resolve(results.length > 0 ? results : undefined);
            };

            getAllRequest.onerror = () => {
              reject(getAllRequest.error);
            };
          }
        } else {
          // Exact match: use getAll with the exact key
          const request = index.getAll(indexValues.length === 1 ? indexValues[0] : indexValues);

          request.onsuccess = () => {
            // Filter results for any additional search keys
            const results = request.result.filter((item: Entity) =>
              // @ts-ignore
              Object.entries(key).every(([k, v]) => item[k] === v)
            );
            resolve(results.length > 0 ? results : undefined);
          };

          request.onerror = () => {
            console.error("Search error:", request.error);
            reject(request.error);
          };
        }
      } else {
        throw new Error(`No valid values provided for indexed columns: ${bestIndex.join(", ")}`);
      }
    });
  }

  /**
   * Deletes a row from the repository.
   * @param key - The key object to delete.
   */
  async delete(key: PrimaryKey): Promise<void> {
    const db = await this.setupDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readwrite");
      const store = transaction.objectStore(this.table);
      const request = store.delete(this.getIndexedKey(key));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.events.emit("delete", key as keyof Entity);
        resolve();
      };
    });
  }

  /**
   * Deletes all records from the repository.
   * @emits clearall - Emitted when all values are deleted
   */
  async deleteAll(): Promise<void> {
    const db = await this.setupDatabase();
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
    const db = await this.setupDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.table, "readonly");
      const store = transaction.objectStore(this.table);
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
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
    const db = await this.setupDatabase();

    return new Promise(async (resolve, reject) => {
      try {
        // For equality operator, we can use the search method directly
        if (operator === "=") {
          // Create a search key based on the column and value
          const searchKey: Partial<Entity> = { [column]: value } as Partial<Entity>;

          // Search for records to delete
          const recordsToDelete = await this.search(searchKey);

          if (!recordsToDelete || recordsToDelete.length === 0) {
            // No records found to delete
            this.events.emit("delete", column);
            resolve();
            return;
          }

          const transaction = db.transaction(this.table, "readwrite");
          const store = transaction.objectStore(this.table);

          // Set up transaction event handlers
          transaction.oncomplete = () => {
            this.events.emit("delete", column);
            resolve();
          };

          transaction.onerror = () => {
            reject(transaction.error);
          };

          // Delete each record that matches the criteria
          for (const record of recordsToDelete) {
            // Extract the primary key from the record
            const primaryKey = this.primaryKeyColumns().reduce((key, column) => {
              // @ts-ignore - We know these properties exist on the record
              key[column] = record[column];
              return key;
            }, {} as PrimaryKey);

            // Delete the record using the primary key
            const request = store.delete(this.getIndexedKey(primaryKey));

            request.onerror = () => {
              console.error("Error deleting record:", request.error);
            };
          }
        } else {
          // For non-equality operators, we need to get all records and filter
          const transaction = db.transaction(this.table, "readwrite");
          const store = transaction.objectStore(this.table);

          // Set up transaction event handlers
          transaction.oncomplete = () => {
            this.events.emit("delete", column);
            resolve();
          };

          transaction.onerror = () => {
            reject(transaction.error);
          };

          // Get all records
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            const allRecords: Entity[] = getAllRequest.result;

            // Filter records based on the operator and value
            const recordsToDelete = allRecords.filter((record) => {
              const recordValue = record[column];

              // Skip null values or handle them based on business logic
              if (
                recordValue === null ||
                recordValue === undefined ||
                value === null ||
                value === undefined
              ) {
                return false;
              }

              switch (operator) {
                case "<":
                  return recordValue < value;
                case "<=":
                  return recordValue <= value;
                case ">":
                  return recordValue > value;
                case ">=":
                  return recordValue >= value;
                default:
                  return false;
              }
            });

            if (recordsToDelete.length === 0) {
              // No records to delete
              return;
            }

            // Delete each record that matches the criteria
            for (const record of recordsToDelete) {
              // Extract the primary key from the record
              const primaryKey = this.primaryKeyColumns().reduce((key, column) => {
                // @ts-ignore - We know these properties exist on the record
                key[column] = record[column];
                return key;
              }, {} as PrimaryKey);

              // Delete the record using the primary key
              const request = store.delete(this.getIndexedKey(primaryKey));

              request.onerror = () => {
                console.error("Error deleting record:", request.error);
              };
            }
          };

          getAllRequest.onerror = () => {
            reject(getAllRequest.error);
          };
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Destroys this repository and frees up resources.
   */
  destroy(): void {
    this.db?.close();
  }
}
