//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteModelRepository } from "../SqliteModelRepository";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests";
import { uuid4 } from "@ellmers/util";
import { describe } from "bun:test";

describe("SqliteModelRepository", () => {
  runGenericModelRepositoryTests(
    async () =>
      new SqliteModelRepository(
        ":memory:",
        `aimodel_test_${uuid4()}`,
        `aitask2aimodel_test_${uuid4()}`
      )
  );
});
