//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_ATS_N } from "./Form_ATS_N";

export const ATS_FORM_NAMES = [...Form_ATS_N.forms] as const;

export type AtsForm = (typeof ATS_FORM_NAMES)[number];
