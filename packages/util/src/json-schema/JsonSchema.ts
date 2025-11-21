/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExtendedJSONSchema } from "json-schema-to-ts";

export type JsonSchemaCustomProps = {
  "x-semantic"?: string;
  "x-replicate"?: boolean;
  "x-ui-group"?: string;
  "x-ui-hidden"?: boolean;
  [key: `x-ui-${string}`]: unknown;
};

export type JsonSchema = ExtendedJSONSchema<JsonSchemaCustomProps>;
