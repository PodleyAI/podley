//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryModelRepository } from "@podley/ai";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests.test";
import { describe } from "bun:test";

describe("InMemoryModelRepository", () => {
  runGenericModelRepositoryTests(async () => new InMemoryModelRepository());
});
