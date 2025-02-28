//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { Pool } from "pg";

import { BaseSqlTabularRepository } from "./BaseSqlTabularRepository";
import { BasePrimaryKeySchema, BaseValueSchema, BasicKeyType } from "./ITabularRepository";

/**
 * A PostgreSQL-based tabular repository implementation that extends BaseSqlTabularRepository.
 * This class provides persistent storage for data in a PostgreSQL database,
 * making it suitable for multi-user scenarios.
 *
 * @template PrimaryKey - The type of the primary key, must be a record of basic types
 * @template Value - The type of the stored value, can be any record type
 * @template PrimaryKeySchema - Schema definition for the primary key
 * @template ValueSchema - Schema definition for the value
 * @template Combined - Combined type of Key & Value
 */
export class PostgresTabularRepository<
  PrimaryKey extends Record<string, BasicKeyType>,
  Value extends Record<string, any>,
  PrimaryKeySchema extends BasePrimaryKeySchema,
  ValueSchema extends BaseValueSchema,
  Combined extends Record<string, any> = PrimaryKey & Value,
> extends BaseSqlTabularRepository<PrimaryKey, Value, PrimaryKeySchema, ValueSchema, Combined> {
  private db: Pool;

  /**
   * Creates a new PostgresTabularRepository instance.
   *
   * @param db - PostgreSQL db
   * @param table - Name of the table to store data (defaults to "tabular_store")
   * @param primaryKeySchema - Schema definition for primary key columns
   * @param valueSchema - Schema definition for value columns
   * @param searchable - Array of columns or column arrays to make searchable. Each string creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    db: Pool,
    table: string = "tabular_store",
    primaryKeySchema: PrimaryKeySchema,
    valueSchema: ValueSchema,
    searchable: Array<keyof Combined | Array<keyof Combined>> = []
  ) {
    super(table, primaryKeySchema, valueSchema, searchable);
    this.db = db;
    this.dbPromise = this.setupDatabase();
  }

  private dbPromise: Promise<void> | undefined;

  /**
   * Initializes the database table with the required schema.
   * Creates the table if it doesn't exist with primary key and value columns.
   */
  private async setupDatabase(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS "${this.table}" (
        ${this.constructPrimaryKeyColumns()},
        ${this.constructValueColumns()},
        PRIMARY KEY (${this.primaryKeyColumnList()}) 
      )
    `;
    await this.db.query(sql);

    // Get primary key columns to avoid creating redundant indexes
    const pkColumns = this.primaryKeyColumns();
    const pkColumnSet = new Set(pkColumns);

    // Track created indexes to avoid duplicates and redundant indexes
    const createdIndexes = new Set<string>();

    for (const columns of this.searchable) {
      // Skip if this is just the primary key or a prefix of it
      if (columns.length <= pkColumns.length) {
        const isPkPrefix = columns.every((col, idx) => col === pkColumns[idx]);
        if (isPkPrefix) continue;
      }

      // Create index name and column list
      const indexName = `${this.table}_${columns.join("_")}`;
      const columnList = columns.map((col) => `"${String(col)}"`).join(", ");

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
        await this.db.query(
          `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${this.table}" (${columnList})`
        );
        createdIndexes.add(columnKey);
      }
    }
  }

  /**
   * Maps TypeScript/JavaScript types to corresponding PostgreSQL data types.
   *
   * @param type - The TypeScript/JavaScript type to map
   * @returns The corresponding PostgreSQL data type
   */
  protected mapTypeToSQL(type: string): string {
    // Basic type mapping; extend according to your needs
    switch (type) {
      case "string":
        return "TEXT";
      case "boolean":
        return "BOOLEAN";
      case "number":
        return "INTEGER";
      default:
        return "TEXT";
    }
  }

  /**
   * Stores or updates a row in the database.
   * Uses UPSERT (INSERT ... ON CONFLICT DO UPDATE) for atomic operations.
   *
   * @param key - The primary key object
   * @param value - The value object to store
   * @emits "put" event with the key when successful
   */
  async put(entity: Combined): Promise<void> {
    await this.dbPromise;
    const { key, value } = this.separateKeyValueFromCombined(entity);
    const sql = `
      INSERT INTO "${this.table}" (
        ${this.primaryKeyColumnList()},
        ${this.valueColumnList()}
      )
      VALUES (
        ${[...this.primaryKeyColumns(), ...this.valueColumns()]
          .map((_, i) => `$${i + 1}`)
          .join(", ")}
      )
      ON CONFLICT (${this.primaryKeyColumnList()}) DO UPDATE
      SET 
      ${(this.valueColumns() as string[])
        .map((col, i) => `${col} = $${i + this.primaryKeyColumns().length + 1}`)
        .join(", ")}
    `;

    const primaryKeyParams = this.getPrimaryKeyAsOrderedArray(key);
    const valueParams = this.getValueAsOrderedArray(value);
    const params = [...primaryKeyParams, ...valueParams];
    await this.db.query(sql, params);
    this.events.emit("put", entity);
  }

  /**
   * Retrieves a value from the database by its primary key.
   *
   * @param key - The primary key object to look up
   * @returns The stored value or undefined if not found
   * @emits "get" event with the key when successful
   */
  async get(key: PrimaryKey): Promise<Combined | undefined> {
    await this.dbPromise;
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((discriminatorKey, i) => `${discriminatorKey} = $${i + 1}`)
      .join(" AND ");

    const sql = `SELECT ${this.valueColumnList()} FROM "${this.table}" WHERE ${whereClauses}`;
    const params = this.getPrimaryKeyAsOrderedArray(key);
    const result = await this.db.query(sql, params);

    let val: Combined | undefined;
    if (result.rows.length > 0) {
      val = result.rows[0] as Combined;
    } else {
      val = undefined;
    }
    this.events.emit("get", key, val);
    return val;
  }

  /**
   * Method to be implemented by concrete repositories to search for rows
   * based on a partial key.
   *
   * @param key - Partial key to search for
   * @returns Promise resolving to an array of combined row objects or undefined if not found
   */
  public async search(key: Partial<Combined>): Promise<Combined[] | undefined> {
    await this.dbPromise;
    const searchKeys = Object.keys(key);
    if (searchKeys.length === 0) {
      return undefined;
    }

    // Find the best matching index for the search
    const bestIndex = this.findBestMatchingIndex(searchKeys);
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

    const sql = `SELECT * FROM "${this.table}" WHERE ${whereClauses}`;
    const result = await this.db.query<Combined, any[]>(sql, whereClauseValues);

    if (result.rows.length > 0) {
      this.events.emit("search", key, result.rows);
      return result.rows;
    } else {
      this.events.emit("search", key, undefined);
      return undefined;
    }
  }

  /**
   * Deletes a row from the database.
   *
   * @param key - The primary key object to delete
   * @emits "delete" event with the key when successful
   */
  async delete(value: PrimaryKey | Combined): Promise<void> {
    await this.dbPromise;
    const { key } = this.separateKeyValueFromCombined(value as Combined);
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((key, i) => `${key} = $${i + 1}`)
      .join(" AND ");

    const params = this.getPrimaryKeyAsOrderedArray(key);
    await this.db.query(`DELETE FROM "${this.table}" WHERE ${whereClauses}`, params);
    this.events.emit("delete", key);
  }

  /**
   * Retrieves all entries from the database table
   * @returns Promise resolving to an array of entries or undefined if not found
   */
  async getAll(): Promise<Combined[] | undefined> {
    await this.dbPromise;
    const sql = `SELECT * FROM "${this.table}"`;
    const result = await this.db.query<Combined, []>(sql);
    return result.rows.length ? result.rows : undefined;
  }

  /**
   * Deletes all rows from the database table.
   * @emits "clearall" event when successful
   */
  async deleteAll(): Promise<void> {
    await this.dbPromise;
    await this.db.query(`DELETE FROM "${this.table}"`);
    this.events.emit("clearall");
  }

  /**
   * Returns the total number of rows in the database.
   *
   * @returns Promise resolving to the count of stored items
   */
  async size(): Promise<number> {
    await this.dbPromise;
    const result = await this.db.query(`SELECT COUNT(*) FROM "${this.table}"`);
    return parseInt(result.rows[0].count, 10);
  }
}
