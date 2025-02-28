//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach } from "bun:test";
import { ValueSchema, KeySchema, ITabularRepository } from "../ITabularRepository";

export const CompoundPrimaryKeyNames = ["name", "type"] as const;
export const CompoundSchema: ValueSchema = {
  name: "string",
  type: "string",
  option: "string",
  success: "boolean",
} as const;

export const SearchPrimaryKeyNames = ["id"] as const;
export const SearchSchema: ValueSchema = {
  id: "string",
  category: "string",
  subcategory: "string",
  value: "number",
} as const;

export function runGenericTabularRepositoryTests(
  createCompoundPkRepository: () => Promise<
    ITabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>
  >,
  createSearchableRepository?: () => Promise<
    ITabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>
  >
) {
  describe("with compound primary keys", () => {
    let repository: ITabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>;

    beforeEach(async () => {
      repository = await createCompoundPkRepository();
    });

    it("should store and retrieve values for a key", async () => {
      const key = { name: "key1", type: "string1" };
      const entity = { ...key, option: "value1", success: true };
      await repository.put(entity);
      const output = await repository.get(key);

      expect(output?.option).toEqual("value1");
      expect(!!output?.success).toEqual(true);
    });

    it("should get undefined for a key that doesn't exist", async () => {
      const key = { name: "key", type: "string" };
      const output = await repository.get(key);

      expect(output == undefined).toEqual(true);
    });
  });

  // Only run compound index tests if createCompoundRepository is provided
  if (createSearchableRepository) {
    describe("with searchable indexes", () => {
      let repository: ITabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>;

      beforeEach(async () => {
        repository = await createSearchableRepository();
      });

      it("should store and search using compound indexes", async () => {
        // Insert test data
        await repository.put({
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
        });
        await repository.put({
          id: "2",
          category: "electronics",
          subcategory: "laptops",
          value: 200,
        });
        await repository.put({ id: "3", category: "books", subcategory: "fiction", value: 300 });

        // Test searching with single column
        const electronicsOnly = await repository.search({ category: "electronics" });
        expect(electronicsOnly?.length).toBe(2);
        expect(electronicsOnly?.map((item) => item.id).sort()).toEqual(["1", "2"]);

        // Test searching with compound criteria
        const electronicsPhones = await repository.search({
          category: "electronics",
          subcategory: "phones",
        });
        expect(electronicsPhones?.length).toBe(1);
        expect(electronicsPhones?.[0].id).toBe("1");

        // Test searching with non-existent values
        const nonExistent = await repository.search({
          category: "electronics",
          subcategory: "tablets",
        });
        expect(nonExistent).toBeUndefined();
      });

      it("should handle searching with multiple criteria in different orders", async () => {
        // Insert test data
        await repository.put({
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
        });
        await repository.put({
          id: "2",
          category: "electronics",
          subcategory: "phones",
          value: 200,
        });

        // Search with criteria in different orders should work the same
        const search1 = await repository.search({
          category: "electronics",
          subcategory: "phones",
        });
        const search2 = await repository.search({
          subcategory: "phones",
          category: "electronics",
        });

        expect(search1?.length).toBe(2);
        expect(search2?.length).toBe(2);
        expect(search1?.map((item) => item.id).sort()).toEqual(["1", "2"]);
        expect(search2?.map((item) => item.id).sort()).toEqual(["1", "2"]);
      });

      it("should handle partial matches with compound indexes", async () => {
        // Insert test data
        await repository.put({
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
        });
        await repository.put({
          id: "2",
          category: "electronics",
          subcategory: "phones",
          value: 200,
        });
        await repository.put({
          id: "3",
          category: "electronics",
          subcategory: "laptops",
          value: 300,
        });

        // Search with value field
        const highValue = await repository.search({ value: 300 });
        expect(highValue?.length).toBe(1);
        expect(highValue?.[0].id).toBe("3");

        // Search with multiple fields including a non-indexed one
        const expensivePhones = await repository.search({
          subcategory: "phones",
          value: 200,
        });
        expect(expensivePhones?.length).toBe(1);
        expect(expensivePhones?.[0].id).toBe("2");
      });
    });
  }
}
