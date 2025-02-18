import { EventEmitter, EventParameters } from "@ellmers/util";

//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/**
 * Type definitions for key-value repository events
 */
export type KVEventListeners<Key, Value, Combined> = {
  put: (key: unknown, value: Value) => void;
  get: (key: unknown, value: Value | undefined) => void;
  search: (key: Partial<Combined>, results: Combined[] | undefined) => void;
  delete: (key: unknown) => void;
  clearall: () => void;
};

export type KVEventName = keyof KVEventListeners<any, any, any>;
export type KVEventListener<Event extends KVEventName, Key, Value, Combined> = KVEventListeners<
  Key,
  Value,
  Combined
>[Event];

export type KVEventParameters<Event extends KVEventName, Key, Value, Combined> = EventParameters<
  KVEventListeners<Key, Value, Combined>,
  Event
>;

/**
 * Schema definitions for primary keys and values
 */
export type BasicKeyType = string | number | bigint;
export type BasicValueType = string | number | bigint | boolean | null;
export type BasePrimaryKeySchema = Record<string, "string" | "number" | "boolean" | "bigint">;
export type BaseValueSchema = Record<string, "string" | "number" | "boolean" | "bigint">;

/**
 * Default schema types for simple string key-value pairs
 */
export type DefaultPrimaryKeyType = { key: string };
export const DefaultPrimaryKeySchema: BasePrimaryKeySchema = { key: "string" } as const;

export type DefaultValueType = { value: string };
export const DefaultValueSchema: BaseValueSchema = { value: "string" } as const;

/**
 * Interface defining the contract for key-value storage repositories.
 * Provides a flexible interface for storing and retrieving data with typed
 * keys and values, and supports compound keys and partial key lookup.
 *
 * @typeParam Key - Type for the primary key structure
 * @typeParam Value - Type for the value structure
 * @typeParam PrimaryKeySchema - Schema definition for the primary key
 * @typeParam ValueSchema - Schema definition for the value
 * @typeParam Combined - Combined type of Key & Value
 */
export interface IKVRepository<
  Key extends Record<string, BasicKeyType> = DefaultPrimaryKeyType,
  Value extends Record<string, any> = DefaultValueType,
  Combined extends Record<string, any> = Key & Value,
> {
  // Core methods
  putKeyValue(key: Key, value: Value): Promise<void>;
  getKeyValue(key: Key): Promise<Value | undefined>;
  deleteKeyValue(key: Key | Combined): Promise<void>;
  getAll(): Promise<Combined[] | undefined>;
  deleteAll(): Promise<void>;
  size(): Promise<number>;

  // Event handling methods
  on<Event extends KVEventName>(
    name: Event,
    fn: KVEventListener<Event, Key, Value, Combined>
  ): void;
  off<Event extends KVEventName>(
    name: Event,
    fn: KVEventListener<Event, Key, Value, Combined>
  ): void;
  emit<Event extends KVEventName>(
    name: Event,
    ...args: KVEventParameters<Event, Key, Value, Combined>
  ): void;
  once<Event extends KVEventName>(
    name: Event,
    fn: KVEventListener<Event, Key, Value, Combined>
  ): void;
  emitted<Event extends KVEventName>(
    name: Event
  ): Promise<KVEventParameters<Event, Key, Value, Combined>>;

  // Convenience methods
  put(key: BasicKeyType, value: BasicValueType): Promise<void>;
  get(key: BasicKeyType): Promise<BasicValueType | undefined>;
  search(key: Partial<Combined>): Promise<Combined[] | undefined>;
  getCombined(key: Key): Promise<Combined | undefined>;
  delete(key: Key | BasicKeyType): Promise<void>;
}
