//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { nanoid } from "nanoid";
import { afterEach, describe } from "bun:test";
import { IndexedDbKVRepository } from "../IndexedDbKVRepository";
import {
  PrimaryKey,
  PrimaryKeySchema,
  runGenericKVRepositoryTests,
  Value,
  ValueSchema,
  CompoundKey,
  CompoundValue,
  CompoundPrimaryKeySchema,
  CompoundValueSchema,
} from "./genericKVRepositoryTests";

describe("IndexedDbKVRepository", () => {
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

  runGenericKVRepositoryTests(
    async () => new IndexedDbKVRepository(`${dbName}_simple`),
    async () =>
      new IndexedDbKVRepository<PrimaryKey, Value>(
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
      return new IndexedDbKVRepository<CompoundKey, CompoundValue>(
        `${dbName}_compound`,
        CompoundPrimaryKeySchema,
        CompoundValueSchema,
        searchable as unknown as Array<keyof (CompoundKey & CompoundValue)>
      );
    }
  );
});
