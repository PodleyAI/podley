//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { nanoid } from "nanoid";
import { afterEach, describe } from "bun:test";
import { IndexedDbKvRepository } from "../IndexedDbKvRepository";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";

describe("IndexedDbKvRepository", () => {
  const dbName = `idx_test_${nanoid()}`;

  // Clean up after each test
  afterEach(async () => {
    // Close any open connections first
    const closeRequest = indexedDB.open(`${dbName}`);
    closeRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.close();
    };

    // Delete the test databases
    indexedDB.deleteDatabase(`${dbName}`);
  });

  runGenericKvRepositoryTests(
    async (keyType, valueType) => new IndexedDbKvRepository(`${dbName}`, keyType, valueType)
  );
});
