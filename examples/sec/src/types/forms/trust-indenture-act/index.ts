//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_305B2 } from "./Form_305B2";
import { Form_T_3 } from "./Form_T_3";

export const TRUST_INDENTURE_ACT_FORM_NAMES = [...Form_305B2.forms, ...Form_T_3.forms] as const;

export type TrustIndentureActForm = (typeof TRUST_INDENTURE_ACT_FORM_NAMES)[number];
