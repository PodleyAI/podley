//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteKvRepository } from "@podley/storage";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests.test";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";

describe("SqliteKvRepository", () => {
  runGenericKvRepositoryTests(
    async (keyType, valueType) =>
      new SqliteKvRepository(
        ":memory:",
        `sql_test_${uuid4().replace(/-/g, "_")}`,
        keyType,
        valueType
      )
  );
});
