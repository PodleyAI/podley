//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteModelRepository } from "../SqliteModelRepository";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests";
import { nanoid } from "nanoid";
import { describe } from "bun:test";

describe("SqliteModelRepository", () => {
  runGenericModelRepositoryTests(
    async () =>
      new SqliteModelRepository(
        ":memory:",
        `aimodel_test_${nanoid()}`,
        `aitask2aimodel_test_${nanoid()}`
      )
  );
});
