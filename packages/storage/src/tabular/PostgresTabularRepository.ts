//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { Pool } from "pg";
import { createServiceToken } from "@ellmers/util";
import { BaseSqlTabularRepository } from "./BaseSqlTabularRepository";
import {
  ValueSchema,
  ExtractValue,
  SchemaToType,
  ExtractPrimaryKey,
  ITabularRepository,
  ValueOptionType,
} from "./ITabularRepository";

export const POSTGRES_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.postgres"
);

/**
 * A PostgreSQL-based tabular repository implementation that extends BaseSqlTabularRepository.
 * This class provides persistent storage for data in a PostgreSQL database,
 * making it suitable for multi-user scenarios.
 *
 * @template Schema - The schema definition for the entity
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export class PostgresTabularRepository<
  Schema extends ValueSchema,
  PrimaryKeyNames extends ReadonlyArray<keyof Schema>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = SchemaToType<Schema>,
  Value = ExtractValue<Schema, PrimaryKeyNames>,
> extends BaseSqlTabularRepository<Schema, PrimaryKeyNames, PrimaryKey, Entity, Value> {
  private db: Pool;

  /**
   * Creates a new PostgresTabularRepository instance.
   *
   * @param db - PostgreSQL db
   * @param table - Name of the table to store data (defaults to "tabular_store")
   * @param schema - Schema defining the structure of the entity
   * @param primaryKeyNames - Array of property names that form the primary key
   * @param indexes - Array of columns or column arrays to make searchable. Each string or single column creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    db: Pool,
    table: string = "tabular_store",
    schema: Schema,
    primaryKeyNames: PrimaryKeyNames,
    indexes: Array<keyof Entity | Array<keyof Entity>> = []
  ) {
    super(table, schema, primaryKeyNames, indexes);
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
        ${this.constructPrimaryKeyColumns()} ${this.constructValueColumns()},
        PRIMARY KEY (${this.primaryKeyColumnList()}) 
      )
    `;
    await this.db.query(sql);

    // Get primary key columns to avoid creating redundant indexes
    const pkColumns = this.primaryKeyColumns();

    // Track created indexes to avoid duplicates and redundant indexes
    const createdIndexes = new Set<string>();

    for (const columns of this.indexes) {
      // Skip if this is just the primary key or a prefix of it
      if (columns.length <= pkColumns.length) {
        // @ts-ignore
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
      case "blob":
        return "BYTEA";
      case "date":
        return "TIMESTAMP";
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
  async put(entity: Entity): Promise<void> {
    await this.dbPromise;
    const { key, value } = this.separateKeyValueFromCombined(entity);
    const sql = `
      INSERT INTO "${this.table}" (
        ${this.primaryKeyColumnList()} ${this.valueColumnList() ? ", " + this.valueColumnList() : ""}
      )
      VALUES (
        ${[...this.primaryKeyColumns(), ...this.valueColumns()]
          .map((_, i) => `$${i + 1}`)
          .join(", ")}
      )
      ${
        !this.valueColumnList()
          ? ""
          : `
      ON CONFLICT (${this.primaryKeyColumnList()}) DO UPDATE
      SET 
      ${(this.valueColumns() as string[])
        .map((col, i) => `${col} = $${i + this.primaryKeyColumns().length + 1}`)
        .join(", ")}
      `
      }
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
  async get(key: PrimaryKey): Promise<Entity | undefined> {
    await this.dbPromise;
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((discriminatorKey, i) => `${discriminatorKey} = $${i + 1}`)
      .join(" AND ");

    const sql = `SELECT ${this.valueColumnList()} FROM "${this.table}" WHERE ${whereClauses}`;
    const params = this.getPrimaryKeyAsOrderedArray(key);
    const result = await this.db.query(sql, params);

    let val: Entity | undefined;
    if (result.rows.length > 0) {
      val = result.rows[0] as Entity;
      // iterate through the schema and check if value is a blob base on the schema
      for (const [key, type] of Object.entries(this.valueSchema)) {
        // @ts-ignore
        val[key] = this.sqlToJsValue(key, val[key]);
      }
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
  public async search(key: Partial<Entity>): Promise<Entity[] | undefined> {
    await this.dbPromise;
    const searchKeys = Object.keys(key);
    if (searchKeys.length === 0) {
      return undefined;
    }

    // Find the best matching index for the search
    const bestIndex = this.findBestMatchingIndex(searchKeys as Array<keyof Entity>);
    if (!bestIndex) {
      throw new Error(
        `No suitable index found for the search criteria, searching for ['${searchKeys.join(
          "', '"
        )}'] with pk ['${this.primaryKeyNames.join("', '")}'] and indexes ['${this.indexes.join(
          "', '"
        )}']`
      );
    }

    // very columns in primary key or value schema
    const validColumns = [...this.primaryKeyColumns(), ...this.valueColumns()];
    // @ts-expect-error
    const invalidColumns = searchKeys.filter((key) => !validColumns.includes(key));
    if (invalidColumns.length > 0) {
      throw new Error(`Invalid columns in search criteria: ${invalidColumns.join(", ")}`);
    }

    const whereClauses = Object.keys(key)
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(" AND ");
    const whereClauseValues = Object.values(key);

    const sql = `SELECT * FROM "${this.table}" WHERE ${whereClauses}`;
    // @ts-ignore
    const result = await this.db.query<Entity, any[]>(sql, whereClauseValues);

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
  async delete(value: PrimaryKey | Entity): Promise<void> {
    await this.dbPromise;
    const { key } = this.separateKeyValueFromCombined(value as Entity);
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((key, i) => `${key} = $${i + 1}`)
      .join(" AND ");

    const params = this.getPrimaryKeyAsOrderedArray(key);
    await this.db.query(`DELETE FROM "${this.table}" WHERE ${whereClauses}`, params);
    this.events.emit("delete", key as keyof Entity);
  }

  /**
   * Retrieves all entries from the database table
   * @returns Promise resolving to an array of entries or undefined if not found
   */
  async getAll(): Promise<Entity[] | undefined> {
    await this.dbPromise;
    const sql = `SELECT * FROM "${this.table}"`;
    const result = await this.db.query(sql);
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

  protected generateWhereClause(
    column: keyof Entity,
    operator: "=" | "<" | "<=" | ">" | ">=" = "="
  ): string {
    if (!this.schema[column as keyof Schema]) {
      throw new Error(`Schema must have a ${String(column)} field to use deleteSearch`);
    }
    return `${String(column)} ${operator} $1`;
  }

  /**
   * Deletes all entries with a date column value older than the provided date
   * @param column - The name of the date column to compare against
   * @param value - The value to compare against
   * @param operator - The operator to use for comparison
   */
  async deleteSearch(
    column: keyof Entity,
    value: ValueOptionType,
    operator: "=" | "<" | "<=" | ">" | ">=" = "="
  ): Promise<void> {
    await this.dbPromise;
    const whereClause = this.generateWhereClause(column, operator);

    await this.db.query(`DELETE FROM "${this.table}" WHERE ${whereClause}`, [
      this.jsToSqlValue(column as string, value),
    ]);
    this.events.emit("delete", column as keyof Entity);
  }
}
