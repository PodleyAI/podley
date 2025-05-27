//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteModelRepository } from "@podley/ai";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests.test";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";

describe("SqliteModelRepository", () => {
  runGenericModelRepositoryTests(async () => {
    const id = uuid4().replace(/-/g, "_");
    return new SqliteModelRepository(":memory:", `aimodel_test_${id}`, `aitask2aimodel_test_${id}`);
  });
});
