//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_10_12B } from "./Form_10_12B";
import { Form_10_12G } from "./Form_10_12G";
import { Form_10SB12B } from "./Form_10SB12B";
import { Form_10SB12G } from "./Form_10SB12G";
import { Form_18_12B } from "./Form_18_12B";
import { Form_18_12G } from "./Form_18_12G";

export const EXCHANGE_REGISTRATION_FORMS = [
  ...Form_10_12B.forms,
  ...Form_10_12G.forms,
  ...Form_10SB12B.forms,
  ...Form_10SB12G.forms,
  ...Form_18_12B.forms,
  ...Form_18_12G.forms,
] as const;

export type ExchangeRegistrationForm = (typeof EXCHANGE_REGISTRATION_FORMS)[number];
