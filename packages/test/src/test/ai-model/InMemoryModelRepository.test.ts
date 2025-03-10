//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryModelRepository } from "@ellmers/ai";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests.test";
import { describe } from "bun:test";

describe("InMemoryModelRepository", () => {
  runGenericModelRepositoryTests(async () => new InMemoryModelRepository());
});
