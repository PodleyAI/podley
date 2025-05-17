//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_NRSRO } from "./Form_NRSRO";
import { Form_NRSRO_IQ } from "./Form_NRSRO_IQ";
import { Form_NRSRO_WP } from "./Form_NRSRO_WP";

export const NRSRO_FORM_NAMES = [
  ...Form_NRSRO.forms,
  ...Form_NRSRO_IQ.forms,
  ...Form_NRSRO_WP.forms,
] as const;

export type NRSROForm = (typeof NRSRO_FORM_NAMES)[number];
