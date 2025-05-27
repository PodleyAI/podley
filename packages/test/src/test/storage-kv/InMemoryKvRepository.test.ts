//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryKvRepository } from "@podley/storage";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests.test";
import { describe } from "bun:test";

describe("InMemoryKvRepository", () => {
  runGenericKvRepositoryTests(
    async (keyType, valueType) => new InMemoryKvRepository(keyType, valueType)
  );
});
