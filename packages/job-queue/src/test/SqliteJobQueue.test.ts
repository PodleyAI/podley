//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runGenericJobQueueTests, TestJob } from "./genericJobQueueTests";
import { SqliteJobQueue } from "../storage/SqliteJobQueue";
import { SqliteRateLimiter } from "../storage/SqliteRateLimiter";
import { nanoid } from "nanoid";
import { describe } from "bun:test";

const wrapper = function () {
  if (process["isBun"]) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("bun:sqlite").Database;
  }

  return require("better-sqlite3");
};

const module = wrapper();

// Create an in-memory database
const db = new module(":memory:");

function createSqliteJobQueue() {
  const queueName = `sqlite_test_queue_${nanoid()}`;
  return new SqliteJobQueue(
    db,
    queueName,
    new SqliteRateLimiter(db, queueName, 4, 1).ensureTableExists(),
    TestJob,
    1
  ).ensureTableExists();
}

describe("SqliteJobQueue", () => {
  runGenericJobQueueTests(createSqliteJobQueue);
});
