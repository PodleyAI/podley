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
  "x-ui-order"?: number;
  "x-ui-viewer"?: string;
  "x-ui-editor"?: string;
  "x-ui"?: unknown;
};

export type JsonSchema = ExtendedJSONSchema<JsonSchemaCustomProps>;
