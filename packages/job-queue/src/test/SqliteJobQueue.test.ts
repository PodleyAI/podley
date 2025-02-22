//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runGenericJobQueueTests, TestJob } from "./genericJobQueueTests";
import { SqliteQueueStorage } from "@ellmers/storage";
import { SqliteRateLimiter } from "../storage/SqliteRateLimiter";
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

describe("SqliteJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new SqliteQueueStorage(db, queueName),
    (queueName: string, maxRequests: number, windowSizeInMinutes: number) =>
      new SqliteRateLimiter(db, queueName, maxRequests, windowSizeInMinutes)
  );
});
