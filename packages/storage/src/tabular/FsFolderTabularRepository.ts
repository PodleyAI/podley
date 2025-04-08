//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import path from "node:path";
import { readFile, writeFile, rm, readdir } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { glob } from "glob";
import {
  ValueSchema,
  ExtractPrimaryKey,
  ExtractValue,
  SchemaToType,
  ITabularRepository,
  ValueOptionType,
} from "./ITabularRepository";
import { TabularRepository } from "./TabularRepository";
import { sleep } from "@ellmers/util";
import { createServiceToken } from "@ellmers/util";

export const FS_FOLDER_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.fsFolder"
);

/**
 * A tabular repository implementation that uses the filesystem for storage.
 * Each row is stored as a separate JSON file in the specified directory.
 *
 * @template Schema - The schema definition for the entity
 * @template PrimaryKeyNames - Array of property names that form the primary key
 */
export class FsFolderTabularRepository<
  Schema extends ValueSchema,
  PrimaryKeyNames extends ReadonlyArray<keyof Schema>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = SchemaToType<Schema>,
  Value = ExtractValue<Schema, PrimaryKeyNames>,
> extends TabularRepository<Schema, PrimaryKeyNames, PrimaryKey, Entity, Value> {
  private folderPath: string;

  /**
   * Creates a new FsFolderTabularRepository instance.
   *
   * @param folderPath - The directory path where the JSON files will be stored
   * @param schema - Schema defining the structure of the entity
   * @param primaryKeyNames - Array of property names that form the primary key
   * @param indexes - Note: indexes are not supported in this implementation.
   */
  constructor(
    folderPath: string,
    schema: Schema,
    primaryKeyNames: PrimaryKeyNames,
    indexes: Array<keyof Entity | Array<keyof Entity>> = []
  ) {
    super(schema, primaryKeyNames, indexes);
    this.folderPath = path.join(folderPath);
    try {
      mkdirSync(this.folderPath, { recursive: true });
    } catch (error) {
      // CI system sometimes has issues temporarily
      setTimeout(() => {
        mkdirSync(this.folderPath, { recursive: true });
      }, 0);
    }
  }

  /**
   * Stores a row in the repository
   * @param key - The primary key object
   * @param value - The value object to store
   * @emits 'put' event when successful
   */
  async put(entity: Entity): Promise<void> {
    const filePath = await this.getFilePath(entity);
    try {
      await writeFile(filePath, JSON.stringify(entity));
    } catch (error) {
      try {
        // CI system sometimes has issues temporarily
        await sleep(1);
        await writeFile(filePath, JSON.stringify(entity));
      } catch (error) {
        console.error("Error writing file", filePath, error);
      }
    }
    this.events.emit("put", entity);
  }

  /**
   * Retrieves a value by its key
   * @param key - The primary key object to look up
   * @returns The value object if found, undefined otherwise
   * @emits 'get' event with the fingerprint ID and value when found
   */
  async get(key: PrimaryKey): Promise<Entity | undefined> {
    const filePath = await this.getFilePath(key);
    try {
      const data = await readFile(filePath, "utf-8");
      const entity = JSON.parse(data) as Entity;
      this.events.emit("get", key, entity);
      return entity;
    } catch (error) {
      this.events.emit("get", key, undefined);
      return undefined; // File not found or read error
    }
  }

  /**
   * Deletes an entry by its key
   * @param key - The primary key object of the entry to delete
   * @emits 'delete' event with the fingerprint ID when successful
   */
  async delete(value: PrimaryKey | Entity): Promise<void> {
    const { key } = this.separateKeyValueFromCombined(value as Entity);
    const filePath = await this.getFilePath(key);
    try {
      await rm(filePath);
    } catch (error) {
      console.error("Error deleting file", filePath, error);
    }
    this.events.emit("delete", key as keyof Entity);
  }

  /**
   * Retrieves all rows stored in the repository
   * @returns Array of combined objects (rows) if found, undefined otherwise
   */
  async getAll(): Promise<Entity[] | undefined> {
    try {
      const files = await readdir(this.folderPath);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));
      if (jsonFiles.length === 0) {
        return undefined;
      }
      const results = await Promise.allSettled(
        jsonFiles.map(async (file) => {
          const content = await readFile(path.join(this.folderPath, file), "utf-8");
          const data = JSON.parse(content) as Entity;
          return data;
        })
      );

      const values = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      return values.length > 0 ? values : undefined;
    } catch (error) {
      console.error("Error in getAll:", error);
      throw error;
    }
  }

  /**
   * Removes all entries from the repository
   * @emits 'clearall' event when successful
   */
  async deleteAll(): Promise<void> {
    // Delete all files in the folder ending in .json
    await rm(this.folderPath, { recursive: true, force: true });
    this.events.emit("clearall");
  }

  /**
   * Returns the total number of stored rows
   * @returns Promise resolving to the count of stored items
   */
  async size(): Promise<number> {
    // Count all files in the folder ending in .json
    const globPattern = path.join(this.folderPath, "*.json");
    const files = await glob(globPattern);
    return files.length;
  }

  /**
   * Search is not supported in the filesystem implementation.
   * @throws {Error} Always throws an error indicating search is not supported
   */
  async search(key: Partial<Entity>): Promise<Entity[] | undefined> {
    throw new Error("Search not supported for FsFolderTabularRepository");
  }

  /**
   * Generates the full filesystem path for a given key.
   * @private
   */
  private async getFilePath(value: PrimaryKey | Entity): Promise<string> {
    const { key } = this.separateKeyValueFromCombined(value as Entity);
    const filename = await this.getKeyAsIdString(key);
    const fullPath = path.join(this.folderPath, `${filename}.json`);
    return fullPath;
  }

  /**
   * Deletes all entries with a date column value older than the provided date
   * @param column - The name of the date column to compare against
   * @param value - The value to compare against
   * @param operator - The operator to use for comparison
   */
  async deleteSearch(
    column: keyof Entity,
    value: ValueOptionType,
    operator: "=" | "<" | "<=" | ">" | ">=" = "="
  ): Promise<void> {
    throw new Error("Search not supported for FsFolderTabularRepository");
  }
}
