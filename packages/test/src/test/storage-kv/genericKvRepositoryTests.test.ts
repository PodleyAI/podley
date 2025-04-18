//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IKvRepository, DefaultKeyValueSchema } from "@ellmers/storage";
import { Static, TNumber, TSchema, TString, Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";

export function runGenericKvRepositoryTests(
  createRepository: <K = string | number, V extends TSchema = TSchema>(
    keyType: K,
    valueType: V
  ) => Promise<IKvRepository<K, V>>
) {
  describe("with default schemas (key and value)", () => {
    let repository: IKvRepository<
      Static<typeof DefaultKeyValueSchema.properties.key>,
      Static<typeof DefaultKeyValueSchema.properties.value>
    >;

    beforeEach(async () => {
      repository = await createRepository(Type.String(), Type.Any());
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
      repository = await createRepository<DefaultKvPkType, { option: string; success: boolean }>(
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
