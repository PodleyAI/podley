//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_ABS_EE } from "./Form_ABS_EE";
import { Form_ABS_15G } from "./Form_ABS_15G";
import { Form_10D } from "./Form_10D";
import { Form_SF3 } from "./Form_SF3";
import { Form_SF1 } from "./Form_SF1";

export const ASSET_BACKED_EXHIBIT_FORM_NAMES = [
  ...Form_ABS_EE.forms,
  ...Form_ABS_15G.forms,
  ...Form_10D.forms,
  ...Form_SF3.forms,
  ...Form_SF1.forms,
] as const;

export type AssetBackedExhibitForm = (typeof ASSET_BACKED_EXHIBIT_FORM_NAMES)[number];
