//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter } from "@ellmers/util";
import { makeFingerprint } from "@ellmers/util";
import {
  KvEventName,
  KvEventListener,
  KvEventListeners,
  KvEventParameters,
  IKvRepository,
  JSONValue,
} from "./IKvRepository";
import { TabularRepository } from "../tabular/TabularRepository";
import {
  DefaultPrimaryKeyType,
  DefaultValueType,
  BasicKeyType,
} from "../tabular/ITabularRepository";

/**
 * Abstract base class for key-value storage repositories.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export abstract class KvRepository<
  Key extends BasicKeyType = BasicKeyType,
  Value extends JSONValue = JSONValue,
  Combined = { key: Key; value: Value },
> implements IKvRepository<Key, Value, Combined>
{
  /** Event emitter for repository events */
  protected events = new EventEmitter<KvEventListeners<Key, Value, Combined>>();

  public abstract tabularRepository: TabularRepository;

  /**
   * Creates a new KvRepository instance
   */
  constructor(
    public primaryKeyType: "string" | "number" | "bigint" | "uuid4",
    public valueType: "string" | "number" | "bigint" | "json"
  ) {}

  /**
   * Stores a row in the repository.
   * @param key - The primary key
   * @param value - The value to store
   */
  public async put(key: Key, value: Value): Promise<void> {
    const tKey = { key } as DefaultPrimaryKeyType;
    let tValue: DefaultValueType;
    if (this.valueType === "json") {
      tValue = { value: JSON.stringify(value) } as DefaultValueType;
    } else {
      tValue = { value } as DefaultValueType;
    }
    return await this.tabularRepository.putKeyValue(tKey, tValue);
  }

  /**
   * Retrieves a value by its key.
   * This is a convenience method that automatically converts simple types to structured format if using default schema.
   *
   * @param key - Primary key to look up (basic key like default schema)
   * @returns The stored value or undefined if not found
   */
  public async get(key: Key): Promise<Value | undefined> {
    const result = await this.tabularRepository.getKeyValue({ key } as DefaultPrimaryKeyType);
    if (result) {
      if (this.valueType === "json") {
        return JSON.parse(result.value) as Value;
      } else {
        return result.value as Value;
      }
    } else {
      return undefined;
    }
  }

  /**
   * Deletes a row from the repository.
   * @param key - The primary key of the row to delete
   */
  public async delete(key: Key): Promise<void> {
    return await this.tabularRepository.deleteKeyValue({ key } as DefaultPrimaryKeyType);
  }

  /**
   * Retrieves all rows from the repository.
   * @returns An array of all rows in the repository or undefined if empty
   */
  public async getAll(): Promise<Combined[] | undefined> {
    const values = await this.tabularRepository.getAll();
    if (values) {
      return values.map(
        (value) =>
          ({
            key: value.key,
            value: this.valueType === "json" ? JSON.parse(value.value) : value.value,
          }) as Combined
      );
    }
  }

  /**
   * Deletes all rows from the repository.
   */
  public async deleteAll(): Promise<void> {
    return await this.tabularRepository.deleteAll();
  }

  /**
   * Retrieves the number of rows in the repository.
   * @returns The number of rows in the repository
   */
  public async size(): Promise<number> {
    return await this.tabularRepository.size();
  }

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
  emitted<Event extends KvEventName>(
    name: Event
  ): Promise<KvEventParameters<Event, Key, Value, Combined>> {
    return this.events.emitted(name) as Promise<KvEventParameters<Event, Key, Value, Combined>>;
  }
}
