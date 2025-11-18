//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { ExtendedJSONSchema } from "json-schema-to-ts";

export type JsonSchema = ExtendedJSONSchema<{
  "x-replicate"?: boolean;
  "x-semantic"?: string;
  "x-optional"?: boolean;
  "x-isArray"?: boolean;
  "x-isNullable"?: boolean;
}>;
