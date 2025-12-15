/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, DataPortSchemaObject, FromSchema, JsonSchema } from "@workglow/util";
import type { Pool } from "pg";
import { BaseSqlTabularRepository } from "./BaseSqlTabularRepository";
import {
  ITabularRepository,
  TabularChangePayload,
  TabularSubscribeOptions,
  ValueOptionType,
} from "./ITabularRepository";

export const POSTGRES_TABULAR_REPOSITORY = createServiceToken<
  ITabularRepository<any, any, any, any, any>
>("storage.tabularRepository.postgres");

/**
 * A PostgreSQL-based tabular repository implementation that extends BaseSqlTabularRepository.
 * This class provides persistent storage for data in a PostgreSQL database,
 * making it suitable for multi-user scenarios.
 *
 * @template Schema - The schema definition for the entity
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export class PostgresTabularRepository<
  Schema extends DataPortSchemaObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Schema["properties"]>,
  // computed types
  Entity = FromSchema<Schema>,
  PrimaryKey = Pick<Entity, PrimaryKeyNames[number] & keyof Entity>,
  Value = Omit<Entity, PrimaryKeyNames[number] & keyof Entity>,
> extends BaseSqlTabularRepository<Schema, PrimaryKeyNames, Entity, PrimaryKey, Value> {
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
  }

  /**
   * Initializes the database table with the required schema.
   * Creates the table if it doesn't exist with primary key and value columns.
   * Must be called before using any other methods.
   */
  public async setupDatabase(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS "${this.table}" (
        ${this.constructPrimaryKeyColumns('"')} ${this.constructValueColumns('"')},
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
   * Uses additional schema information like minimum/maximum values, nullable status,
   * and string lengths to create more optimized column types.
   *
   * @param typeDef - The TypeScript/JavaScript type to map
   * @returns The corresponding PostgreSQL data type
   */
  protected mapTypeToSQL(typeDef: JsonSchema): string {
    // Extract the actual non-null type using base helper
    const actualType = this.getNonNullType(typeDef);
    if (typeof actualType === "boolean") {
      return "TEXT /* boolean schema */";
    }

    // Handle BLOB type
    if (actualType.contentEncoding === "blob") return "BYTEA";

    switch (actualType.type) {
      case "string":
        // Handle special string formats
        if (actualType.format === "date-time") return "TIMESTAMP";
        if (actualType.format === "date") return "DATE";
        if (actualType.format === "email") return "VARCHAR(255)";
        if (actualType.format === "uri") return "VARCHAR(2048)";
        if (actualType.format === "uuid") return "UUID";

        // Use a VARCHAR with maxLength if specified
        if (typeof actualType.maxLength === "number") {
          return `VARCHAR(${actualType.maxLength})`;
        }

        // Default to TEXT for strings without constraints
        return "TEXT";

      case "number":
      case "integer":
        // Handle integer vs floating point
        if (actualType.multipleOf === 1 || actualType.type === "integer") {
          // Use PostgreSQL's numeric range types based on min/max values
          if (typeof actualType.minimum === "number") {
            if (actualType.minimum >= 0) {
              // For unsigned integers
              if (typeof actualType.maximum === "number") {
                if (actualType.maximum <= 32767) return "SMALLINT";
                if (actualType.maximum <= 2147483647) return "INTEGER";
              }
              return "BIGINT";
            }
          }

          // Default integer type
          return "INTEGER";
        }

        // For floating point numbers with precision requirements
        if (actualType.format === "float") return "REAL";
        if (actualType.format === "double") return "DOUBLE PRECISION";

        // Use NUMERIC with precision/scale if specified
        if (typeof actualType.multipleOf === "number") {
          const decimalPlaces = String(actualType.multipleOf).split(".")[1]?.length || 0;
          if (decimalPlaces > 0) {
            return `NUMERIC(38, ${decimalPlaces})`;
          }
        }

        return "NUMERIC";

      case "boolean":
        return "BOOLEAN";

      case "array":
        // Handle array types (if items type is specified)
        if (
          actualType.items &&
          typeof actualType.items === "object" &&
          !Array.isArray(actualType.items)
        ) {
          const itemType = this.mapTypeToSQL(actualType.items as JsonSchema);

          // Only use native PostgreSQL arrays for simple scalar types
          // List of types that work well as native PostgreSQL arrays
          const supportedArrayElementTypes = [
            "TEXT",
            "VARCHAR",
            "CHAR",
            "INTEGER",
            "SMALLINT",
            "BIGINT",
            "REAL",
            "DOUBLE PRECISION",
            "NUMERIC",
            "BOOLEAN",
            "UUID",
            "DATE",
            "TIMESTAMP",
          ];

          // Check if the item type is in our supported list (either exact match or starts with for VARCHAR types)
          const isSupported = supportedArrayElementTypes.some(
            (type) => itemType === type || (itemType.startsWith(type + "(") && type !== "VARCHAR") // Handle things like VARCHAR(255)
          );

          if (isSupported) {
            return `${itemType}[]`;
          } else {
            return "JSONB /* complex array */";
          }
        }
        return "JSONB /* generic array */";

      case "object":
        return "JSONB /* object */";

      default:
        return "TEXT /* unknown type */";
    }
  }

  /**
   * Generates the SQL column definitions for primary key fields with constraints
   * @returns SQL string containing primary key column definitions
   */
  protected constructPrimaryKeyColumns($delimiter: string = ""): string {
    const cols = Object.entries<JsonSchema>(this.primaryKeySchema.properties)
      .map(([key, typeDef]) => {
        const sqlType = this.mapTypeToSQL(typeDef);
        let constraints = "NOT NULL";

        // Add CHECK constraint for unsigned numbers
        if (this.shouldBeUnsigned(typeDef)) {
          constraints += ` CHECK (${$delimiter}${key}${$delimiter} >= 0)`;
        }

        return `${$delimiter}${key}${$delimiter} ${sqlType} ${constraints}`;
      })
      .join(", ");
    return cols;
  }

  /**
   * Generates the SQL column definitions for value fields with constraints
   * @returns SQL string containing value column definitions
   */
  protected constructValueColumns($delimiter: string = ""): string {
    const requiredSet = new Set(this.valueSchema.required ?? []);
    const cols = Object.entries<JsonSchema>(this.valueSchema.properties)
      .map(([key, typeDef]) => {
        const sqlType = this.mapTypeToSQL(typeDef);
        const isRequired = requiredSet.has(key);
        const nullable = !isRequired || this.isNullable(typeDef);
        let constraints = nullable ? "NULL" : "NOT NULL";

        // Add CHECK constraint for unsigned numbers
        if (this.shouldBeUnsigned(typeDef)) {
          constraints += ` CHECK (${$delimiter}${key}${$delimiter} >= 0)`;
        }

        return `${$delimiter}${key}${$delimiter} ${sqlType} ${constraints}`;
      })
      .join(", ");
    if (cols.length > 0) {
      return `, ${cols}`;
    } else {
      return "";
    }
  }

  /**
   * Convert PostgreSQL values to JS values. Ensures numeric strings become numbers where schema says number.
   */
  protected sqlToJsValue(column: string, value: ValueOptionType): Entity[keyof Entity] {
    const typeDef = this.schema.properties[column as keyof typeof this.schema.properties] as
      | JsonSchema
      | undefined;
    if (typeDef) {
      if (value === null && this.isNullable(typeDef)) {
        return null as any;
      }
      const actualType = this.getNonNullType(typeDef);

      // Handle numeric types - PostgreSQL can return them as strings
      if (
        typeof actualType !== "boolean" &&
        (actualType.type === "number" || actualType.type === "integer")
      ) {
        const v: any = value;
        if (typeof v === "number") return v as any;
        if (typeof v === "string") {
          const parsed = Number(v);
          if (!isNaN(parsed)) return parsed as any;
        }
      }
    }
    return super.sqlToJsValue(column, value);
  }

  /**
   * Determines if a field should be treated as unsigned based on schema properties
   * @param typeDef - The schema type definition
   * @returns true if the field should be treated as unsigned
   */
  protected shouldBeUnsigned(typeDef: JsonSchema): boolean {
    // Extract the non-null type using the base class helper
    const actualType = this.getNonNullType(typeDef);
    if (typeof actualType === "boolean") {
      return false;
    }

    // Check if it's a number type with minimum >= 0
    if (
      (actualType.type === "number" || actualType.type === "integer") &&
      typeof actualType.minimum === "number" &&
      actualType.minimum >= 0
    ) {
      return true;
    }

    return false;
  }

  /**
   * Stores or updates a row in the database.
   * Uses UPSERT (INSERT ... ON CONFLICT DO UPDATE) for atomic operations.
   *
   * @param entity - The entity to store
   * @returns The entity with any server-generated fields updated
   * @emits "put" event with the updated entity when successful
   */
  async put(entity: Entity): Promise<Entity> {
    const db = this.db;
    const { key, value } = this.separateKeyValueFromCombined(entity);
    const sql = `
      INSERT INTO "${this.table}" (
        ${this.primaryKeyColumnList('"')} ${this.valueColumnList() ? ", " + this.valueColumnList('"') : ""}
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
      ON CONFLICT (${this.primaryKeyColumnList('"')}) DO UPDATE
      SET 
      ${(this.valueColumns() as string[])
        .map((col, i) => `"${col}" = $${i + this.primaryKeyColumns().length + 1}`)
        .join(", ")}
      `
      }
      RETURNING *
    `;

    const primaryKeyParams = this.getPrimaryKeyAsOrderedArray(key);
    const valueParams = this.getValueAsOrderedArray(value);
    const params = [...primaryKeyParams, ...valueParams];
    const result = await db.query(sql, params);

    const updatedEntity = result.rows[0] as Entity;
    // Convert blob fields from SQL to JS values
    for (const key in this.schema.properties) {
      // @ts-ignore
      updatedEntity[key] = this.sqlToJsValue(key, updatedEntity[key]);
    }

    this.events.emit("put", updatedEntity);
    return updatedEntity;
  }

  /**
   * Stores multiple rows in the database in a bulk operation.
   * Uses batch INSERT with ON CONFLICT for better performance.
   *
   * @param entities - Array of entities to store
   * @returns Array of entities with any server-generated fields updated
   * @emits "put" event for each entity stored
   */
  async putBulk(entities: Entity[]): Promise<Entity[]> {
    if (entities.length === 0) return [];

    const db = this.db;

    // Prepare all parameters and build VALUES clause
    const allParams: any[] = [];
    const valuesPerRow = this.primaryKeyColumns().length + this.valueColumns().length;
    let paramIndex = 1;

    // Build the VALUES clauses - one for each entity
    const valuesClauses = entities
      .map((entity) => {
        const { key, value } = this.separateKeyValueFromCombined(entity);
        const primaryKeyParams = this.getPrimaryKeyAsOrderedArray(key);
        const valueParams = this.getValueAsOrderedArray(value);
        const entityParams = [...primaryKeyParams, ...valueParams];

        // Add all parameters for this entity to the flat array
        allParams.push(...entityParams);

        // Create placeholders for this row using PostgreSQL $1, $2, etc.
        const placeholders = Array(valuesPerRow)
          .fill(0)
          .map(() => `$${paramIndex++}`)
          .join(", ");
        return `(${placeholders})`;
      })
      .join(", ");

    const sql = `
      INSERT INTO "${this.table}" (
        ${this.primaryKeyColumnList('"')} ${this.valueColumnList() ? ", " + this.valueColumnList('"') : ""}
      )
      VALUES ${valuesClauses}
      ${
        !this.valueColumnList()
          ? ""
          : `
      ON CONFLICT (${this.primaryKeyColumnList('"')}) DO UPDATE
      SET 
      ${(this.valueColumns() as string[])
        .map((col) => {
          // For the UPDATE part, we need to reference the excluded values
          return `"${col}" = EXCLUDED."${col}"`;
        })
        .join(", ")}
      `
      }
      RETURNING *
    `;

    const result = await db.query(sql, allParams);

    const updatedEntities = result.rows.map((row) => {
      const entity = row as Entity;
      // Convert blob fields from SQL to JS values
      for (const key in this.schema.properties) {
        // @ts-ignore
        entity[key] = this.sqlToJsValue(key, entity[key]);
      }
      return entity;
    });

    // Emit events for each entity
    for (const entity of updatedEntities) {
      this.events.emit("put", entity);
    }

    return updatedEntities;
  }

  /**
   * Retrieves a value from the database by its primary key.
   *
   * @param key - The primary key object to look up
   * @returns The stored value or undefined if not found
   * @emits "get" event with the key when successful
   */
  async get(key: PrimaryKey): Promise<Entity | undefined> {
    const db = this.db;
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((discriminatorKey, i) => `"${discriminatorKey}" = $${i + 1}`)
      .join(" AND ");

    const sql = `SELECT * FROM "${this.table}" WHERE ${whereClauses}`;
    const params = this.getPrimaryKeyAsOrderedArray(key);
    const result = await db.query(sql, params);

    let val: Entity | undefined;
    if (result.rows.length > 0) {
      val = result.rows[0] as Entity;
      // Convert all columns according to schema
      for (const key in this.schema.properties) {
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
    const db = this.db;
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
    const whereClauseValues = Object.entries(key).map(([k, v]) =>
      // @ts-ignore
      this.jsToSqlValue(k, v as any)
    );

    const sql = `SELECT * FROM "${this.table}" WHERE ${whereClauses}`;
    // @ts-ignore
    const result = await db.query<Entity, any[]>(sql, whereClauseValues);

    if (result.rows.length > 0) {
      // Convert all columns according to schema
      for (const row of result.rows) {
        for (const k in this.schema.properties) {
          // @ts-ignore
          row[k] = this.sqlToJsValue(k, row[k]);
        }
      }
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
    const db = this.db;
    const { key } = this.separateKeyValueFromCombined(value as Entity);
    const whereClauses = (this.primaryKeyColumns() as string[])
      .map((key, i) => `${key} = $${i + 1}`)
      .join(" AND ");

    const params = this.getPrimaryKeyAsOrderedArray(key);
    await db.query(`DELETE FROM "${this.table}" WHERE ${whereClauses}`, params);
    this.events.emit("delete", key as keyof Entity);
  }

  /**
   * Retrieves all entries from the database table
   * @returns Promise resolving to an array of entries or undefined if not found
   */
  async getAll(): Promise<Entity[] | undefined> {
    const db = this.db;
    const sql = `SELECT * FROM "${this.table}"`;
    const result = await db.query(sql);

    if (result.rows.length > 0) {
      // Convert all columns according to schema
      for (const row of result.rows) {
        for (const key in this.schema.properties) {
          // @ts-ignore
          row[key] = this.sqlToJsValue(key, row[key]);
        }
      }
      return result.rows;
    }
    return undefined;
  }

  /**
   * Deletes all rows from the database table.
   * @emits "clearall" event when successful
   */
  async deleteAll(): Promise<void> {
    const db = this.db;
    await db.query(`DELETE FROM "${this.table}"`);
    this.events.emit("clearall");
  }

  /**
   * Returns the total number of rows in the database.
   *
   * @returns Promise resolving to the count of stored items
   */
  async size(): Promise<number> {
    const db = this.db;
    const result = await db.query(`SELECT COUNT(*) FROM "${this.table}"`);
    return parseInt(result.rows[0].count, 10);
  }

  protected generateWhereClause(
    column: keyof Entity,
    operator: "=" | "<" | "<=" | ">" | ">=" = "="
  ): string {
    if (!(column in this.schema.properties)) {
      throw new Error(`Schema must have a ${String(column)} field to use deleteSearch`);
    }
    return `"${String(column)}" ${operator} $1`;
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

    const db = this.db;
    await db.query(`DELETE FROM "${this.table}" WHERE ${whereClause}`, [
      this.jsToSqlValue(column as string, value),
    ]);
    this.events.emit("delete", column as keyof Entity);
  }

  /**
   * Subscribes to changes in the repository.
   * NOT IMPLEMENTED for PostgreSQL storage.
   *
   * @throws Error always - subscribeToChanges is not supported for PostgreSQL storage
   */
  subscribeToChanges(
    callback: (change: TabularChangePayload<Entity>) => void,
    options?: TabularSubscribeOptions
  ): () => void {
    throw new Error("subscribeToChanges is not supported for PostgresTabularRepository");
  }

  /**
   * Destroys the repository and frees up resources.
   */
  destroy(): void {
    super.destroy();
  }
}
