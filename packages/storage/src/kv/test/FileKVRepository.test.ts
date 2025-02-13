//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, beforeEach, afterEach } from "bun:test";
import { rmdirSync } from "fs";
import { FileKVRepository } from "../FileKVRepository";
import { BasePrimaryKeySchema, BaseValueSchema } from "../IKVRepository";
import { runGenericKVRepositoryTests } from "./genericKVRepositoryTests";
type PrimaryKey = {
  name: string;
  type: string;
};
type Value = {
  option: string;
  success: boolean;
};

export const PrimaryKeySchema: BasePrimaryKeySchema = { name: "string", type: "string" } as const;
export const ValueSchema: BaseValueSchema = { option: "string", success: "boolean" } as const;

const testDir = ".cache/test/testing";

describe("FileKVRepository", () => {
  let repository: FileKVRepository;
  try {
    rmdirSync(testDir, { recursive: true });
  } catch {}

  beforeEach(() => {
    repository = new FileKVRepository(testDir);
  });
  afterEach(() => {
    repository.deleteAll();
  });

  runGenericKVRepositoryTests(
    async () => new FileKVRepository(testDir),
    async () => new FileKVRepository<PrimaryKey, Value>(testDir, PrimaryKeySchema, ValueSchema)
  );
});
