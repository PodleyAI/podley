//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  BasePrimaryKeySchema,
  BaseValueSchema,
  DefaultPrimaryKeySchema,
  DefaultPrimaryKeyType,
  DefaultValueSchema,
  DefaultValueType,
  BasicKeyType,
  BasicValueType,
} from "./IKVRepository";
import { KVRepository } from "./KVRepository";

// BaseKVRepository is a key-value store that uses SQLite and Postgres use as common code

/**
 * Base class for SQL-based key-value repositories that implements common functionality
 * for both SQLite and PostgreSQL database implementations.
 *
 * @template Key - The type of the primary key object, must be a record of basic types
 * @template Value - The type of the value object being stored
 * @template PrimaryKeySchema - Schema definition for the primary key
 * @template ValueSchema - Schema definition for the value
 * @template Combined - Combined type of Key & Value in case just combining them is not enough
 */
export abstract class BaseSqlKVRepository<
  Key extends Record<string, BasicKeyType> = DefaultPrimaryKeyType,
  Value extends Record<string, any> = DefaultValueType,
  PrimaryKeySchema extends BasePrimaryKeySchema = typeof DefaultPrimaryKeySchema,
  ValueSchema extends BaseValueSchema = typeof DefaultValueSchema,
  Combined extends Record<string, any> = Key & Value,
> extends KVRepository<Key, Value, PrimaryKeySchema, ValueSchema, Combined> {
  /**
   * Creates a new instance of BaseSqlKVRepository
   * @param table - The name of the database table to use for storage
   * @param primaryKeySchema - Schema defining the structure of the primary key
   * @param valueSchema - Schema defining the structure of the stored values
   * @param searchable - Array of columns or column arrays to make searchable. Each string creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   */
  constructor(
    protected readonly table: string = "kv_store",
    primaryKeySchema: PrimaryKeySchema = DefaultPrimaryKeySchema as PrimaryKeySchema,
    valueSchema: ValueSchema = DefaultValueSchema as ValueSchema,
    searchable: Array<keyof Combined | Array<keyof Combined>> = []
  ) {
    super(primaryKeySchema, valueSchema, searchable);
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
    return cols;
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
  protected getValueAsOrderedArray(value: Value): BasicValueType[] {
    const orderedParams: BasicValueType[] = [];
    for (const [key, type] of Object.entries(this.valueSchema)) {
      if (key in value) {
        orderedParams.push(value[key]);
      } else {
        throw new Error(`Missing required value field: ${key}`);
      }
    }
    return orderedParams;
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
    // Check for invalid characters in table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(this.table)) {
      throw new Error(
        `Invalid table name: ${this.table}. Must start with letter/underscore and contain only alphanumeric/underscore characters`
      );
    }

    // Validate schema key naming
    const validateSchemaKeys = (schema: Record<string, any>) => {
      Object.keys(schema).forEach((key) => {
        if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key)) {
          throw new Error(
            `Invalid schema key: ${key}. Must start with letter/underscore and contain only alphanumeric/underscore characters`
          );
        }
      });
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
