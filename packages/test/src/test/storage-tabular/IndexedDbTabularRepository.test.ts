//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { uuid4 } from "@ellmers/util";
import { afterEach, describe } from "bun:test";
import { IndexedDbTabularRepository } from "@ellmers/storage";
import {
  CompoundPrimaryKeyNames,
  runGenericTabularRepositoryTests,
  CompoundSchema,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests.test";

describe("IndexedDbTabularRepository", () => {
  const dbName = `idx_test_${uuid4()}`;

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
      new IndexedDbTabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
        `${dbName}_complex`,
        CompoundSchema,
        CompoundPrimaryKeyNames
      ),
    async () => {
      return new IndexedDbTabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>(
        `${dbName}_compound`,
        SearchSchema,
        SearchPrimaryKeyNames,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      );
    }
  );
});
