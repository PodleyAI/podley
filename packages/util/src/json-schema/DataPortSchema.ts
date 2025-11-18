/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsonSchema } from "./JsonSchema";

export type DataPortSchemaObject = JsonSchema &
  (
    | { type: "object"; properties: Record<string, JsonSchema> }
    | {
        readonly type: "object";
        readonly properties: Record<string, JsonSchema>;
      }
  );

export type DataPortSchema = boolean | DataPortSchemaObject;
