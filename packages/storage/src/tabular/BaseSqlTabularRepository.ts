//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Static, TObject, TSchema } from "@sinclair/typebox";
import { ExtractPrimaryKey, ExtractValue, ValueOptionType } from "./ITabularRepository";
import { TabularRepository } from "./TabularRepository";

// BaseTabularRepository is a tabular store that uses SQLite and Postgres use as common code

/**
 * Base class for SQL-based tabular repositories that implements common functionality
 * for both SQLite and PostgreSQL database implementations.
 *
 * @template Schema - The schema definition for the entity using TypeBox
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export abstract class BaseSqlTabularRepository<
  Schema extends TObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Static<Schema>>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = Static<Schema>,
  Value = ExtractValue<Schema, PrimaryKeyNames>,
> extends TabularRepository<Schema, PrimaryKeyNames, PrimaryKey, Entity, Value> {
  /**
   * Creates a new instance of BaseSqlTabularRepository
   * @param table - The name of the database table to use for storage
   * @param schema - Schema defining the structure of the entity
   * @param primaryKeyNames - Array of property names that form the primary key
   * @param indexes - Array of columns or column arrays to make searchable. Each string or single column creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    protected readonly table: string = "tabular_store",
    schema: Schema,
    primaryKeyNames: PrimaryKeyNames,
    indexes: Array<keyof Entity | Array<keyof Entity>> = []
  ) {
    super(schema, primaryKeyNames, indexes);
    this.validateTableAndSchema();
  }

  /**
   * Maps JavaScript/TypeScript types to their corresponding SQL type
   * Must be implemented by derived classes for specific SQL dialects
   */
  protected abstract mapTypeToSQL(typeDef: TSchema): string;

  /**
   * Generates the SQL column definitions for primary key fields
   * @returns SQL string containing primary key column definitions
   */
  protected constructPrimaryKeyColumns($delimiter: string = ""): string {
    const cols = Object.entries<TSchema>(this.primaryKeySchema.properties)
      .map(([key, typeDef]) => {
        const sqlType = this.mapTypeToSQL(typeDef);
        return `${$delimiter}${key}${$delimiter} ${sqlType} NOT NULL`;
      })
      .join(", ");
    return cols;
  }

  /**
   * Generates the SQL column definitions for value fields
   * @returns SQL string containing value column definitions
   */
  protected constructValueColumns($delimiter: string = ""): string {
    const cols = Object.entries<TSchema>(this.valueSchema.properties)
      .map(([key, typeDef]) => {
        const sqlType = this.mapTypeToSQL(typeDef);
        // Check if the property is nullable based on schema definition
        const nullable = this.isNullable(typeDef);
        return `${$delimiter}${key}${$delimiter} ${sqlType}${nullable ? " NULL" : " NOT NULL"}`;
      })
      .join(", ");
    if (cols.length > 0) {
      return `, ${cols}`;
    } else {
      return "";
    }
  }

  /**
   * Determines if a schema type allows null values
   * @param typeDef - The schema type definition
   * @returns true if the type allows null values
   */
  protected isNullable(typeDef: TSchema): boolean {
    // Check for union types that include null
    if (typeDef.anyOf && Array.isArray(typeDef.anyOf)) {
      return typeDef.anyOf.some((type: any) => type.type === "null");
    }

    // Check for TypeBox Optional/ReadonlyOptional types
    if (typeDef.kind === "Optional" || typeDef.kind === "ReadonlyOptional") {
      return true;
    }

    // Check for nullable keyword if it exists
    if ("nullable" in typeDef && typeDef.nullable === true) {
      return true;
    }

    return false;
  }

  /**
   * Returns a comma-separated list of primary key column names
   * @returns Formatted string of primary key column names
   */
  protected primaryKeyColumnList($delimiter: string = ""): string {
    return $delimiter + this.primaryKeyColumns().join(`${$delimiter}, ${$delimiter}`) + $delimiter;
  }

  /**
   * Returns a comma-separated list of value column names
   * @returns Formatted string of value column names
   */
  protected valueColumnList($delimiter: string = ""): string {
    return $delimiter + this.valueColumns().join(`${$delimiter}, ${$delimiter}`) + $delimiter;
  }

  /**
   * Gets the real underlying type from possibly union types
   * For example, for Type.Union([Type.String(), Type.Null()]), this extracts the String type
   * @param typeDef - The schema to extract from
   * @returns The non-null type from the schema
   */
  protected getNonNullType(typeDef: TSchema): TSchema {
    if (typeDef.anyOf && Array.isArray(typeDef.anyOf)) {
      const nonNullType = typeDef.anyOf.find((t: any) => t.type !== "null");
      if (nonNullType) {
        return nonNullType;
      }
    }
    return typeDef;
  }

  /**
   * Converts a value object into an ordered array based on the valueSchema
   * This ensures consistent parameter ordering for SQL queries
   * @param value - The value object to convert
   * @returns Array of values ordered according to the schema
   * @throws Error if a required field is missing
   */
  protected getValueAsOrderedArray(value: Value): ValueOptionType[] {
    const orderedParams: ValueOptionType[] = [];
    const valueAsRecord = value as Record<string, Entity[keyof Entity]>;
    for (const key in this.valueSchema.properties) {
      if (Object.prototype.hasOwnProperty.call(valueAsRecord, key)) {
        orderedParams.push(this.jsToSqlValue(key, valueAsRecord[key]));
      } else {
        throw new Error(`Missing required value field: ${key}`);
      }
    }
    return orderedParams;
  }

  /**
   * Converts a primary key object into an ordered array based on the schema
   * This ensures consistent parameter ordering for storage operations
   * @param key - The primary key object to convert
   * @returns Array of key values ordered according to the schema
   */
  protected getPrimaryKeyAsOrderedArray(key: PrimaryKey): ValueOptionType[] {
    const orderedParams: ValueOptionType[] = [];
    const keyObj = key as Record<string, Entity[keyof Entity]>;
    for (const k of Object.keys(this.primaryKeySchema.properties)) {
      if (k in keyObj) {
        const value = keyObj[k];
        if (value === null) {
          throw new Error(`Primary key field ${k} cannot be null`);
        }
        orderedParams.push(this.jsToSqlValue(k, value));
      } else {
        throw new Error(`Missing required primary key field: ${k}`);
      }
    }
    return orderedParams;
  }

  protected jsToSqlValue(column: string, value: Entity[keyof Entity]): ValueOptionType {
    const typeDef = this.schema.properties[column];
    if (!typeDef) {
      return value as ValueOptionType;
    }

    // Handle null values for nullable columns
    if (value === null && this.isNullable(typeDef)) {
      return null;
    }

    // Extract the non-null type for proper handling
    const actualType = this.getNonNullType(typeDef);

    if (actualType.contentEncoding === "blob") {
      return Buffer.from(value as Uint8Array);
    } else if (value instanceof Date) {
      // Convert all Date objects to ISO string regardless of type definition
      return value.toISOString();
    } else {
      return value as ValueOptionType;
    }
  }

  protected sqlToJsValue(column: string, value: ValueOptionType): Entity[keyof Entity] {
    // Get the type definition
    const typeDef = this.schema.properties[column];
    if (!typeDef) {
      return value as Entity[keyof Entity];
    }

    // Handle null values
    if (value === null && this.isNullable(typeDef)) {
      return null as any;
    }

    // Extract the non-null type for proper handling
    const actualType = this.getNonNullType(typeDef);

    if (actualType.contentEncoding === "blob" && value instanceof Buffer) {
      return new Uint8Array(value) as Entity[keyof Entity];
    } else {
      return value as Entity[keyof Entity];
    }
  }

  /**
   * Validates table name and schema configurations
   * Checks for:
   * 1. Valid table name format
   * 2. Valid schema key names
   * 3. No duplicate keys between primary key and value schemas
   * This is a sanity check to make sure the table and schema are valid,
   * and to prevent dumb mistakes and mischevious behavior.
   * @throws Error if validation fails
   */
  protected validateTableAndSchema(): void {
    // Validate table name
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(this.table)) {
      throw new Error(
        "Table name must start with a letter and contain only letters, digits, and underscores, got: " +
          this.table
      );
    }

    // Validate schema keys
    const validateSchemaKeys = (schema: TObject) => {
      for (const key in schema.properties) {
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
          throw new Error(
            "Schema keys must start with a letter and contain only letters, digits, and underscores, got: " +
              key
          );
        }
      }
    };

    validateSchemaKeys(this.primaryKeySchema);
    validateSchemaKeys(this.valueSchema);

    // Check for key name collisions between schemas
    const primaryKeys = new Set(Object.keys(this.primaryKeySchema.properties));
    const valueKeys = Object.keys(this.valueSchema.properties);
    const duplicates = valueKeys.filter((key) => primaryKeys.has(key));
    if (duplicates.length > 0) {
      throw new Error(`Duplicate keys found in schemas: ${duplicates.join(", ")}`);
    }
  }
}
