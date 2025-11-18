/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FromSchema as FromSchemaOriginal } from "json-schema-to-ts";
import { JsonSchema } from "./JsonSchema";

export type FromSchema<SCHEMA extends JsonSchema> = FromSchemaOriginal<
  SCHEMA,
  { keepDefaultedPropertiesOptional: true }
>;
