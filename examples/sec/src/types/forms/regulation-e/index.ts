//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_1_E } from "./Form_1_E";
import { Form_1_E_AD } from "./Form_1_E_AD";

export const REGULATION_E_FORM_NAMES = [...Form_1_E.forms, ...Form_1_E_AD.forms] as const;

export type RegulationEForm = (typeof REGULATION_E_FORM_NAMES)[number];
