//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_TA_1 } from "./Form_TA_1";
import { Form_TA_2 } from "./Form_TA_2";
import { Form_TA_W } from "./Form_TA_W";

export const TRANSFER_AGENT_FORM_NAMES = [
  ...Form_TA_1.forms,
  ...Form_TA_2.forms,
  ...Form_TA_W.forms,
] as const;

export type TransferAgentForm = (typeof TRANSFER_AGENT_FORM_NAMES)[number];
