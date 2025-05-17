//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_MA } from "./Form_MA";
import { Form_MA_A } from "./Form_MA_A";
import { Form_MA_I } from "./Form_MA_I";

export const MUNICIPAL_ADVISOR_FORM_NAMES = [
  ...Form_MA.forms,
  ...Form_MA_A.forms,
  ...Form_MA_I.forms,
] as const;
export type MunicipalAdvisorForm = (typeof MUNICIPAL_ADVISOR_FORM_NAMES)[number];
