//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_ANNLRPT } from "./Form_ANNLRPT";
import { Form_QRTLYRPT } from "./Form_QRTLYRPT";
import { Form_DSTRBRPT } from "./Form_DSTRBRPT";

export const DEVELOPMENT_BANK_FORM_NAMES = [
  ...Form_ANNLRPT.forms,
  ...Form_QRTLYRPT.forms,
  ...Form_DSTRBRPT.forms,
] as const;

export type DevelopmentBankForm = (typeof DEVELOPMENT_BANK_FORM_NAMES)[number];
