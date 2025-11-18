/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken } from "@podley/util";
import { TSchema, Type } from "@sinclair/typebox";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseTabularRepository } from "../tabular/SupabaseTabularRepository";
import { DefaultKeyValueKey, DefaultKeyValueSchema, IKvRepository } from "./IKvRepository";
import { KvViaTabularRepository } from "./KvViaTabularRepository";

export const SUPABASE_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.supabase"
);

/**
 * A key-value repository implementation that uses Supabase for persistent storage.
 * Leverages a tabular repository abstraction for Supabase operations.
 *
 * @template Key - The type of the primary key
 * @template Value - The type of the value being stored
 * @template Combined - Combined type of Key & Value
 */
export class SupabaseKvRepository extends KvViaTabularRepository {
  public tabularRepository: SupabaseTabularRepository<
    typeof DefaultKeyValueSchema,
    typeof DefaultKeyValueKey
  >;

  /**
   * Creates a new SupabaseKvRepository instance
   *
   * @param client - Supabase client instance
   * @param tableName - Name of the table to store data
   * @param keySchema - Schema for the key type (defaults to string)
   * @param valueSchema - Schema for the value type (defaults to any)
   */
  constructor(
    public client: SupabaseClient,
    public tableName: string,
    keySchema: TSchema = Type.String(),
    valueSchema: TSchema = Type.Any(),
    tabularRepository?: SupabaseTabularRepository<
      typeof DefaultKeyValueSchema,
      typeof DefaultKeyValueKey
    >
  ) {
    super(keySchema, valueSchema);
    this.tabularRepository =
      tabularRepository ??
      new SupabaseTabularRepository(client, tableName, DefaultKeyValueSchema, DefaultKeyValueKey);
  }
}
