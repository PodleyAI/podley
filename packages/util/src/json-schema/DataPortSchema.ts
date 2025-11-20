/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsonSchema } from "./JsonSchema";

export type DataPortSchemaNonBoolean = Exclude<JsonSchema, Boolean>;
export type DataPortSchemaObject = DataPortSchemaNonBoolean & {
  readonly type: "object";
  readonly properties: Record<string, DataPortSchemaNonBoolean>;
};

export type DataPortSchema = boolean | DataPortSchemaObject;
