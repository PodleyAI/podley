//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { ValueSchema, ITabularRepository } from "@ellmers/storage";

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
  createdAt: "date",
  updatedAt: "date",
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
  });

  // Only run compound index tests if createCompoundRepository is provided
  if (createSearchableRepository) {
    describe("with searchable indexes", () => {
      let repository: ITabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>;

      beforeEach(async () => {
        repository = await createSearchableRepository();
      });

      afterEach(async () => {
        await repository.deleteAll();
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
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        // Add test entries
        await repository.put({ id: "1", name: "Recent", createdAt: now, updatedAt: now });
        await repository.put({
          id: "2",
          name: "Yesterday",
          createdAt: yesterday,
          updatedAt: yesterday,
        });
        await repository.put({
          id: "3",
          name: "Two days ago",
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo,
        });
        await repository.put({
          id: "4",
          name: "Three days ago",
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
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

        // Add test entries with mixed dates
        await repository.put({ id: "1", name: "Recent both", createdAt: now, updatedAt: now });
        await repository.put({
          id: "2",
          name: "Old created, recent updated",
          createdAt: twoDaysAgo,
          updatedAt: now,
        });
        await repository.put({
          id: "3",
          name: "Recent created, old updated",
          createdAt: now,
          updatedAt: twoDaysAgo,
        });
        await repository.put({
          id: "4",
          name: "Old both",
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

        const result = await repository.deleteSearch("createdAt", new Date(), "<");
        expect(result).toBeUndefined();
      });

      it("should not delete entries when none are older than the specified date", async () => {
        // Create test data with recent dates
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Add test entries
        await repository.put({ id: "1", name: "Recent 1", createdAt: now, updatedAt: now });
        await repository.put({ id: "2", name: "Recent 2", createdAt: now, updatedAt: yesterday });

        // Try to delete entries older than 3 days ago
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        await repository.deleteSearch("createdAt", threeDaysAgo, "<");

        // Verify all entries still exist
        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(2);
      });
    });
  }
}
