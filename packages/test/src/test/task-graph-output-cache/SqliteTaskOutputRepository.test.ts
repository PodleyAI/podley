//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteTaskOutputRepository } from "../../binding/SqliteTaskOutputRepository";
import { runGenericTaskOutputRepositoryTests } from "./genericTaskOutputRepositoryTests.test";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";

describe("SqliteTaskOutputRepository", () => {
  runGenericTaskOutputRepositoryTests(async () => {
    const id = uuid4().replace(/-/g, "_");
    const dbName = `task_output_test_${id}`;
    return new SqliteTaskOutputRepository(":memory:", dbName);
  });
});
