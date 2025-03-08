import { EventEmitter, EventParameters } from "@ellmers/util";

//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/**
 * Type definitions for tabular repository events
 */
export type TabularEventListeners<PrimaryKey, Entity> = {
  put: (entity: Entity) => void;
  get: (key: PrimaryKey, entity: Entity | undefined) => void;
  search: (key: Partial<Entity>, entities: Entity[] | undefined) => void;
  delete: (key: PrimaryKey) => void;
  clearall: () => void;
};

export type TabularEventName = keyof TabularEventListeners<any, any>;
export type TabularEventListener<
  Event extends TabularEventName,
  PrimaryKey,
  Entity,
> = TabularEventListeners<PrimaryKey, Entity>[Event];

export type TabularEventParameters<
  Event extends TabularEventName,
  PrimaryKey,
  Entity,
> = EventParameters<TabularEventListeners<PrimaryKey, Entity>, Event>;

// Helper type to map schema types to their actual types
export type MapSchemaTypes<T extends keyof SchemaTypeMap> = SchemaTypeMap[T];

// Type definitions for specialized string types
export type uuid4 = string;
export type uuid7 = string;
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// Type mapping from schema type strings to actual types
export type SchemaTypeMap = {
  uuid4: uuid4;
  uuid7: uuid7;
  string: string;
  number: number;
  bigint: bigint;
  boolean: boolean;
  null: null;
  json: JSONValue;
  date: Date;
};

export type KeyOption = "string" | "number" | "bigint" | "uuid4" | "uuid7";
export type KeySchema = Record<string, KeyOption>;
export type KeyOptionType = MapSchemaTypes<KeyOption>;

export type ValueOption = KeyOption | "boolean" | "null" | "json" | "date";
export type ValueSchema = Record<string, ValueOption>;
export type ValueOptionType = MapSchemaTypes<ValueOption>;

// Type to map schema to TypeScript types
export type SchemaToType<T extends Record<string, keyof SchemaTypeMap>> = {
  [K in keyof T]: MapSchemaTypes<T[K]>;
};

// Extract primary key type
export type ExtractPrimaryKey<
  T extends Record<string, keyof SchemaTypeMap>,
  K extends ReadonlyArray<keyof T>,
> = {
  [P in K[number]]: MapSchemaTypes<T[P]>;
};

// Extract value type (everything except the primary key)
export type ExtractValue<
  T extends Record<string, keyof SchemaTypeMap>,
  K extends ReadonlyArray<keyof T>,
> = Omit<SchemaToType<T>, K[number]>;

/**
 * Interface defining the contract for tabular storage repositories.
 * Provides a flexible interface for storing and retrieving data with typed
 * primary keys and values, and supports compound keys and partial key lookup.
 *
 * @typeParam Schema - The schema definition for the entity
 * @typeParam PrimaryKeyNames - Array of property names that form the primary key
 */
export interface ITabularRepository<
  Schema extends ValueSchema,
  PrimaryKeyNames extends ReadonlyArray<keyof Schema> = ReadonlyArray<keyof Schema>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = SchemaToType<Schema>,
> {
  // Core methods
  put(value: Entity): Promise<void>;
  get(key: PrimaryKey): Promise<Entity | undefined>;
  delete(key: PrimaryKey | Entity): Promise<void>;
  getAll(): Promise<Entity[] | undefined>;
  deleteAll(): Promise<void>;
  size(): Promise<number>;

  // Event handling methods
  on<Event extends TabularEventName>(
    name: Event,
    fn: TabularEventListener<Event, PrimaryKey, Entity>
  ): void;
  off<Event extends TabularEventName>(
    name: Event,
    fn: TabularEventListener<Event, PrimaryKey, Entity>
  ): void;
  emit<Event extends TabularEventName>(
    name: Event,
    ...args: TabularEventParameters<Event, PrimaryKey, Entity>
  ): void;
  once<Event extends TabularEventName>(
    name: Event,
    fn: TabularEventListener<Event, PrimaryKey, Entity>
  ): void;
  waitOn<Event extends TabularEventName>(
    name: Event
  ): Promise<TabularEventParameters<Event, PrimaryKey, Entity>>;

  // Convenience methods
  search(key: Partial<Entity>): Promise<Entity[] | undefined>;
}
