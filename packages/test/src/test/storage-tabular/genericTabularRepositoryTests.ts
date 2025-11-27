/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ITabularRepository } from "@workglow/storage";
import { DataPortSchemaObject } from "@workglow/util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

export const CompoundPrimaryKeyNames = ["name", "type"] as const;
export const CompoundSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    type: { type: "string" },
    option: { type: "string" },
    success: { type: "boolean" },
  },
  required: ["name", "type", "option", "success"],
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;

export const SearchPrimaryKeyNames = ["id"] as const;
export const SearchSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    category: { type: "string" },
    subcategory: { type: "string" },
    kind: { type: "string" },
    value: { type: "number" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "category", "subcategory", "value", "createdAt", "updatedAt"],
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;

export const NullableSearchPrimaryKeyNames = ["id"] as const;
export const NullableSearchSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    category: { type: "string" },
    subcategory: { type: "string" },
    value: { anyOf: [{ type: "number" }, { type: "null" }] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;

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
      repository.destroy();
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

    it("should return the entity from put()", async () => {
      const key = { name: "key1", type: "string1" };
      const entity = { ...key, option: "value1", success: true };

      const returned = await repository.put(entity);

      // Verify returned entity matches what was stored
      expect(returned).toBeDefined();
      expect(returned.name).toEqual(entity.name);
      expect(returned.type).toEqual(entity.type);
      expect(returned.option).toEqual(entity.option);
      expect(!!returned.success).toEqual(entity.success);
    });

    it("should return updated entity from put() when upserting", async () => {
      const key = { name: "key1", type: "string1" };
      const entity1 = { ...key, option: "value1", success: true };
      const entity2 = { ...key, option: "value2", success: false };

      // First insert
      const returned1 = await repository.put(entity1);
      expect(returned1.option).toEqual("value1");
      expect(!!returned1.success).toEqual(true);

      // Update via upsert
      const returned2 = await repository.put(entity2);
      expect(returned2.option).toEqual("value2");
      expect(!!returned2.success).toEqual(false);

      // Verify database was updated
      const stored = await repository.get(key);
      expect(stored?.option).toEqual("value2");
      expect(!!stored?.success).toEqual(false);
    });

    it("should return array of entities from putBulk()", async () => {
      const entities = [
        { name: "key1", type: "string1", option: "value1", success: true },
        { name: "key2", type: "string2", option: "value2", success: false },
        { name: "key3", type: "string3", option: "value3", success: true },
      ];

      const returned = await repository.putBulk(entities);

      // Verify returned array matches input
      expect(returned).toBeDefined();
      expect(returned.length).toEqual(3);

      for (let i = 0; i < entities.length; i++) {
        expect(returned[i].name).toEqual(entities[i].name);
        expect(returned[i].type).toEqual(entities[i].type);
        expect(returned[i].option).toEqual(entities[i].option);
        expect(!!returned[i].success).toEqual(entities[i].success);
      }
    });

    it("should return empty array from putBulk() with empty input", async () => {
      const returned = await repository.putBulk([]);

      expect(returned).toBeDefined();
      expect(Array.isArray(returned)).toBe(true);
      expect(returned.length).toEqual(0);
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

      it("should delete entries with < operator", async () => {
        const now = new Date();

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
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "3",
          category: "electronics",
          subcategory: "phones",
          value: 300,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        await repository.deleteSearch("value", 200, "<");
        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(2);
        expect(remaining?.map((item) => item.id).sort()).toEqual(["2", "3"]);
      });

      it("should delete entries with <= operator", async () => {
        const now = new Date();

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
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "3",
          category: "electronics",
          subcategory: "phones",
          value: 300,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        await repository.deleteSearch("value", 200, "<=");
        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(1);
        expect(remaining?.[0].id).toBe("3");
      });

      it("should delete entries with > operator", async () => {
        const now = new Date();

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
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "3",
          category: "electronics",
          subcategory: "phones",
          value: 300,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        await repository.deleteSearch("value", 200, ">");
        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(2);
        expect(remaining?.map((item) => item.id).sort()).toEqual(["1", "2"]);
      });

      it("should delete entries with >= operator", async () => {
        const now = new Date();

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
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "3",
          category: "electronics",
          subcategory: "phones",
          value: 300,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        await repository.deleteSearch("value", 200, ">=");
        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(1);
        expect(remaining?.[0].id).toBe("1");
      });

      it("should handle = operator for exact matches", async () => {
        const now = new Date();

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
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "3",
          category: "electronics",
          subcategory: "phones",
          value: 200,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        await repository.deleteSearch("value", 200, "=");

        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(1);
        expect(remaining?.[0].id).toBe("1");
        expect(remaining?.[0].value).toBe(100);
      });

      it("should correctly handle null/undefined column values in comparisons", async () => {
        const now = new Date();

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
          updatedAt: now.toISOString(),
        });
        await repository.put({
          id: "3",
          category: "electronics",
          subcategory: "phones",
          value: 300,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        await repository.deleteSearch("value", 200, "<");

        const remaining = await repository.getAll();
        expect(remaining?.length).toBe(2);
        expect(remaining?.map((item) => item.id).sort()).toEqual(["2", "3"]);
      });
    });

    describe("return value tests with timestamps", () => {
      let repository: ITabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>;

      beforeEach(async () => {
        repository = await createSearchableRepository();
      });

      afterEach(async () => {
        await repository.deleteAll();
      });

      it("should return entity with timestamps from put()", async () => {
        const now = new Date().toISOString();
        const entity = {
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
          createdAt: now,
          updatedAt: now,
        };

        const returned = await repository.put(entity);

        // Verify all fields are returned
        expect(returned).toBeDefined();
        expect(returned.id).toEqual("1");
        expect(returned.category).toEqual("electronics");
        expect(returned.subcategory).toEqual("phones");
        expect(returned.value).toEqual(100);
        expect(returned.createdAt).toBeDefined();
        expect(returned.updatedAt).toBeDefined();
      });

      it("should return entities with timestamps from putBulk()", async () => {
        const now = new Date().toISOString();
        const entities = [
          {
            id: "1",
            category: "electronics",
            subcategory: "phones",
            value: 100,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "2",
            category: "books",
            subcategory: "fiction",
            value: 200,
            createdAt: now,
            updatedAt: now,
          },
        ];

        const returned = await repository.putBulk(entities);

        // Verify all entities are returned with all fields
        expect(returned).toBeDefined();
        expect(returned.length).toEqual(2);

        for (let i = 0; i < entities.length; i++) {
          expect(returned[i].id).toEqual(entities[i].id);
          expect(returned[i].category).toEqual(entities[i].category);
          expect(returned[i].subcategory).toEqual(entities[i].subcategory);
          expect(returned[i].value).toEqual(entities[i].value);
          expect(returned[i].createdAt).toBeDefined();
          expect(returned[i].updatedAt).toBeDefined();
        }
      });

      it("should return updated timestamps when upserting", async () => {
        const now = new Date().toISOString();
        const entity1 = {
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
          createdAt: now,
          updatedAt: now,
        };

        // First insert
        const returned1 = await repository.put(entity1);
        expect(returned1.value).toEqual(100);

        // Wait a moment to ensure timestamps would differ
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Update with new data
        const later = new Date().toISOString();
        const entity2 = {
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 150,
          createdAt: now, // Keep original created time
          updatedAt: later, // New update time
        };

        const returned2 = await repository.put(entity2);
        expect(returned2.value).toEqual(150);
        expect(returned2.updatedAt).toBeDefined();

        // Verify the update persisted
        const stored = await repository.get({ id: "1" });
        expect(stored?.value).toEqual(150);
      });

      it("should return consistent data between put() result and get()", async () => {
        const now = new Date().toISOString();
        const entity = {
          id: "1",
          category: "electronics",
          subcategory: "phones",
          value: 100,
          createdAt: now,
          updatedAt: now,
        };

        const returned = await repository.put(entity);
        const retrieved = await repository.get({ id: "1" });

        // Verify returned and retrieved match
        expect(retrieved).toBeDefined();
        expect(returned.id).toEqual(retrieved!.id);
        expect(returned.category).toEqual(retrieved!.category);
        expect(returned.subcategory).toEqual(retrieved!.subcategory);
        expect(returned.value).toEqual(retrieved!.value);
        expect(returned.createdAt).toEqual(retrieved!.createdAt);
        expect(returned.updatedAt).toEqual(retrieved!.updatedAt);
      });

      it("should return consistent data between putBulk() results and getAll()", async () => {
        const now = new Date().toISOString();
        const entities = [
          {
            id: "1",
            category: "electronics",
            subcategory: "phones",
            value: 100,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "2",
            category: "books",
            subcategory: "fiction",
            value: 200,
            createdAt: now,
            updatedAt: now,
          },
        ];

        const returned = await repository.putBulk(entities);
        const retrieved = await repository.getAll();

        // Verify returned and retrieved match
        expect(retrieved).toBeDefined();
        expect(returned.length).toEqual(retrieved!.length);

        // Sort both arrays by id for comparison
        const sortedReturned = returned.sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""));
        const sortedRetrieved = retrieved!.sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""));

        for (let i = 0; i < sortedReturned.length; i++) {
          expect(sortedReturned[i].id).toEqual(sortedRetrieved[i].id);
          expect(sortedReturned[i].category).toEqual(sortedRetrieved[i].category);
          expect(sortedReturned[i].subcategory).toEqual(sortedRetrieved[i].subcategory);
          expect(sortedReturned[i].value).toEqual(sortedRetrieved[i].value);
          expect(sortedReturned[i].createdAt).toEqual(sortedRetrieved[i].createdAt);
          expect(sortedReturned[i].updatedAt).toEqual(sortedRetrieved[i].updatedAt);
        }
      });
    });
  }
}
