//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@ellmers/util";
import { mkdir, readFile, rmdir, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  JSONValue,
  ValueOptionType,
} from "../tabular/ITabularRepository";
import { IKvRepository } from "./IKvRepository";
import { KvRepository } from "./KvRepository";
import { TSchema, Type } from "@sinclair/typebox";

export const FS_FOLDER_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.fsFolder"
);

/**
 * Abstract base class for key-value storage repositories.
 * Has a basic event emitter for listening to repository events.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class FsFolderKvRepository<
  Key = string,
  Value extends ValueOptionType = JSONValue,
  Combined = { key: Key; value: Value },
> extends KvRepository<Key, Value, Combined> {
  /**
   * Creates a new KvRepository instance
   */
  constructor(
    public folderPath: string,
    public pathWriter: (key: Key) => string,
    keySchema: TSchema = Type.String(),
    valueSchema: TSchema = Type.Any()
  ) {
    super(keySchema, valueSchema);
  }

  /**
   * Stores a row in the repository.
   * @param key - The primary key
   * @param value - The value to store
   */
  public async put(key: Key, value: Value): Promise<void> {
    const localPath = path.join(this.folderPath, this.pathWriter(key).replaceAll("..", "_"));
    
    // Properly handle different value types
    let content: string;
    if (value === null) {
      content = "";
    } else if (this.valueSchema.type === 'object') {
      content = JSON.stringify(value);
    } else if (typeof value === 'object') {
      // Handle 'json' type schema from tests
      content = JSON.stringify(value);
    } else {
      content = String(value);
    }
    
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, content);
  }

  /**
   * Retrieves a value by its key.
   * This is a convenience method that automatically converts simple types to structured format if using default schema.
   *
   * @param key - Primary key to look up (basic key like default schema)
   * @returns The stored value or undefined if not found
   */
  public async get(key: Key): Promise<Value | undefined> {
    const localPath = path.join(this.folderPath, this.pathWriter(key));
    try {
      // Always use utf-8 for reading since we always write strings
      const content = await readFile(localPath, { encoding: "utf-8" });
      
      // Try to detect if this is JSON data
      if (this.valueSchema.type === 'object' || 
          (content.startsWith('{') && content.endsWith('}')) || 
          (content.startsWith('[') && content.endsWith(']'))) {
        try {
          return JSON.parse(content) as Value;
        } catch (e) {
          // If JSON parsing fails, return as string
          return content as unknown as Value;
        }
      }
      
      return content as unknown as Value;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Deletes a row from the repository.
   * @param key - The primary key of the row to delete
   */
  public async delete(key: Key): Promise<void> {
    const localPath = path.join(this.folderPath, this.pathWriter(key));
    await unlink(localPath);
  }

  /**
   * Retrieves all rows from the repository.
   * @returns An array of all rows in the repository or undefined if empty
   */
  public async getAll(): Promise<Combined[] | undefined> {
    throw new Error("Not implemented");
  }

  /**
   * Deletes all rows from the repository.
   */
  public async deleteAll(): Promise<void> {
    const localPath = path.join(this.folderPath);
    await rmdir(localPath, { recursive: true });
  }

  /**
   * Retrieves the number of rows in the repository.
   * @returns The number of rows in the repository
   */
  public async size(): Promise<number> {
    throw new Error("Not implemented");
  }
}
