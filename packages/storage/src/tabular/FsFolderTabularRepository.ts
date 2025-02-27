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
  BaseValueSchema,
  BasePrimaryKeySchema,
  BasicKeyType,
  DefaultValueType,
  DefaultValueSchema,
  DefaultPrimaryKeyType,
  DefaultPrimaryKeySchema,
} from "./ITabularRepository";
import { TabularRepository } from "./TabularRepository";
import { sleep } from "@ellmers/util";
/**
 * A tabular repository implementation that uses the filesystem for storage.
 * Each row is stored as a separate JSON file in the specified directory.
 *
 * @template Key - The type of the primary key object
 * @template Value - The type of the value object being stored
 * @template PrimaryKeySchema - Schema definition for the primary key
 * @template ValueSchema - Schema definition for the value
 * @template Combined - The combined type of Key & Value
 */
export class FsFolderTabularRepository<
  Key extends Record<string, BasicKeyType> = DefaultPrimaryKeyType,
  Value extends Record<string, any> = DefaultValueType,
  PrimaryKeySchema extends BasePrimaryKeySchema = typeof DefaultPrimaryKeySchema,
  ValueSchema extends BaseValueSchema = typeof DefaultValueSchema,
  Combined extends Key & Value = Key & Value,
> extends TabularRepository<Key, Value, PrimaryKeySchema, ValueSchema, Combined> {
  private folderPath: string;

  /**
   * Creates a new FsFolderTabularRepository instance.
   *
   * @param folderPath - The directory path where the JSON files will be stored
   * @param primaryKeySchema - Schema defining the structure of the primary key
   * @param valueSchema - Schema defining the structure of the values
   * @param searchable - Array of columns or column arrays to make searchable. Each string creates a single-column index,
   *                    while each array creates a compound index with columns in the specified order.
   *                    Note: search is not supported in this implementation.
   */
  constructor(
    folderPath: string,
    primaryKeySchema: PrimaryKeySchema = DefaultPrimaryKeySchema as PrimaryKeySchema,
    valueSchema: ValueSchema = DefaultValueSchema as ValueSchema,
    searchable: Array<keyof Combined | Array<keyof Combined>> = []
  ) {
    super(primaryKeySchema, valueSchema, searchable as Array<keyof Combined>);
    this.folderPath = path.dirname(folderPath);
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
  async put(key: Key, value: Value): Promise<void> {
    const filePath = await this.getFilePath(key);
    try {
      await writeFile(filePath, JSON.stringify(value));
    } catch (error) {
      try {
        // CI system sometimes has issues temporarily
        await sleep(1);
        await writeFile(filePath, JSON.stringify(value));
      } catch (error) {
        console.error("Error writing file", filePath, error);
      }
    }
    this.events.emit("put", key, value);
  }

  /**
   * Retrieves a value by its key
   * @param key - The primary key object to look up
   * @returns The value object if found, undefined otherwise
   * @emits 'get' event with the fingerprint ID and value when found
   */
  async get(key: Key): Promise<Value | undefined> {
    const filePath = await this.getFilePath(key);
    try {
      const data = await readFile(filePath, "utf-8");
      const value = JSON.parse(data) as Value;
      this.events.emit("get", key, value);
      return value;
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
  async delete(key: Key): Promise<void> {
    const filePath = await this.getFilePath(key);
    try {
      await rm(filePath);
    } catch (error) {
      // console.error("Error deleting file", filePath, error);
    }
    this.events.emit("delete", key);
  }

  /**
   * Retrieves all rows stored in the repository
   * @returns Array of combined objects (rows) if found, undefined otherwise
   */
  async getAll(): Promise<Combined[] | undefined> {
    try {
      const files = await readdir(this.folderPath);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));
      if (jsonFiles.length === 0) {
        return undefined;
      }
      const results = await Promise.allSettled(
        jsonFiles.map(async (file) => {
          const content = await readFile(path.join(this.folderPath, file), "utf-8");
          const data = JSON.parse(content) as Combined;
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
  async search(key: Partial<Combined>): Promise<Combined[] | undefined> {
    throw new Error("Search not supported for FsFolderTabularRepository");
  }

  /**
   * Generates the full filesystem path for a given key.
   * @private
   */
  private async getFilePath(key: Key | BasicKeyType): Promise<string> {
    const filename = await this.getKeyAsIdString(key);
    const fullPath = path.join(this.folderPath, `${filename}.json`);
    return fullPath;
  }
}
