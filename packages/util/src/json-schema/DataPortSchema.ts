/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsonSchema } from "./JsonSchema";

export type DataPortSchema =
  | boolean
  | (JsonSchema & ({ type: "object" } | { readonly type: "object" }));
