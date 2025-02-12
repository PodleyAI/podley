//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { nanoid } from "nanoid";
import { afterAll, describe } from "bun:test";
import { IndexedDbKVRepository } from "../IndexedDbKVRepository";
import {
  PrimaryKey,
  PrimaryKeySchema,
  runGenericKVRepositoryTests,
  Value,
  ValueSchema,
} from "./genericKVRepositoryTests";

describe("IndexedDbKVRepository", () => {
  const dbName = `idx_test_${nanoid()}`;

  afterAll(async () => {
    // Properly clean up the databases
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(`${dbName}_simple`);
      resolve();
    });
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(`${dbName}_complex`);
      resolve();
    });
  });

  runGenericKVRepositoryTests(
    async () => new IndexedDbKVRepository(`${dbName}_simple`),
    async () =>
      new IndexedDbKVRepository<PrimaryKey, Value>(
        `${dbName}_complex`,
        PrimaryKeySchema,
        ValueSchema
      )
  );
});
