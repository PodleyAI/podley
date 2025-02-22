//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { nanoid } from "nanoid";
import { afterEach, describe } from "bun:test";
import { IndexedDbTabularRepository } from "../IndexedDbTabularRepository";
import {
  PrimaryKey,
  PrimaryKeySchema,
  runGenericTabularRepositoryTests,
  Value,
  ValueSchema,
  CompoundKey,
  CompoundValue,
  CompoundPrimaryKeySchema,
  CompoundValueSchema,
} from "./genericTabularRepositoryTests";

describe("IndexedDbTabularRepository", () => {
  const dbName = `idx_test_${nanoid()}`;

  // Clean up after each test
  afterEach(async () => {
    // Close any open connections first
    const closeRequest = indexedDB.open(`${dbName}_simple`);
    closeRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.close();
    };

    // Delete the test databases
    indexedDB.deleteDatabase(`${dbName}_simple`);
    indexedDB.deleteDatabase(`${dbName}_complex`);
    indexedDB.deleteDatabase(`${dbName}_compound`);
  });

  runGenericTabularRepositoryTests(
    async () =>
      new IndexedDbTabularRepository<PrimaryKey, Value>(
        `${dbName}_complex`,
        PrimaryKeySchema,
        ValueSchema
      ),
    async () => {
      const searchable = [
        "category",
        ["category", "subcategory"],
        ["subcategory", "category"],
        "value",
      ] as const;
      return new IndexedDbTabularRepository<CompoundKey, CompoundValue>(
        `${dbName}_compound`,
        CompoundPrimaryKeySchema,
        CompoundValueSchema,
        searchable as unknown as Array<keyof (CompoundKey & CompoundValue)>
      );
    }
  );
});
