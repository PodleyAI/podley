//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_3 } from "./Form_3";
import { Form_4 } from "./Form_4";
import { Form_5 } from "./Form_5";
import { Form_144 } from "./Form_144";

export const INSIDER_TRADING_FORM_NAMES = [
  ...Form_3.forms,
  ...Form_4.forms,
  ...Form_5.forms,
  ...Form_144.forms,
] as const;

export type InsiderTradingForm = (typeof INSIDER_TRADING_FORM_NAMES)[number];
