//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { ITabularRepository } from "@podley/storage";
import { Type } from "@sinclair/typebox";
import { TypeDateTime } from "@podley/util";

export const CompoundPrimaryKeyNames = ["name", "type"] as const;
export const CompoundSchema = Type.Object({
  name: Type.String(),
  type: Type.String(),
  option: Type.String(),
  success: Type.Boolean(),
});

export const SearchPrimaryKeyNames = ["id"] as const;
export const SearchSchema = Type.Object({
  id: Type.String(),
  category: Type.String(),
  subcategory: Type.String(),
  value: Type.Number(),
  createdAt: TypeDateTime(),
  updatedAt: TypeDateTime(),
});

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

    afterEach(async () => {
      await repository.deleteAll();
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

    it("should store multiple entities using putBulk", async () => {
      const entities = [
        { name: "key1", type: "string1", option: "value1", success: true },
        { name: "key2", type: "string2", option: "value2", success: false },
        { name: "key3", type: "string3", option: "value3", success: true },
      ];

      await repository.putBulk(entities);

      for (const entity of entities) {
        const output = await repository.get({ name: entity.name, type: entity.type });
        expect(output?.option).toEqual(entity.option);
        expect(!!output?.success).toEqual(entity.success);
      }
    });

    it("should handle empty array in putBulk", async () => {
      await repository.putBulk([]);
      // Should not throw an error
    });
  });

  // Only run compound index tests if createCompoundRepository is provided
  if (createSearchableRepository) {
    describe("with searchable indexes", () => {
      let searchableRepo: ITabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>;

      beforeEach(async () => {
        searchableRepo = await createSearchableRepository();
      });

      afterEach(async () => {
        await searchableRepo.deleteAll();
      });

      it("should store and search using compound indexes", async () => {
        // Insert test data
        await searchableRepo.put({
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await searchableRepo.put({
          id: "2",
          category: "electronics",
          subcategory: "laptops",
          value: 200,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await searchableRepo.put({
          id: "3",
          category: "books",
          subcategory: "fiction",
          value: 300,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        // Test searching with single column
        const electronicsOnly = await searchableRepo.search({ category: "electronics" });
        expect(electronicsOnly?.length).toBe(2);
        expect(electronicsOnly?.map((item) => item.id).sort()).toEqual(["1", "2"]);

        // Test searching with compound criteria
        const electronicsPhones = await searchableRepo.search({
          category: "electronics",
          subcategory: "phones",
        });
        expect(electronicsPhones?.length).toBe(1);
        expect(electronicsPhones?.[0].id).toBe("1");

        // Test searching with non-existent values
        const nonExistent = await searchableRepo.search({
          category: "electronics",
          subcategory: "tablets",
        });
        expect(nonExistent).toBeUndefined();
      });

      it("should handle searching with multiple criteria in different orders", async () => {
        // Insert test data
        await searchableRepo.put({
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await searchableRepo.put({
          id: "2",
          category: "electronics",
          subcategory: "phones",
          value: 200,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Search with criteria in different orders should work the same
        const search1 = await searchableRepo.search({
          category: "electronics",
          subcategory: "phones",
        });
        const search2 = await searchableRepo.search({
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
        await searchableRepo.put({
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await searchableRepo.put({
          id: "2",
          category: "electronics",
          subcategory: "phones",
          value: 200,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await searchableRepo.put({
          id: "3",
          category: "electronics",
          subcategory: "laptops",
          value: 300,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Search with value field
        const highValue = await searchableRepo.search({ value: 300 });
        expect(highValue?.length).toBe(1);
        expect(highValue?.[0].id).toBe("3");

        // Search with multiple fields including a non-indexed one
        const expensivePhones = await searchableRepo.search({
          subcategory: "phones",
          value: 200,
        });
        expect(expensivePhones?.length).toBe(1);
        expect(expensivePhones?.[0].id).toBe("2");
      });
    });

    describe(`deleteSearch tests`, () => {
      let repository: ITabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>;

      beforeEach(async () => {
        repository = await createSearchableRepository();
      });

      afterEach(async () => {
        await repository.deleteAll();
      });

      it("should delete entries older than a specified date using createdAt", async () => {
        // Create test data with different dates
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

        // Add test entries
        await repository.put({
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "2",
          category: "electronics",
          subcategory: "phones",
          value: 200,
          createdAt: yesterday,
          updatedAt: yesterday,
        });
        await repository.put({
          id: "3",
          category: "electronics",
          subcategory: "phones",
          value: 300,
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo,
        });
        await repository.put({
          id: "4",
          category: "electronics",
          subcategory: "phones",
          value: 400,
          createdAt: threeDaysAgo,
          updatedAt: threeDaysAgo,
        });

        // Verify all entries were added
        expect((await repository.getAll())?.length).toBe(4);

        // Delete entries older than yesterday
        await repository.deleteSearch("createdAt", yesterday, "<");

        // Verify only entries from yesterday and today remain
        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(2);
        expect(remaining?.map((item) => item.id).sort()).toEqual(["1", "2"]);
      });

      it("should delete entries older than a specified date using updatedAt", async () => {
        // Create test data with different dates
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

        // Add test entries with mixed dates
        await repository.put({
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "2",
          category: "electronics",
          subcategory: "phones",
          value: 200,
          createdAt: twoDaysAgo,
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "3",
          category: "electronics",
          subcategory: "phones",
          value: 300,
          createdAt: now.toISOString(),
          updatedAt: twoDaysAgo,
        });
        await repository.put({
          id: "4",
          category: "electronics",
          subcategory: "phones",
          value: 400,
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo,
        });

        // Verify all entries were added
        expect((await repository.getAll())?.length).toBe(4);

        // Delete entries with updatedAt older than yesterday
        await repository.deleteSearch("updatedAt", yesterday, "<");

        // Verify only entries with recent updatedAt remain
        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(2);
        expect(remaining?.map((item) => item.id).sort()).toEqual(["1", "2"]);
      });

      it("should handle empty repository gracefully", async () => {
        // Verify repository is empty
        expect(await repository.getAll()).toBeUndefined();

        const result = await repository.deleteSearch("createdAt", new Date().toISOString(), "<");
        expect(result).toBeUndefined();
      });

      it("should not delete entries when none are older than the specified date", async () => {
        // Create test data with recent dates
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Add test entries
        await repository.put({
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "2",
          category: "electronics",
          subcategory: "phones",
          value: 200,
          createdAt: now.toISOString(),
          updatedAt: yesterday.toISOString(),
        });
        // Try to delete entries older than 3 days ago
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
        await repository.deleteSearch("createdAt", threeDaysAgo, "<");

        // Verify all entries still exist
        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(2);
      });
    });
  }
}
