/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExtendedJSONSchema } from "json-schema-to-ts";

export type JsonSchema = ExtendedJSONSchema<{
  "x-replicate"?: boolean;
  "x-semantic"?: string;
  "x-optional"?: boolean;
  "x-isArray"?: boolean;
  "x-isNullable"?: boolean;
}>;
