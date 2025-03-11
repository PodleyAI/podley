//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  ValueSchema,
  ValueOptionType,
  ExtractPrimaryKey,
  ExtractValue,
  SchemaToType,
  ExcludeDateKeyOptionType,
  ExcludeDateValueOptionType,
} from "./ITabularRepository";
import { TabularRepository } from "./TabularRepository";

// BaseTabularRepository is a tabular store that uses SQLite and Postgres use as common code

/**
 * Base class for SQL-based tabular repositories that implements common functionality
 * for both SQLite and PostgreSQL database implementations.
 *
 * @template Schema - The schema definition for the entity
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export abstract class BaseSqlTabularRepository<
  Schema extends ValueSchema,
  PrimaryKeyNames extends ReadonlyArray<keyof Schema>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = SchemaToType<Schema>,
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
  protected abstract mapTypeToSQL(type: string): string;

  /**
   * Generates the SQL column definitions for primary key fields
   * @returns SQL string containing primary key column definitions
   */
  protected constructPrimaryKeyColumns($delimiter: string = ""): string {
    const cols = Object.entries(this.primaryKeySchema)
      .map(([key, type]) => {
        const sqlType = this.mapTypeToSQL(type);
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
    const cols = Object.entries(this.valueSchema)
      .map(([key, type]) => {
        const sqlType = this.mapTypeToSQL(type);
        return `${$delimiter}${key}${$delimiter} ${sqlType} NULL`;
      })
      .join(", ");
    if (cols.length > 0) {
      return `, ${cols}`;
    } else {
      return "";
    }
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
   * Converts a value object into an ordered array based on the valueSchema
   * This ensures consistent parameter ordering for SQL queries
   * @param value - The value object to convert
   * @returns Array of values ordered according to the schema
   * @throws Error if a required field is missing
   */
  protected getValueAsOrderedArray(value: Value): ValueOptionType[] {
    const orderedParams: ValueOptionType[] = [];
    // Use a type assertion to ensure TypeScript recognizes value as an object with string keys
    const valueAsRecord = value as Record<string, ValueOptionType>;
    for (const [key, type] of Object.entries(this.valueSchema)) {
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
  protected getPrimaryKeyAsOrderedArray(key: PrimaryKey): ExcludeDateKeyOptionType[] {
    const orderedParams: ExcludeDateKeyOptionType[] = [];
    const keyObj = key as Record<string, ExcludeDateKeyOptionType>;
    for (const [k, type] of Object.entries(this.primaryKeySchema)) {
      if (k in keyObj) {
        const value = keyObj[k];
        if (value === null) {
          throw new Error(`Primary key field ${k} cannot be null`);
        }
        orderedParams.push(this.jsToSqlValue(k, value) as ExcludeDateKeyOptionType);
      } else {
        throw new Error(`Missing required primary key field: ${k}`);
      }
    }
    return orderedParams;
  }

  protected jsToSqlValue(column: string, value: ValueOptionType): ExcludeDateValueOptionType {
    if (this.valueSchema[column] === "blob" && typeof value === "string") {
      return Buffer.from(value);
    } else if (this.valueSchema[column] === "date" && value instanceof Date) {
      return value.toISOString();
    } else {
      return value as ExcludeDateValueOptionType;
    }
  }

  protected sqlToJsValue(column: string, value: ExcludeDateValueOptionType): ValueOptionType {
    if (this.valueSchema[column] === "blob" && value instanceof Buffer) {
      return new Uint8Array(value);
    } else if (this.valueSchema[column] === "date" && typeof value === "string") {
      return new Date(value);
    } else {
      return value;
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
    const validateSchemaKeys = (schema: Record<string, any>) => {
      for (const key of Object.keys(schema)) {
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
    const primaryKeys = new Set(Object.keys(this.primaryKeySchema));
    const valueKeys = Object.keys(this.valueSchema);
    const duplicates = valueKeys.filter((key) => primaryKeys.has(key));
    if (duplicates.length > 0) {
      throw new Error(`Duplicate keys found in schemas: ${duplicates.join(", ")}`);
    }
  }
}
