//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, beforeEach, afterEach, expect, test } from "bun:test";
import { rmdirSync, mkdirSync } from "fs";
import { FsFolderKvRepository } from "@ellmers/storage";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests.test";

const testDir = ".cache/test/testing";

describe("FsFolderKvRepository", () => {
  beforeEach(() => {
    try {
      mkdirSync(testDir, { recursive: true });
    } catch {}
  });

  afterEach(async () => {
    try {
      rmdirSync(testDir, { recursive: true });
    } catch {}
  });

  runGenericKvRepositoryTests(async (keyType, valueType) => {
    return new FsFolderKvRepository(testDir, keyType, valueType);
  });
});
