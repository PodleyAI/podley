//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultKeyValueSchema, IKvRepository } from "@podley/storage";
import { Static, TSchema, Type } from "@sinclair/typebox";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";

export function runGenericKvRepositoryTests(
  createRepository: (keyType: TSchema, valueType: TSchema) => Promise<IKvRepository<any, any>>
) {
  describe("with default schemas (key and value)", () => {
    let repository: IKvRepository<
      Static<typeof DefaultKeyValueSchema.properties.key>,
      Static<typeof DefaultKeyValueSchema.properties.value>
    >;

    beforeEach(async () => {
      repository = await createRepository(Type.String(), Type.Any());
    });

    afterEach(async () => {
      // @ts-ignore
      repository.db?.close?.();
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

    it("should store multiple values using putBulk", async () => {
      const items = [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" },
        { key: "key3", value: "value3" },
      ];

      await repository.putBulk(items);

      for (const item of items) {
        const output = await repository.get(item.key);
        expect(output).toEqual(item.value);
      }
    });

    it("should handle empty array in putBulk", async () => {
      await repository.putBulk([]);
      // Should not throw an error
    });
  });

  describe("with json value", () => {
    let repository: IKvRepository<string, { option: string; success: boolean }>;

    beforeEach(async () => {
      repository = (await createRepository(
        Type.String(),
        Type.Object({
          option: Type.String(),
          success: Type.Boolean(),
        })
      )) as IKvRepository<string, { option: string; success: boolean }>;
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

    it("should store multiple JSON values using putBulk", async () => {
      const items = [
        {
          key: await repository.getObjectAsIdString({ name: "key1", type: "string1" }),
          value: { option: "value1", success: true },
        },
        {
          key: await repository.getObjectAsIdString({ name: "key2", type: "string2" }),
          value: { option: "value2", success: false },
        },
        {
          key: await repository.getObjectAsIdString({ name: "key3", type: "string3" }),
          value: { option: "value3", success: true },
        },
      ];

      await repository.putBulk(items);

      for (const item of items) {
        const output = await repository.get(item.key);
        expect(output?.option).toEqual(item.value.option);
        expect(output?.success).toEqual(item.value.success);
      }
    });
  });
}
