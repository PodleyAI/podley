//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach } from "bun:test";
import { IKvRepository, JSONValue } from "../IKvRepository";
import { BasicKeyType } from "../../tabular/ITabularRepository";

export function runGenericKvRepositoryTests(
  createRepository: <K extends BasicKeyType = BasicKeyType, V extends JSONValue = JSONValue>(
    keyType: "string" | "number" | "bigint" | "uuid4",
    valueType: "string" | "number" | "bigint" | "json"
  ) => Promise<IKvRepository<K, V>>
) {
  describe("with default schemas (key and value)", () => {
    let repository: IKvRepository;

    beforeEach(async () => {
      repository = await createRepository("string", "string");
    });

    it("should store and retrieve values for a key", async () => {
      const key = "key1";
      const value = "value1";
      await repository.put(key, value);
      const output = await repository.get(key);

      expect(output).toEqual(value);
    });

    it("should get undefined for a key that doesn't exist", async () => {
      const key = "key";
      const value = "value";
      await repository.put(key, value);
      const output = await repository.get("not-a-key");

      expect(output == undefined).toEqual(true);
    });
  });

  describe("with json value", () => {
    let repository: IKvRepository<string, { option: string; success: boolean }>;

    beforeEach(async () => {
      repository = await createRepository<string, { option: string; success: boolean }>(
        "string",
        "json"
      );
    });

    it("should store and retrieve values for a key", async () => {
      const key = await repository.getObjectAsIdString({ name: "key1", type: "string1" });
      const value = { option: "value1", success: true };
      await repository.put(key, value);
      const output = await repository.get(key);

      expect(output?.option).toEqual("value1");
      expect(!!output?.success).toEqual(true);
    });

    it("should get undefined for a key that doesn't exist", async () => {
      const key = await repository.getObjectAsIdString({ name: "key", type: "string" });
      const output = await repository.get(key);

      expect(output == undefined).toEqual(true);
    });
  });
}
