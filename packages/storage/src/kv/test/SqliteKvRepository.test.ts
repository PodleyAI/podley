//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteKvRepository } from "../SqliteKvRepository";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";
import { uuid4 } from "@ellmers/util";
import { describe } from "bun:test";

describe("SqliteKvRepository", () => {
  runGenericKvRepositoryTests(
    async (keyType, valueType) =>
      new SqliteKvRepository(":memory:", `sql_test_${uuid4()}`, keyType, valueType)
  );
});
