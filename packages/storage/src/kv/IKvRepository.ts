import { EventEmitter, EventParameters } from "@ellmers/util";

//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/**
 * Type definitions for kv repository events
 */
export type KvEventListeners<Key, Value, Combined> = {
  put: (key: Key, value: Value) => void;
  get: (key: Key, value: Value | undefined) => void;
  getAll: (results: Combined[] | undefined) => void;
  delete: (key: unknown) => void;
  deleteall: () => void;
};

export type KvEventName = keyof KvEventListeners<any, any, any>;
export type KvEventListener<Event extends KvEventName, Key, Value, Combined> = KvEventListeners<
  Key,
  Value,
  Combined
>[Event];

export type KvEventParameters<Event extends KvEventName, Key, Value, Combined> = EventParameters<
  KvEventListeners<Key, Value, Combined>,
  Event
>;

/**
 * Schema definitions for primary keys and values
 */
export type BasicKeyType = string | number | bigint;
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

/**
 * Interface defining the contract for kv storage repositories.
 * Provides a flexible interface for storing and retrieving data with typed
 * primary keys and values, and supports compound keys and partial key lookup.
 *
 * @typeParam Key - Type for the primary key
 * @typeParam Value - Type for the value structure
 * @typeParam Combined - Combined type of Key & Value
 */
export interface IKvRepository<
  Key extends BasicKeyType = BasicKeyType,
  Value extends JSONValue = JSONValue,
  Combined = { key: Key; value: Value },
> {
  // Core methods
  put(key: Key, value: Value): Promise<void>;
  get(key: Key): Promise<Value | undefined>;
  delete(key: Key): Promise<void>;
  getAll(): Promise<Combined[] | undefined>;
  deleteAll(): Promise<void>;
  size(): Promise<number>;

  getObjectAsIdString(object: JSONValue): Promise<string>;

  // Event handling methods
  on<Event extends KvEventName>(
    name: Event,
    fn: KvEventListener<Event, Key, Value, Combined>
  ): void;
  off<Event extends KvEventName>(
    name: Event,
    fn: KvEventListener<Event, Key, Value, Combined>
  ): void;
  emit<Event extends KvEventName>(
    name: Event,
    ...args: KvEventParameters<Event, Key, Value, Combined>
  ): void;
  once<Event extends KvEventName>(
    name: Event,
    fn: KvEventListener<Event, Key, Value, Combined>
  ): void;
  emitted<Event extends KvEventName>(
    name: Event
  ): Promise<KvEventParameters<Event, Key, Value, Combined>>;
}
