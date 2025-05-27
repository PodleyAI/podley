//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryTaskGraphRepository } from "../../binding/InMemoryTaskGraphRepository";
import { runGenericTaskGraphRepositoryTests } from "./genericTaskGraphRepositoryTests.test";
import { describe } from "bun:test";

describe("InMemoryTaskGraphRepository", () => {
  runGenericTaskGraphRepositoryTests(async () => new InMemoryTaskGraphRepository());
});
