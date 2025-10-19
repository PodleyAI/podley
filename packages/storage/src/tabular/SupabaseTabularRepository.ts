//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@podley/util";
import { Static, TObject, TSchema } from "@sinclair/typebox";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BaseSqlTabularRepository } from "./BaseSqlTabularRepository";
import {
  ExtractPrimaryKey,
  ExtractValue,
  ITabularRepository,
  ValueOptionType,
} from "./ITabularRepository";

export const SUPABASE_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.supabase"
);

/**
 * A Supabase-based tabular repository implementation that extends BaseSqlTabularRepository.
 * This class provides persistent storage for data in a Supabase database,
 * making it suitable for multi-user scenarios.
 *
 * @template Schema - The schema definition for the entity
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export class SupabaseTabularRepository<
  Schema extends TObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Static<Schema>>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = Static<Schema>,
  Value = ExtractValue<Schema, PrimaryKeyNames>,
> extends BaseSqlTabularRepository<Schema, PrimaryKeyNames, PrimaryKey, Entity, Value> {
  private client: SupabaseClient;

  /**
   * Creates a new SupabaseTabularRepository instance.
   *
   * @param client - Supabase client instance
   * @param table - Name of the table to store data (defaults to "tabular_store")
   * @param schema - Schema defining the structure of the entity
   * @param primaryKeyNames - Array of property names that form the primary key
   * @param indexes - Array of columns or column arrays to make searchable. Each string or single column creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    client: SupabaseClient,
    table: string = "tabular_store",
    schema: Schema,
    primaryKeyNames: PrimaryKeyNames,
    indexes: Array<keyof Entity | Array<keyof Entity>> = []
  ) {
    super(table, schema, primaryKeyNames, indexes);
    this.client = client;
  }

  protected isSetup = true;

  /**
   * Initializes the database table with the required schema.
   * Creates the table if it doesn't exist with primary key and value columns.
   */
  public async setupDatabase(): Promise<SupabaseClient> {
    if (this.isSetup) {
      return this.client;
    }
    const sql = `
      CREATE TABLE IF NOT EXISTS "${this.table}" (
        ${this.constructPrimaryKeyColumns('"')} ${this.constructValueColumns('"')},
        PRIMARY KEY (${this.primaryKeyColumnList()}) 
      )
    `;
    const { error } = await this.client.rpc("exec_sql", { query: sql });
    if (error && !error.message.includes("already exists")) {
      throw error;
    }

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
        const indexSql = `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${this.table}" (${columnList})`;
        const { error: indexError } = await this.client.rpc("exec_sql", { query: indexSql });
        if (indexError && !indexError.message.includes("already exists")) {
          // Index creation errors are not critical, log and continue
          console.warn(`Failed to create index ${indexName}:`, indexError);
        }
        createdIndexes.add(columnKey);
      }
    }
    this.isSetup = true;
    return this.client;
  }

  /**
   * Maps TypeScript/JavaScript types to corresponding PostgreSQL data types.
   * Uses additional schema information like minimum/maximum values, nullable status,
   * and string lengths to create more optimized column types.
   *
   * @param typeDef - The TypeScript/JavaScript type to map
   * @returns The corresponding PostgreSQL data type
   */
  protected mapTypeToSQL(typeDef: TSchema): string {
    // Extract the actual non-null type using base helper
    const actualType = this.getNonNullType(typeDef);

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
        if (actualType.items && typeof actualType.items === "object") {
          const itemType = this.mapTypeToSQL(actualType.items);

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
    const cols = Object.entries<TSchema>(this.primaryKeySchema.properties)
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
    const delimiter = $delimiter || '"';
    const cols = Object.entries<TSchema>(this.valueSchema.properties)
      .map(([key, typeDef]) => {
        const sqlType = this.mapTypeToSQL(typeDef);
        const nullable = this.isNullable(typeDef);
        let constraints = nullable ? "NULL" : "NOT NULL";

        // Add CHECK constraint for unsigned numbers
        if (this.shouldBeUnsigned(typeDef)) {
          constraints += ` CHECK (${delimiter}${key}${delimiter} >= 0)`;
        }

        return `${delimiter}${key}${delimiter} ${sqlType} ${constraints}`;
      })
      .join(", ");
    if (cols.length > 0) {
      return `, ${cols}`;
    } else {
      return "";
    }
  }

  /**
   * Convert Supabase values to JS values. Ensures numeric strings become numbers where schema says number.
   */
  protected sqlToJsValue(column: string, value: ValueOptionType): Entity[keyof Entity] {
    const typeDef = this.schema.properties[column as keyof typeof this.schema.properties] as
      | TSchema
      | undefined;
    if (typeDef) {
      if (value === null && this.isNullable(typeDef)) {
        return null as any;
      }
      const actualType = this.getNonNullType(typeDef);

      // Handle numeric types - Supabase can return them as strings
      if (actualType.type === "number" || actualType.type === "integer") {
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
  protected shouldBeUnsigned(typeDef: TSchema): boolean {
    // Extract the non-null type using the base class helper
    const actualType = this.getNonNullType(typeDef);

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
    await this.setupDatabase();
    const { data, error } = await this.client
      .from(this.table)
      .upsert(entity as any, { onConflict: this.primaryKeyColumnList() })
      .select()
      .single();

    if (error) throw error;
    const updatedEntity = data as Entity;

    // Convert all columns from SQL to JS values
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

    await this.setupDatabase();
    const { data, error } = await this.client
      .from(this.table)
      .upsert(entities as any[], { onConflict: this.primaryKeyColumnList() })
      .select();

    if (error) throw error;
    const updatedEntities = data as Entity[];

    // Convert all columns from SQL to JS values and emit events
    for (const entity of updatedEntities) {
      for (const key in this.schema.properties) {
        // @ts-ignore
        entity[key] = this.sqlToJsValue(key, entity[key]);
      }
      this.events.emit("put", entity);
    }

    return updatedEntities;
  }

  /**
   * Retrieves a value from the database by its primary key.
   *
   * @param key - The primary key object to look up
   * @returns The stored entity or undefined if not found
   * @emits "get" event with the key when successful
   */
  async get(key: PrimaryKey): Promise<Entity | undefined> {
    await this.setupDatabase();

    let query = this.client.from(this.table).select("*");

    // Build the where clause from primary key
    for (const pkName of this.primaryKeyNames) {
      query = query.eq(String(pkName), (key as any)[pkName]);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        this.events.emit("get", key, undefined);
        return undefined;
      }
      throw error;
    }

    const val = data as Entity | undefined;
    if (val) {
      // Convert all columns from SQL to JS values
      for (const key in this.schema.properties) {
        // @ts-ignore
        val[key] = this.sqlToJsValue(key, val[key]);
      }
    }
    this.events.emit("get", key, val);
    return val;
  }

  /**
   * Method to search for rows based on a partial key.
   *
   * @param searchCriteria - Partial entity to search for
   * @returns Promise resolving to an array of entities or undefined if not found
   */
  public async search(searchCriteria: Partial<Entity>): Promise<Entity[] | undefined> {
    await this.setupDatabase();
    const searchKeys = Object.keys(searchCriteria);
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

    // Verify columns in primary key or value schema
    const validColumns = [...this.primaryKeyColumns(), ...this.valueColumns()];
    // @ts-expect-error
    const invalidColumns = searchKeys.filter((key) => !validColumns.includes(key));
    if (invalidColumns.length > 0) {
      throw new Error(`Invalid columns in search criteria: ${invalidColumns.join(", ")}`);
    }

    let query = this.client.from(this.table).select("*");

    // Build the where clause from search criteria
    for (const [key, value] of Object.entries(searchCriteria)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      // Convert all columns from SQL to JS values
      for (const row of data) {
        for (const key in this.schema.properties) {
          // @ts-ignore
          row[key] = this.sqlToJsValue(key, row[key]);
        }
      }
      this.events.emit("search", searchCriteria, data as Entity[]);
      return data as Entity[];
    } else {
      this.events.emit("search", searchCriteria, undefined);
      return undefined;
    }
  }

  /**
   * Deletes a row from the database.
   *
   * @param value - The primary key object or entity to delete
   * @emits "delete" event with the key when successful
   */
  async delete(value: PrimaryKey | Entity): Promise<void> {
    await this.setupDatabase();
    const { key } = this.separateKeyValueFromCombined(value as Entity);

    let query = this.client.from(this.table).delete();

    // Build the where clause from primary key
    for (const pkName of this.primaryKeyNames) {
      query = query.eq(String(pkName), (key as any)[pkName]);
    }

    const { error } = await query;

    if (error) throw error;
    this.events.emit("delete", key as keyof Entity);
  }

  /**
   * Retrieves all entries from the database table
   * @returns Promise resolving to an array of entries or undefined if not found
   */
  async getAll(): Promise<Entity[] | undefined> {
    await this.setupDatabase();
    const { data, error } = await this.client.from(this.table).select("*");

    if (error) throw error;

    if (data && data.length) {
      // Convert all columns from SQL to JS values
      for (const row of data) {
        for (const key in this.schema.properties) {
          // @ts-ignore
          row[key] = this.sqlToJsValue(key, row[key]);
        }
      }
      return data as Entity[];
    }
    return undefined;
  }

  /**
   * Deletes all rows from the database table.
   * @emits "clearall" event when successful
   */
  async deleteAll(): Promise<void> {
    await this.setupDatabase();

    // Use the first primary key column for the delete condition
    const firstPkColumn = this.primaryKeyNames[0];
    const { error } = await this.client.from(this.table).delete().neq(String(firstPkColumn), null); // Delete all rows by using a condition that's always true

    if (error) throw error;
    this.events.emit("clearall");
  }

  /**
   * Returns the total number of rows in the database.
   *
   * @returns Promise resolving to the count of stored items
   */
  async size(): Promise<number> {
    await this.setupDatabase();
    const { count, error } = await this.client
      .from(this.table)
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
  }

  protected generateWhereClause(
    column: keyof Entity,
    operator: "=" | "<" | "<=" | ">" | ">=" = "="
  ): string {
    if (!(column in this.schema.properties)) {
      throw new Error(`Schema must have a ${String(column)} field to use deleteSearch`);
    }
    return `${String(column)} ${operator} $1`;
  }

  /**
   * Deletes all entries matching a search criteria
   * @param column - The column name to compare against
   * @param value - The value to compare against
   * @param operator - The operator to use for comparison
   */
  async deleteSearch(
    column: keyof Entity,
    value: Entity[keyof Entity],
    operator: "=" | "<" | "<=" | ">" | ">=" = "="
  ): Promise<void> {
    await this.setupDatabase();

    let query = this.client.from(this.table).delete();

    switch (operator) {
      case "=":
        query = query.eq(String(column), value);
        break;
      case "<":
        query = query.lt(String(column), value);
        break;
      case "<=":
        query = query.lte(String(column), value);
        break;
      case ">":
        query = query.gt(String(column), value);
        break;
      case ">=":
        query = query.gte(String(column), value);
        break;
    }

    const { error } = await query;

    if (error) throw error;
    this.events.emit("delete", column as keyof Entity);
  }
}
