//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryTaskOutputRepository } from "../../binding/InMemoryTaskOutputRepository";
import { runGenericTaskOutputRepositoryTests } from "./genericTaskOutputRepositoryTests.test";
import { describe } from "bun:test";

describe("InMemoryTaskOutputRepository", () => {
  runGenericTaskOutputRepositoryTests(async () => new InMemoryTaskOutputRepository());
});
