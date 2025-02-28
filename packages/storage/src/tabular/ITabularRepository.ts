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
export type TabularEventListeners<Key, Combined> = {
  put: (entity: Combined) => void;
  get: (key: Key, entity: Combined | undefined) => void;
  search: (key: Partial<Combined>, entities: Combined[] | undefined) => void;
  delete: (key: Key) => void;
  clearall: () => void;
};

export type TabularEventName = keyof TabularEventListeners<any, any>;
export type TabularEventListener<
  Event extends TabularEventName,
  Key,
  Combined,
> = TabularEventListeners<Key, Combined>[Event];

export type TabularEventParameters<Event extends TabularEventName, Key, Combined> = EventParameters<
  TabularEventListeners<Key, Combined>,
  Event
>;

/**
 * Schema definitions for primary keys and values
 */
export type BasicKeyType = string | number | bigint;
export type BasicValueType = string | number | bigint | boolean | null;
export type BasePrimaryKeySchema = Record<string, "string" | "number" | "bigint">;
export type BaseValueSchema = Record<string, "string" | "number" | "boolean" | "bigint">;

/**
 * Interface defining the contract for tabular storage repositories.
 * Provides a flexible interface for storing and retrieving data with typed
 * primary keys and values, and supports compound keys and partial key lookup.
 *
 * @typeParam PrimaryKey - Type for the primary key structure
 * @typeParam Combined - Combined type of Key & Value
 */
export interface ITabularRepository<
  PrimaryKey extends Record<string, BasicKeyType>,
  Combined extends Record<string, BasicValueType>,
> {
  // Core methods
  put(value: Combined): Promise<void>;
  get(key: PrimaryKey): Promise<Combined | undefined>;
  delete(key: PrimaryKey | Combined): Promise<void>;
  getAll(): Promise<Combined[] | undefined>;
  deleteAll(): Promise<void>;
  size(): Promise<number>;

  // Event handling methods
  on<Event extends TabularEventName>(
    name: Event,
    fn: TabularEventListener<Event, PrimaryKey, Combined>
  ): void;
  off<Event extends TabularEventName>(
    name: Event,
    fn: TabularEventListener<Event, PrimaryKey, Combined>
  ): void;
  emit<Event extends TabularEventName>(
    name: Event,
    ...args: TabularEventParameters<Event, PrimaryKey, Combined>
  ): void;
  once<Event extends TabularEventName>(
    name: Event,
    fn: TabularEventListener<Event, PrimaryKey, Combined>
  ): void;
  emitted<Event extends TabularEventName>(
    name: Event
  ): Promise<TabularEventParameters<Event, PrimaryKey, Combined>>;

  // Convenience methods
  search(key: Partial<Combined>): Promise<Combined[] | undefined>;
}
