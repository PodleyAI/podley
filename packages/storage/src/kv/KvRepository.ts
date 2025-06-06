//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, EventEmitter, makeFingerprint } from "@podley/util";
import { TAny, TNumber, TSchema, TString, Type } from "@sinclair/typebox";
import { JSONValue } from "../tabular/ITabularRepository";
import {
  IKvRepository,
  KvEventListener,
  KvEventListeners,
  KvEventName,
  KvEventParameters,
} from "./IKvRepository";

export const KV_REPOSITORY =
  createServiceToken<IKvRepository<any, any, any>>("storage.kvRepository");

/**
 * Abstract base class for key-value storage repositories.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export abstract class KvRepository<
  Key extends string = string,
  Value extends any = any,
  Combined = { key: Key; value: Value },
> implements IKvRepository<Key, Value, Combined>
{
  /** Event emitter for repository events */
  protected events = new EventEmitter<KvEventListeners<Key, Value, Combined>>();

  /**
   * Creates a new KvRepository instance
   */
  constructor(
    public keySchema: TSchema = Type.String(),
    public valueSchema: TSchema = Type.Any()
  ) {}

  /**
   * Stores a row in the repository.
   * @param key - The primary key
   * @param value - The value to store
   */
  abstract put(key: Key, value: Value): Promise<void>;

  /**
   * Stores multiple rows in the repository in a bulk operation.
   * @param items - Array of key-value pairs to store
   */
  abstract putBulk(items: Array<{ key: Key; value: Value }>): Promise<void>;

  /**
   * Retrieves a value by its key.
   * This is a convenience method that automatically converts simple types to structured format if using default schema.
   *
   * @param key - Primary key to look up (basic key like default schema)
   * @returns The stored value or undefined if not found
   */
  abstract get(key: Key): Promise<Value | undefined>;

  /**
   * Deletes a row from the repository.
   * @param key - The primary key of the row to delete
   */
  abstract delete(key: Key): Promise<void>;

  /**
   * Retrieves all rows from the repository.
   * @returns An array of all rows in the repository or undefined if empty
   */
  abstract getAll(): Promise<Combined[] | undefined>;

  /**
   * Deletes all rows from the repository.
   */
  abstract deleteAll(): Promise<void>;

  /**
   * Retrieves the number of rows in the repository.
   * @returns The number of rows in the repository
   */
  abstract size(): Promise<number>;

  /**
   * Generates a consistent string identifier for a given key.
   *
   * @param object - Object to convert
   * @returns Promise resolving to a string fingerprint of the object for use as an id
   */
  public async getObjectAsIdString(object: JSONValue): Promise<string> {
    return await makeFingerprint(object);
  }

  /**
   * Adds an event listener for a specific event
   * @param name The name of the event to listen for
   * @param fn The callback function to execute when the event occurs
   */
  on<Event extends KvEventName>(name: Event, fn: KvEventListener<Event, Key, Value, Combined>) {
    this.events.on(name, fn);
  }

  /**
   * Removes an event listener for a specific event
   * @param name The name of the event to remove the listener from
   * @param fn The callback function to remove
   */
  off<Event extends KvEventName>(name: Event, fn: KvEventListener<Event, Key, Value, Combined>) {
    this.events.off(name, fn);
  }

  /**
   * Adds an event listener that will only be called once
   * @param name The name of the event to listen for
   * @param fn The callback function to execute when the event occurs
   */
  once<Event extends KvEventName>(name: Event, fn: KvEventListener<Event, Key, Value, Combined>) {
    this.events.once(name, fn);
  }

  /**
   * Emits an event with the specified name and arguments
   * @param name The name of the event to emit
   * @param args The arguments to pass to the event listeners
   */
  emit<Event extends KvEventName>(
    name: Event,
    ...args: KvEventParameters<Event, Key, Value, Combined>
  ) {
    this.events.emit(name, ...args);
  }

  /**
   * Returns when the event was emitted (promise form of once)
   * @param name The name of the event to check
   * @returns true if the event has listeners, false otherwise
   */
  waitOn<Event extends KvEventName>(
    name: Event
  ): Promise<KvEventParameters<Event, Key, Value, Combined>> {
    return this.events.waitOn(name) as Promise<KvEventParameters<Event, Key, Value, Combined>>;
  }
}
