//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Sqlite } from "@podley/sqlite";
import { createServiceToken } from "@podley/util";
import { Static, TObject, TSchema } from "@sinclair/typebox";
import { BaseSqlTabularRepository } from "./BaseSqlTabularRepository";
import { ValueOptionType } from "./ITabularRepository";
import { ExtractPrimaryKey, ExtractValue, ITabularRepository } from "./ITabularRepository";

// Define local type for SQL operations
type ExcludeDateKeyOptionType = Exclude<string | number | bigint, Date>;

export const SQLITE_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.sqlite"
);

const Database = Sqlite.Database;

// SqliteTabularRepository is a key-value store that uses SQLite as the backend for
// in app data.

/**
 * A SQLite-based key-value repository implementation.
 * @template Schema - The schema definition for the entity
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export class SqliteTabularRepository<
  Schema extends TObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Static<Schema>>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = Static<Schema>,
  Value = ExtractValue<Schema, PrimaryKeyNames>,
> extends BaseSqlTabularRepository<Schema, PrimaryKeyNames, PrimaryKey, Entity, Value> {
  /** The SQLite database instance */
  private db: Sqlite.Database;

  /**
   * Creates a new SQLite key-value repository
   * @param dbOrPath - Either a Database instance or a path to the SQLite database file
   * @param table - The name of the table to use for storage (defaults to 'tabular_store')
   * @param schema - Schema defining the structure of the entity
   * @param primaryKeyNames - Array of property names that form the primary key
   * @param indexes - Array of columns or column arrays to make searchable. Each string or single column creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    dbOrPath: string,
    table: string = "tabular_store",
    schema: Schema,
    primaryKeyNames: PrimaryKeyNames,
    indexes: Array<keyof Entity | Array<keyof Entity>> = []
  ) {
    super(table, schema, primaryKeyNames, indexes);
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
        ${this.constructPrimaryKeyColumns()} ${this.constructValueColumns()},
        PRIMARY KEY (${this.primaryKeyColumnList()}) 
      )
    `;
    this.db.exec(sql);

    // Get primary key columns to avoid creating redundant indexes
    const pkColumns = this.primaryKeyColumns();

    // Track created indexes to avoid duplicates and redundant indexes
    const createdIndexes = new Set<string>();

    for (const searchSpec of this.indexes) {
      // Handle both single column and compound indexes
      const columns = Array.isArray(searchSpec) ? searchSpec : [searchSpec];

      // Skip if this is just the primary key or a prefix of it
      if (columns.length <= pkColumns.length) {
        // @ts-ignore
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
   * Uses additional schema information like minimum/maximum values, nullable status,
   * and string lengths to create more optimized column types.
   *
   * @param typeDef - The TypeScript/JavaScript type definition
   * @returns The corresponding SQLite column type
   */
  protected mapTypeToSQL(typeDef: TSchema): string {
    // Get the actual non-null type for proper mapping
    const actualType = this.getNonNullType(typeDef);

    // Handle BLOB type
    if (actualType.contentEncoding === "blob") return "BLOB";

    switch (actualType.type) {
      case "string":
        // Handle special string formats
        if (actualType.format === "date-time") return "TEXT"; // SQLite doesn't have a native TIMESTAMP
        if (actualType.format === "date") return "TEXT";

        // For strings with max length constraints, we can still note this in the schema
        // even though SQLite doesn't enforce VARCHAR lengths
        if (typeof actualType.maxLength === "number") {
          return `TEXT /* VARCHAR(${actualType.maxLength}) */`;
        }

        return "TEXT";

      case "number":
        // SQLite has limited numeric types, but we can use INTEGER for integers
        // and REAL for floating point numbers

        // The multipleOf property in JSON Schema specifies that a number must be a
        // multiple of a given value. When set to 1, it means the number must be a
        // whole number multiple of 1, which effectively means it must be an integer.
        if (typeDef.multipleOf === 1 || typeDef.type === "integer") {
          return "INTEGER";
        }

        return "REAL";

      case "boolean":
        // SQLite uses INTEGER 0/1 for boolean
        return "INTEGER";

      case "array":
      case "object":
        return "TEXT /* JSON */";

      default:
        return "TEXT /* unknown type */";
    }
  }

  /**
   * Stores a key-value pair in the database
   * @param key - The primary key object
   * @param value - The value object to store
   * @emits 'put' event when successful
   */
  async put(entity: Entity): Promise<void> {
    const { key, value } = this.separateKeyValueFromCombined(entity);
    const sql = `
      INSERT OR REPLACE INTO \`${
        this.table
      }\` (${this.primaryKeyColumnList()} ${this.valueColumnList() ? ", " + this.valueColumnList() : ""})
      VALUES (
        ${this.primaryKeyColumns().map((i) => "?")}
        ${this.valueColumns().length > 0 ? ", " + this.valueColumns().map((i) => "?") : ""}
      )
    `;
    const stmt = this.db.prepare(sql);

    const primaryKeyParams = this.getPrimaryKeyAsOrderedArray(key);
    const valueParams = this.getValueAsOrderedArray(value);
    const params = [...primaryKeyParams, ...valueParams];

    // @ts-ignore
    const result = stmt.run(...params);

    this.events.emit("put", entity);
  }

  /**
   * Retrieves a value from the database by its key
   * @param key - The primary key object to look up
   * @returns The stored value or undefined if not found
   * @emits 'get' event when successful
   */
  async get(key: PrimaryKey): Promise<Entity | undefined> {
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((key) => `\`${key}\` = ?`)
      .join(" AND ");

    const sql = `
      SELECT * FROM \`${this.table}\` WHERE ${whereClauses}
    `;
    const stmt = this.db.prepare<Entity, ValueOptionType[]>(sql);
    const params = this.getPrimaryKeyAsOrderedArray(key);
    const value: Entity | null = stmt.get(...params);
    if (value) {
      for (const key in this.valueSchema.properties) {
        // @ts-ignore
        value[key] = this.sqlToJsValue(key, value[key]);
      }
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
  public async search(key: Partial<Entity>): Promise<Entity[] | undefined> {
    const searchKeys = Object.keys(key) as Array<keyof Entity>;
    if (searchKeys.length === 0) {
      return undefined;
    }

    // Find the best matching index for the search
    const bestIndex = super.findBestMatchingIndex(searchKeys);
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
    // @ts-ignore
    const invalidColumns = searchKeys.filter((key) => !validColumns.includes(key));
    if (invalidColumns.length > 0) {
      throw new Error(`Invalid columns in search criteria: ${invalidColumns.join(", ")}`);
    }

    const whereClauses = Object.keys(key)
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(" AND ");
    const whereClauseValues = Object.values(key);

    const sql = `SELECT * FROM \`${this.table}\` WHERE ${whereClauses}`;
    const stmt = this.db.prepare<Entity, ExcludeDateKeyOptionType[]>(sql);
    // @ts-ignore
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
  async delete(key: PrimaryKey): Promise<void> {
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const params = this.getPrimaryKeyAsOrderedArray(key);
    const stmt = this.db.prepare(`DELETE FROM \`${this.table}\` WHERE ${whereClauses}`);
    stmt.run(...params);
    this.events.emit("delete", key as keyof Entity);
  }

  /**
   * Retrieves all entries from the database table
   * @returns Promise resolving to an array of entries or undefined if not found
   */
  async getAll(): Promise<Entity[] | undefined> {
    const sql = `SELECT * FROM \`${this.table}\``;
    const stmt = this.db.prepare<Entity, []>(sql);
    const value = stmt.all();
    return value.length ? value : undefined;
  }

  /**
   * Deletes all entries from the database table
   * @emits 'clearall' event when successful
   */
  async deleteAll(): Promise<void> {
    this.db.exec(`DELETE FROM \`${this.table}\``);
    this.events.emit("clearall");
  }

  /**
   * Gets the total number of entries in the database table
   * @returns The count of entries
   */
  async size(): Promise<number> {
    const stmt = this.db.prepare<{ count: number }, []>(`
      SELECT COUNT(*) AS count FROM \`${this.table}\`
    `);
    return stmt.get()?.count || 0;
  }

  protected generateWhereClause(
    column: keyof Entity,
    operator: "=" | "<" | "<=" | ">" | ">=" = "="
  ): string {
    if (!(column in this.schema.properties)) {
      throw new Error(`Schema must have a ${String(column)} field to use deleteSearch`);
    }
    return `${String(column)} ${operator} ?`;
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
    const whereClause = this.generateWhereClause(column, operator);
    const stmt = this.db.prepare(`DELETE FROM \`${this.table}\` WHERE ${whereClause}`);
    // @ts-ignore
    stmt.run(this.jsToSqlValue(column as string, value));
    this.events.emit("delete", column as keyof Entity);
  }
}
