//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_13H } from "./Form_13H";
import { Form_13H_Q } from "./Form_13H_Q";
import { Form_13H_A } from "./Form_13H_A";
import { Form_13H_I } from "./Form_13H_I";
import { Form_13H_R } from "./Form_13H_R";
import { Form_13H_T } from "./Form_13H_T";
import { Form_13FCONP } from "./Form_13FCONP";

export const LARGE_TRADER_FORM_NAMES = [
  ...Form_13H.forms,
  ...Form_13H_Q.forms,
  ...Form_13H_A.forms,
  ...Form_13H_I.forms,
  ...Form_13H_R.forms,
  ...Form_13H_T.forms,
  ...Form_13FCONP.forms,
] as const;

export type LargeTraderForm = (typeof LARGE_TRADER_FORM_NAMES)[number];
