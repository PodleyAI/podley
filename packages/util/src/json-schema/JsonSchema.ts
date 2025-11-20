/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExtendedJSONSchema } from "json-schema-to-ts";

export type JsonSchemaCustomProps = {
  "x-semantic"?: string;
  "x-group"?: string;
  "x-replicate"?: boolean;
};

export type JsonSchema = ExtendedJSONSchema<JsonSchemaCustomProps>;
