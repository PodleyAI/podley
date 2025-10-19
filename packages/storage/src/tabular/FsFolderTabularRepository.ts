//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, sleep } from "@podley/util";
import { Static, TObject } from "@sinclair/typebox";
import { readdir, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ExtractPrimaryKey, ExtractValue, ITabularRepository } from "./ITabularRepository";
import { TabularRepository } from "./TabularRepository";

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
  Schema extends TObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Static<Schema>>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = Static<Schema>,
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
  }

  /**
   * Sets up the directory for the repository (creates directory)
   */
  async setupDirectory(): Promise<void> {
    try {
      await mkdir(this.folderPath, { recursive: true });
    } catch (error) {
      // CI system sometimes has issues temporarily
      await new Promise((resolve) => setTimeout(resolve, 0));
      try {
        await mkdir(this.folderPath, { recursive: true });
      } catch {
        // Ignore error if directory already exists
      }
    }
  }

  /**
   * Stores a row in the repository
   * @param entity - The entity to store
   * @returns The stored entity
   * @emits 'put' event when successful
   */
  async put(entity: Entity): Promise<Entity> {
    await this.setupDirectory();
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
    return entity;
  }

  /**
   * Stores multiple rows in the repository in a bulk operation
   * @param entities - Array of entities to store
   * @returns Array of stored entities
   * @emits 'put' event for each entity stored
   */
  async putBulk(entities: Entity[]): Promise<Entity[]> {
    await this.setupDirectory();
    return await Promise.all(entities.map(async (entity) => this.put(entity)));
  }

  /**
   * Retrieves a value by its key
   * @param key - The primary key object to look up
   * @returns The value object if found, undefined otherwise
   * @emits 'get' event with the fingerprint ID and value when found
   */
  async get(key: PrimaryKey): Promise<Entity | undefined> {
    await this.setupDirectory();
    const filePath = await this.getFilePath(key);
    try {
      const buf = await readFile(filePath);
      const data = buf.toString("utf8");
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
    await this.setupDirectory();
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
    await this.setupDirectory();
    try {
      const files = await readdir(this.folderPath);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));
      if (jsonFiles.length === 0) {
        return undefined;
      }
      const results = await Promise.allSettled(
        jsonFiles.map(async (file) => {
          const buf = await readFile(path.join(this.folderPath, file));
          const content = buf.toString("utf8");
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
    await this.setupDirectory();
    // Delete all files in the folder ending in .json
    await rm(this.folderPath, { recursive: true, force: true });
    this.events.emit("clearall");
  }

  /**
   * Returns the total number of stored rows
   * @returns Promise resolving to the count of stored items
   */
  async size(): Promise<number> {
    await this.setupDirectory();
    // Count all files in the folder ending in .json
    const files = await readdir(this.folderPath);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));
    return jsonFiles.length;
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
    value: Entity[keyof Entity],
    operator: "=" | "<" | "<=" | ">" | ">=" = "="
  ): Promise<void> {
    throw new Error("Search not supported for FsFolderTabularRepository");
  }
}
