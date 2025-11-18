/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FromSchema as FromSchemaOriginal } from "json-schema-to-ts";
import { JsonSchema } from "./JsonSchema";

export type FromSchema<SCHEMA extends JsonSchema> = FromSchemaOriginal<
  SCHEMA & { additionalProperties: false },
  {
    parseNotKeyword: false;
    parseIfThenElseKeywords: false;
    keepDefaultedPropertiesOptional: true;
    references: false;
    deserialize: false;
  }
>;

/**
 * IncludeProps - Returns a new schema with only the specified properties
 *
 * This is a schema transformer that returns a new schema object.
 * Use with FromSchema like: FromSchema<IncludeProps<typeof schema, typeof ["prop1", "prop2"]>>
 *
 * @template Schema - The JSON schema object (with 'as const')
 * @template Keys - Readonly array type of property keys to include (use typeof ["key1", "key2"] as const)
 *
 * @example
 * const schema = {
 *   type: "object",
 *   properties: {
 *     name: { type: "string" },
 *     age: { type: "number" },
 *     email: { type: "string" }
 *   },
 *   required: ["name"]
 * } as const;
 *
 * type Filtered = FromSchema<IncludeProps<typeof schema, typeof ["name", "age"]>>;
 * // => { name: string, age?: number }
 */
export type IncludeProps<
  Schema extends {
    readonly type: "object";
    readonly properties: Record<string, any>;
  },
  Keys extends readonly (keyof Schema["properties"])[],
> = {
  readonly type: "object";
  readonly properties: {
    readonly [K in Extract<keyof Schema["properties"], Keys[number]>]: Schema["properties"][K];
  };
};

/**
 * ExcludeProps - Returns a new schema without the specified properties
 *
 * This is a schema transformer that returns a new schema object.
 * Use with FromSchema like: FromSchema<ExcludeProps<typeof schema, typeof ["prop1", "prop2"]>>
 *
 * @template Schema - The JSON schema object (with 'as const')
 * @template Keys - Readonly array type of property keys to exclude (use typeof ["key1", "key2"] as const)
 *
 * @example
 * const schema = {
 *   type: "object",
 *   properties: {
 *     name: { type: "string" },
 *     age: { type: "number" },
 *     email: { type: "string" }
 *   },
 *   required: ["name"]
 * } as const;
 *
 * type Filtered = FromSchema<ExcludeProps<typeof schema, typeof ["email"]>>;
 * // => { name: string, age?: number }
 */
export type ExcludeProps<
  Schema extends {
    readonly type: "object";
    readonly properties: Record<string, any>;
  },
  Keys extends readonly (keyof Schema["properties"])[],
> = {
  readonly type: "object";
  readonly properties: {
    readonly [K in Exclude<keyof Schema["properties"], Keys[number]>]: Schema["properties"][K];
  };
};
