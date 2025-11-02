//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters } from "@podley/util";
import { Static, TObject } from "typebox";

// Generic type for possible value types in the repository
export type ValueOptionType = string | number | bigint | boolean | null | Uint8Array;

/**
 * Type definitions for tabular repository events
 */
export type TabularEventListeners<PrimaryKey, Entity> = {
  put: (entity: Entity) => void;
  get: (key: PrimaryKey, entity: Entity | undefined) => void;
  search: (key: Partial<Entity>, entities: Entity[] | undefined) => void;
  delete: (key: keyof Entity) => void;
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

// Type definitions for specialized string types
export type uuid4 = string;
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// Extract primary key type from TypeBox schema
export type ExtractPrimaryKey<T extends TObject, K extends ReadonlyArray<keyof Static<T>>> = {
  [P in K[number]]: Static<T>[P];
};

// Extract value type from TypeBox schema (everything except the primary key)
export type ExtractValue<T extends TObject, K extends ReadonlyArray<keyof Static<T>>> = Omit<
  Static<T>,
  K[number]
>;

/**
 * Interface defining the contract for tabular storage repositories.
 * Provides a flexible interface for storing and retrieving data with typed
 * primary keys and values, and supports compound keys and partial key lookup.
 *
 * @typeParam Schema - The schema definition for the entity using TypeBox
 * @typeParam PrimaryKeyNames - Array of property names that form the primary key
 */
export interface ITabularRepository<
  Schema extends TObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Static<Schema>> = ReadonlyArray<keyof Static<Schema>>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = Static<Schema>,
> {
  // Core methods
  put(value: Entity): Promise<Entity>;
  putBulk(values: Entity[]): Promise<Entity[]>;
  get(key: PrimaryKey): Promise<Entity | undefined>;
  delete(key: PrimaryKey | Entity): Promise<void>;
  getAll(): Promise<Entity[] | undefined>;
  deleteAll(): Promise<void>;
  size(): Promise<number>;
  deleteSearch(
    column: keyof Entity,
    value: Entity[keyof Entity],
    operator: "=" | "<" | "<=" | ">" | ">="
  ): Promise<void>;

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

  // Destroy the repository and frees up resources.
  destroy(): void;
  [Symbol.dispose](): void;
  [Symbol.asyncDispose](): Promise<void>;
}
