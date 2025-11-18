//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { FromSchema as FromSchemaOriginal } from "json-schema-to-ts";
import { JsonSchema } from "./JsonSchema";

export type FromSchema<SCHEMA extends JsonSchema> = FromSchemaOriginal<
  SCHEMA,
  { keepDefaultedPropertiesOptional: true }
>;
