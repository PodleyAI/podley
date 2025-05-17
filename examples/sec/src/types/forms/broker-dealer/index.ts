//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_17HACON } from "./Form_17HACON";
import { Form_17HQCON } from "./Form_17HQCON";
import { Form_X17A5 } from "./Form_X17A5";
import { Form_FOCUSN } from "./Form_FOCUSN";
import { Form_7M } from "./Form_7M";
import { Form_8M } from "./Form_8M";
import { Form_9M } from "./Form_9M";
import { Form_G_FIN } from "./Form_G_FIN";
import { Form_MSD } from "./Form_MSD";
import { Form_REG_NR } from "./Form_REG_NR";

export const BROKER_DEALER_FORM_NAMES = [
  ...Form_17HACON.forms,
  ...Form_17HQCON.forms,
  ...Form_X17A5.forms,
  ...Form_FOCUSN.forms,
  ...Form_7M.forms,
  ...Form_8M.forms,
  ...Form_9M.forms,
  ...Form_G_FIN.forms,
  ...Form_MSD.forms,
  ...Form_REG_NR.forms,
] as const;

export type BrokerDealerForm = (typeof BROKER_DEALER_FORM_NAMES)[number];
