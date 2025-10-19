//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PGlite } from "@electric-sql/pglite";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a mock Supabase client for testing that uses PGlite as the backend.
 * This provides a real PostgreSQL database for testing without needing a Supabase instance.
 */
export function createSupabaseMockClient(): SupabaseClient {
  const pglite = new PGlite();

  // Create a minimal SupabaseClient-compatible object
  const mockClient = {
    // RPC method for executing raw SQL (used in setup)
    rpc: async (functionName: string, params?: { query?: string }) => {
      if (functionName === "exec_sql" && params?.query) {
        try {
          await pglite.query(params.query);
          return { data: null, error: null };
        } catch (error: any) {
          // Ignore "already exists" errors for tables, types, and indexes
          if (
            error.message?.includes("already exists") ||
            error.code === "42P07" || // relation already exists
            error.code === "42710" || // type already exists
            error.code === "42P06" // schema already exists
          ) {
            return { data: null, error: null };
          }

          // For enum types that don't exist, try to handle gracefully
          if (error.message?.includes("type") && error.message?.includes("does not exist")) {
            console.warn(`Type creation issue: ${error.message}`);
            return { data: null, error: null };
          }

          return { data: null, error };
        }
      }
      return { data: null, error: new Error(`Unknown RPC function: ${functionName}`) };
    },

    // From method for table operations
    from: (table: string) => {
      const queryBuilder = {
        _table: table,
        _select: "*",
        _filters: [] as Array<{ column: string; operator: string; value: any }>,
        _limit: undefined as number | undefined,
        _order: undefined as { column: string; ascending: boolean } | undefined,
        _single: false,

        select: (columns = "*") => {
          queryBuilder._select = columns;
          return queryBuilder;
        },

        insert: (data: any) => {
          return {
            select: () => {
              return {
                single: async () => {
                  try {
                    const isArray = Array.isArray(data);
                    const records = isArray ? data : [data];

                    if (records.length === 0) {
                      return { data: null, error: new Error("No data to insert") };
                    }

                    const keys = Object.keys(records[0]);
                    const values = records
                      .map(
                        (record) =>
                          `(${keys
                            .map((k) => {
                              const val = record[k];
                              if (val === null || val === undefined) return "NULL";
                              if (typeof val === "object")
                                return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                              if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
                              return String(val);
                            })
                            .join(",")})`
                      )
                      .join(",");

                    const query = `INSERT INTO "${queryBuilder._table}" (${keys.map((k) => `"${k}"`).join(",")}) VALUES ${values} RETURNING *`;
                    const result = await pglite.query(query);

                    return { data: result.rows[0], error: null };
                  } catch (error: any) {
                    return { data: null, error };
                  }
                },
              };
            },
          };
        },

        upsert: (data: any, options?: { onConflict?: string }) => {
          const executeUpsert = async () => {
            try {
              const isArray = Array.isArray(data);
              const records = isArray ? data : [data];

              if (records.length === 0) {
                return { data: [], error: null };
              }

              const keys = Object.keys(records[0]);
              const values = records
                .map(
                  (record) =>
                    `(${keys
                      .map((k) => {
                        const val = record[k];
                        if (val === null || val === undefined) return "NULL";
                        if (typeof val === "object")
                          return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
                        return String(val);
                      })
                      .join(",")})`
                )
                .join(",");

              let query = `INSERT INTO "${queryBuilder._table}" (${keys.map((k) => `"${k}"`).join(",")}) VALUES ${values}`;

              if (options?.onConflict) {
                const updateSet = keys
                  .filter((k) => !options.onConflict?.includes(k))
                  .map((k) => `"${k}" = EXCLUDED."${k}"`)
                  .join(", ");
                query += ` ON CONFLICT (${options.onConflict}) DO UPDATE SET ${updateSet}`;
              }

              query += " RETURNING *";

              const result = await pglite.query(query);
              return { data: result.rows, error: null };
            } catch (error: any) {
              return { data: null, error };
            }
          };

          return {
            select: () => {
              return {
                single: async () => {
                  const result = await executeUpsert();
                  if (result.error) return result;
                  // Return single record or first record from array
                  const singleData = Array.isArray(result.data) ? result.data[0] : result.data;
                  return { data: singleData, error: null };
                },
                then: async (resolve: any, reject: any) => {
                  try {
                    const result = await executeUpsert();
                    resolve(result);
                  } catch (error) {
                    reject?.(error);
                  }
                },
              };
            },
            then: async (resolve: any, reject: any) => {
              try {
                const result = await executeUpsert();
                resolve(result);
              } catch (error) {
                reject?.(error);
              }
            },
          };
        },

        update: (data: any) => {
          const updateBuilder = {
            eq: (column: string, value: any) => {
              queryBuilder._filters.push({ column, operator: "=", value });
              return updateBuilder; // Return self for chaining
            },

            select: () => {
              return {
                single: async () => {
                  try {
                    const setClause = Object.entries(data)
                      .map(([k, v]) => {
                        if (v === null || v === undefined) return `"${k}" = NULL`;
                        if (typeof v === "object")
                          return `"${k}" = '${JSON.stringify(v).replace(/'/g, "''")}'`;
                        if (typeof v === "string") return `"${k}" = '${v.replace(/'/g, "''")}'`;
                        return `"${k}" = ${String(v)}`;
                      })
                      .join(", ");

                    const whereClause = queryBuilder._filters
                      .map((f) => {
                        const val = f.value;
                        if (val === null || val === undefined)
                          return `"${f.column}" ${f.operator} NULL`;
                        if (typeof val === "object")
                          return `"${f.column}" ${f.operator} '${JSON.stringify(val).replace(/'/g, "''")}'`;
                        if (typeof val === "string")
                          return `"${f.column}" ${f.operator} '${val.replace(/'/g, "''")}'`;
                        return `"${f.column}" ${f.operator} ${String(val)}`;
                      })
                      .join(" AND ");

                    const query = `UPDATE "${queryBuilder._table}" SET ${setClause} WHERE ${whereClause} RETURNING *`;
                    const result = await pglite.query(query);

                    return {
                      data: result.rows[0] || null,
                      error: null,
                    };
                  } catch (error: any) {
                    return { data: null, error };
                  }
                },
              };
            },
            then: async (resolve: any, reject: any) => {
              try {
                const setClause = Object.entries(data)
                  .map(([k, v]) => {
                    if (v === null || v === undefined) return `"${k}" = NULL`;
                    if (typeof v === "object")
                      return `"${k}" = '${JSON.stringify(v).replace(/'/g, "''")}'`;
                    if (typeof v === "string") return `"${k}" = '${v.replace(/'/g, "''")}'`;
                    return `"${k}" = ${String(v)}`;
                  })
                  .join(", ");

                const whereClause =
                  queryBuilder._filters.length > 0
                    ? queryBuilder._filters
                        .map((f) => {
                          const val = f.value;
                          if (val === null || val === undefined)
                            return `"${f.column}" ${f.operator} NULL`;
                          if (typeof val === "object")
                            return `"${f.column}" ${f.operator} '${JSON.stringify(val).replace(/'/g, "''")}'`;
                          if (typeof val === "string")
                            return `"${f.column}" ${f.operator} '${val.replace(/'/g, "''")}'`;
                          return `"${f.column}" ${f.operator} ${String(val)}`;
                        })
                        .join(" AND ")
                    : "1=1";

                const query = `UPDATE "${queryBuilder._table}" SET ${setClause} WHERE ${whereClause}`;
                await pglite.query(query);

                resolve?.({ data: null, error: null });
              } catch (error: any) {
                reject?.(error);
              }
            },
          };

          return updateBuilder;
        },

        delete: () => {
          return {
            eq: (column: string, value: any) => {
              queryBuilder._filters.push({ column, operator: "=", value });
              return deleteBuilder;
            },
            neq: (column: string, value: any) => {
              queryBuilder._filters.push({ column, operator: "!=", value });
              return deleteBuilder;
            },
            lt: (column: string, value: any) => {
              queryBuilder._filters.push({ column, operator: "<", value });
              return deleteBuilder;
            },
            lte: (column: string, value: any) => {
              queryBuilder._filters.push({ column, operator: "<=", value });
              return deleteBuilder;
            },
            gt: (column: string, value: any) => {
              queryBuilder._filters.push({ column, operator: ">", value });
              return deleteBuilder;
            },
            gte: (column: string, value: any) => {
              queryBuilder._filters.push({ column, operator: ">=", value });
              return deleteBuilder;
            },
            not: (column: string, operator: string, value: any) => {
              if (operator === "is" && value === null) {
                queryBuilder._filters.push({ column, operator: "IS NOT", value: "NULL" });
              }
              return deleteBuilder;
            },
            then: async (resolve: any, reject: any) => {
              try {
                const result = await executeDelete();
                resolve(result);
              } catch (error) {
                reject?.(error);
              }
            },
          };
        },

        eq: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: "=", value });
          return queryBuilder;
        },

        neq: (column: string, value: any) => {
          if (value === null) {
            queryBuilder._filters.push({ column, operator: "IS NOT", value: "NULL" });
          } else {
            queryBuilder._filters.push({ column, operator: "!=", value });
          }
          return queryBuilder;
        },

        lt: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: "<", value });
          return queryBuilder;
        },

        lte: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: "<=", value });
          return queryBuilder;
        },

        gt: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: ">", value });
          return queryBuilder;
        },

        gte: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: ">=", value });
          return queryBuilder;
        },

        order: (column: string, options?: { ascending?: boolean }) => {
          queryBuilder._order = { column, ascending: options?.ascending ?? true };
          return queryBuilder;
        },

        limit: (count: number) => {
          queryBuilder._limit = count;
          return queryBuilder;
        },

        single: async () => {
          queryBuilder._single = true;
          queryBuilder._limit = 1;
          const result = await executeQuery();

          if (result.error) {
            return result;
          }

          if (!result.data || result.data.length === 0) {
            return {
              data: null,
              error: { code: "PGRST116", message: "No rows found" },
            };
          }

          return { data: result.data[0], error: null };
        },
      };

      const executeDelete = async () => {
        try {
          let query = `DELETE FROM "${queryBuilder._table}"`;

          if (queryBuilder._filters.length > 0) {
            const whereClause = queryBuilder._filters
              .map((f) => {
                if (f.operator === "IS NOT" && f.value === "NULL") {
                  return `"${f.column}" IS NOT NULL`;
                }
                const val = f.value;
                if (val === null || val === undefined) return `"${f.column}" ${f.operator} NULL`;
                if (typeof val === "object")
                  return `"${f.column}" ${f.operator} '${JSON.stringify(val).replace(/'/g, "''")}'`;
                if (typeof val === "string")
                  return `"${f.column}" ${f.operator} '${val.replace(/'/g, "''")}'`;
                return `"${f.column}" ${f.operator} ${String(val)}`;
              })
              .join(" AND ");
            query += ` WHERE ${whereClause}`;
          }

          await pglite.query(query);
          return { data: null, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      };

      const deleteBuilder = {
        eq: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: "=", value });
          return deleteBuilder;
        },
        neq: (column: string, value: any) => {
          if (value === null) {
            queryBuilder._filters.push({ column, operator: "IS NOT", value: "NULL" });
          } else {
            queryBuilder._filters.push({ column, operator: "!=", value });
          }
          return deleteBuilder;
        },
        lt: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: "<", value });
          return deleteBuilder;
        },
        lte: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: "<=", value });
          return deleteBuilder;
        },
        gt: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: ">", value });
          return deleteBuilder;
        },
        gte: (column: string, value: any) => {
          queryBuilder._filters.push({ column, operator: ">=", value });
          return deleteBuilder;
        },
        not: (column: string, operator: string, value: any) => {
          if (operator === "is" && value === null) {
            queryBuilder._filters.push({ column, operator: "IS NOT", value: "NULL" });
          }
          return deleteBuilder;
        },
        then: async (resolve: any, reject: any) => {
          try {
            const result = await executeDelete();
            resolve(result);
          } catch (error) {
            reject?.(error);
          }
        },
      };

      const executeQuery = async () => {
        try {
          let query = `SELECT ${queryBuilder._select} FROM "${queryBuilder._table}"`;

          if (queryBuilder._filters.length > 0) {
            const whereClause = queryBuilder._filters
              .map((f) => {
                if (f.operator === "IS NOT" && f.value === "NULL") {
                  return `"${f.column}" IS NOT NULL`;
                }
                const val = f.value;
                if (val === null || val === undefined) return `"${f.column}" ${f.operator} NULL`;
                if (typeof val === "object")
                  return `"${f.column}" ${f.operator} '${JSON.stringify(val).replace(/'/g, "''")}'`;
                if (typeof val === "string")
                  return `"${f.column}" ${f.operator} '${val.replace(/'/g, "''")}'`;
                return `"${f.column}" ${f.operator} ${String(val)}`;
              })
              .join(" AND ");
            query += ` WHERE ${whereClause}`;
          }

          if (queryBuilder._order) {
            query += ` ORDER BY "${queryBuilder._order.column}" ${queryBuilder._order.ascending ? "ASC" : "DESC"}`;
          }

          if (queryBuilder._limit !== undefined) {
            query += ` LIMIT ${queryBuilder._limit}`;
          }

          const result = await pglite.query(query);
          return { data: result.rows, error: null, count: result.rows.length };
        } catch (error: any) {
          return { data: null, error, count: null };
        }
      };

      // Add the missing then method to make it thenable
      return Object.assign(queryBuilder, {
        then: async (resolve: any, reject: any) => {
          try {
            const result = await executeQuery();
            resolve(result);
          } catch (error) {
            reject?.(error);
          }
        },
      });
    },
  };

  return mockClient as unknown as SupabaseClient;
}
