/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { PGlite } from "@electric-sql/pglite";
import { PostgresTabularStorage } from "@workglow/postgres/storage";
import { withConnectionTransaction } from "@workglow/storage";
import type { Pool } from "pg";
import { describe, expect, it } from "vitest";

const RowSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    tag: { type: "string" },
  },
  required: ["name", "tag"],
  additionalProperties: false,
} as const;

const RowPrimaryKeyNames = ["name"] as const;

type RowStorage = PostgresTabularStorage<typeof RowSchema, typeof RowPrimaryKeyNames>;

/**
 * A `pg.Pool`-shaped facade over one PGlite session.
 *
 * `PostgresTabularStorage` decides which arm it is on by whether the db it was
 * given has `connect()`, so this puts it on the POOLED arm — the one whose
 * connection transaction checks out its own client and therefore flags no
 * participant with `inTransaction`. Every statement still runs on the single
 * PGlite session underneath, which is what makes the arm reachable without a
 * live Postgres: what is under test is which join strategy gets chosen from
 * that state, not the isolation a real pool would then impose.
 */
function pooledFacade(db: PGlite): Pool {
  const query = db.query.bind(db);
  return {
    query,
    connect: async () => ({ query, release: (): void => {} }),
  } as unknown as Pool;
}

/**
 * Counts calls to `query` on one storage without a spy, so this file needs
 * nothing from Vitest's module registry and runs unchanged under either runner.
 */
function countQueries(storage: RowStorage): () => number {
  let calls = 0;
  const original = storage.query.bind(storage);
  (storage as { query: RowStorage["query"] }).query = ((...args: Parameters<typeof original>) => {
    calls += 1;
    return original(...args);
  }) as RowStorage["query"];
  return () => calls;
}

describe("join pushdown against a pooled connection transaction", () => {
  it("hands the join to the hash fallback when only the right side is enlisted", async () => {
    // The pushdown reads the right table while holding only the left's lock, so
    // on a real pool it runs on a different client from the one the right side
    // is enlisted on and cannot see that transaction's uncommitted rows — an
    // inner join returning zero rows where the hash fallback returns the row.
    // The fallback goes through `right.query()`, which resolves the enlisted
    // client, so the strategy chosen is the whole question here. Only the
    // right side is a participant; a join is a read, so nothing else refuses it.
    const db = new PGlite();
    const pool = pooledFacade(db);
    const left: RowStorage = new PostgresTabularStorage(
      pool,
      "pooled_join_left",
      RowSchema,
      RowPrimaryKeyNames
    );
    const right: RowStorage = new PostgresTabularStorage(
      pool,
      "pooled_join_right",
      RowSchema,
      RowPrimaryKeyNames
    );
    await left.setupDatabase();
    await right.setupDatabase();
    await left.put({ name: "a", tag: "left-row" });

    const rightQueries = countQueries(right);

    await withConnectionTransaction([right], async () => {
      await right.put({ name: "a", tag: "uncommitted" });

      const rows = await left.join(
        {
          type: "inner",
          on: [{ left: "name", right: "name" }],
          orderBy: [{ side: "left", column: "name", direction: "ASC" }],
        },
        right
      );

      expect(rows.map((row) => `${row.left.tag}:${row.right.tag}`)).toEqual([
        "left-row:uncommitted",
      ]);
    });

    expect(rightQueries()).toBeGreaterThan(0);
  });

  it("still pushes down when neither side is in a transaction", async () => {
    const db = new PGlite();
    const pool = pooledFacade(db);
    const left: RowStorage = new PostgresTabularStorage(
      pool,
      "pooled_plain_left",
      RowSchema,
      RowPrimaryKeyNames
    );
    const right: RowStorage = new PostgresTabularStorage(
      pool,
      "pooled_plain_right",
      RowSchema,
      RowPrimaryKeyNames
    );
    await left.setupDatabase();
    await right.setupDatabase();
    await left.put({ name: "a", tag: "left-row" });
    await right.put({ name: "a", tag: "right-row" });

    const rightQueries = countQueries(right);
    const rows = await left.join(
      {
        type: "inner",
        on: [{ left: "name", right: "name" }],
        orderBy: [{ side: "left", column: "name", direction: "ASC" }],
      },
      right
    );

    expect(rows.map((row) => `${row.left.tag}:${row.right.tag}`)).toEqual(["left-row:right-row"]);
    expect(rightQueries()).toBe(0);
  });
});
