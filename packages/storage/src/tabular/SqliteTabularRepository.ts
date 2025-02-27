//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Database } from "bun:sqlite";
import {
  BaseValueSchema,
  BasicKeyType,
  BasePrimaryKeySchema,
  DefaultValueType,
  DefaultValueSchema,
  DefaultPrimaryKeyType,
  DefaultPrimaryKeySchema,
} from "./ITabularRepository";
import { BaseSqlTabularRepository } from "./BaseSqlTabularRepository";

// SqliteTabularRepository is a key-value store that uses SQLite as the backend for
// in app data.

/**
 * A SQLite-based key-value repository implementation.
 * @template Key - The type of the primary key object, must be a record of basic types
 * @template Value - The type of the value object being stored
 * @template PrimaryKeySchema - Schema definition for the primary key
 * @template ValueSchema - Schema definition for the value
 * @template Combined - Combined type of Key & Value
 */
export class SqliteTabularRepository<
  Key extends Record<string, BasicKeyType> = DefaultPrimaryKeyType,
  Value extends Record<string, any> = DefaultValueType,
  PrimaryKeySchema extends BasePrimaryKeySchema = typeof DefaultPrimaryKeySchema,
  ValueSchema extends BaseValueSchema = typeof DefaultValueSchema,
  Combined extends Record<string, any> = Key & Value,
> extends BaseSqlTabularRepository<Key, Value, PrimaryKeySchema, ValueSchema, Combined> {
  /** The SQLite database instance */
  private db: Database;

  /**
   * Creates a new SQLite key-value repository
   * @param dbOrPath - Either a Database instance or a path to the SQLite database file
   * @param table - The name of the table to use for storage (defaults to 'tabular_store')
   * @param primaryKeySchema - Schema defining the structure of the primary key
   * @param valueSchema - Schema defining the structure of the values
   * @param searchable - Array of columns or column arrays to make searchable. Each string creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    dbOrPath: string,
    table: string = "tabular_store",
    primaryKeySchema: PrimaryKeySchema = DefaultPrimaryKeySchema as PrimaryKeySchema,
    valueSchema: ValueSchema = DefaultValueSchema as ValueSchema,
    searchable: Array<keyof Combined | Array<keyof Combined>> = []
  ) {
    super(table, primaryKeySchema, valueSchema, searchable);
    if (typeof dbOrPath === "string") {
      this.db = new Database(dbOrPath);
    } else {
      this.db = dbOrPath;
    }
    this.setupDatabase();
  }

  /**
   * Creates the database table if it doesn't exist with the defined schema
   */
  public setupDatabase(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`${this.table}\` (
        ${this.constructPrimaryKeyColumns()},
        ${this.constructValueColumns()},
        PRIMARY KEY (${this.primaryKeyColumnList()}) 
      )
    `;
    this.db.exec(sql);

    // Get primary key columns to avoid creating redundant indexes
    const pkColumns = this.primaryKeyColumns();

    // Track created indexes to avoid duplicates and redundant indexes
    const createdIndexes = new Set<string>();

    for (const searchSpec of this.searchable) {
      // Handle both single column and compound indexes
      const columns = Array.isArray(searchSpec) ? searchSpec : [searchSpec];

      // Skip if this is just the primary key or a prefix of it
      if (columns.length <= pkColumns.length) {
        const isPkPrefix = columns.every((col, idx) => col === pkColumns[idx]);
        if (isPkPrefix) continue;
      }

      // Create index name and column list
      const indexName = `${this.table}_${columns.join("_")}`;
      const columnList = columns.map((col) => `\`${String(col)}\``).join(", ");

      // Skip if we've already created this index or if it's redundant
      const columnKey = columns.join(",");
      if (createdIndexes.has(columnKey)) continue;

      // Check if this index would be redundant with an existing one
      const isRedundant = Array.from(createdIndexes).some((existing) => {
        const existingCols = existing.split(",");
        return (
          existingCols.length >= columns.length &&
          columns.every((col, idx) => col === existingCols[idx])
        );
      });

      if (!isRedundant) {
        this.db.exec(
          `CREATE INDEX IF NOT EXISTS \`${indexName}\` ON \`${this.table}\` (${columnList})`
        );
        createdIndexes.add(columnKey);
      }
    }
  }

  /**
   * Maps TypeScript/JavaScript types to their SQLite column type equivalents
   * @param type - The TypeScript/JavaScript type to map
   * @returns The corresponding SQLite column type
   */
  protected mapTypeToSQL(type: string): string {
    // Basic type mapping; extend according to your needs
    switch (type) {
      case "string":
        return "TEXT";
      case "boolean": // SQLite uses INTEGER for boolean
      case "number":
        return "INTEGER";
      default:
        return "TEXT";
    }
  }

  /**
   * Stores a key-value pair in the database
   * @param key - The primary key object
   * @param value - The value object to store
   * @emits 'put' event when successful
   */
  async put(entity: Combined): Promise<void> {
    const { key, value } = this.separateKeyValueFromCombined(entity);
    const sql = `
      INSERT OR REPLACE INTO \`${
        this.table
      }\` (${this.primaryKeyColumnList()}, ${this.valueColumnList()})
      VALUES (
        ${this.primaryKeyColumns().map((i) => "?")},
        ${this.valueColumns().map((i) => "?")}
      )
    `;
    const stmt = this.db.prepare(sql);

    const primaryKeyParams = this.getPrimaryKeyAsOrderedArray(key);
    const valueParams = this.getValueAsOrderedArray(value);
    const params = [...primaryKeyParams, ...valueParams];

    const result = stmt.run(...params);

    this.events.emit("put", entity);
  }

  /**
   * Retrieves a value from the database by its key
   * @param key - The primary key object to look up
   * @returns The stored value or undefined if not found
   * @emits 'get' event when successful
   */
  async get(key: Key): Promise<Combined | undefined> {
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((key) => `\`${key}\` = ?`)
      .join(" AND ");

    const sql = `
      SELECT * FROM \`${this.table}\` WHERE ${whereClauses}
    `;
    const stmt = this.db.prepare<Combined, BasicKeyType[]>(sql);
    const params = this.getPrimaryKeyAsOrderedArray(key);
    const value = stmt.get(...params);
    if (value) {
      this.events.emit("get", key, value);
      return value;
    } else {
      this.events.emit("get", key, undefined);
      return undefined;
    }
  }

  /**
   * Method to be implemented by concrete repositories to search for key-value pairs
   * based on a partial key.
   *
   * @param key - Partial key to search for
   * @returns Promise resolving to an array of combined key-value objects or undefined if not found
   */
  public async search(key: Partial<Combined>): Promise<Combined[] | undefined> {
    const searchKeys = Object.keys(key);
    if (searchKeys.length === 0) {
      return undefined;
    }

    // Find the best matching index for the search
    const bestIndex = super.findBestMatchingIndex(searchKeys);
    if (!bestIndex) {
      console.log("No suitable index found for the search criteria", key, searchKeys, bestIndex);
      throw new Error("No suitable index found for the search criteria");
    }

    // very columns in primary key or value schema
    const validColumns = [...this.primaryKeyColumns(), ...this.valueColumns()];
    const invalidColumns = searchKeys.filter((key) => !validColumns.includes(key));
    if (invalidColumns.length > 0) {
      throw new Error(`Invalid columns in search criteria: ${invalidColumns.join(", ")}`);
    }

    const whereClauses = Object.keys(key)
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(" AND ");
    const whereClauseValues = Object.values(key);

    const sql = `
      SELECT * FROM \`${this.table}\` WHERE ${whereClauses}
    `;
    const stmt = this.db.prepare<Combined, BasicKeyType[]>(sql);
    const result = stmt.all(...whereClauseValues);

    if (result.length > 0) {
      this.events.emit("search", key, result);
      return result;
    } else {
      this.events.emit("search", key, undefined);
      return undefined;
    }
  }

  /**
   * Deletes a key-value pair from the database
   * @param key - The primary key object to delete
   * @emits 'delete' event when successful
   */
  async delete(key: Key): Promise<void> {
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const params = this.getPrimaryKeyAsOrderedArray(key);
    const stmt = this.db.prepare(`DELETE FROM ${this.table} WHERE ${whereClauses}`);
    stmt.run(...params);
    this.events.emit("delete", key);
  }

  /**
   * Retrieves all entries from the database table
   * @returns Promise resolving to an array of entries or undefined if not found
   */
  async getAll(): Promise<Combined[] | undefined> {
    const sql = `SELECT * FROM \`${this.table}\``;
    const stmt = this.db.prepare<Combined, []>(sql);
    const value = stmt.all();
    return value.length ? value : undefined;
  }

  /**
   * Deletes all entries from the database table
   * @emits 'clearall' event when successful
   */
  async deleteAll(): Promise<void> {
    this.db.exec(`DELETE FROM ${this.table}`);
    this.events.emit("clearall");
  }

  /**
   * Gets the total number of entries in the database table
   * @returns The count of entries
   */
  async size(): Promise<number> {
    const stmt = this.db.prepare<{ count: number }, []>(`
      SELECT COUNT(*) AS count FROM ${this.table}
    `);
    return stmt.get()?.count || 0;
  }
}
