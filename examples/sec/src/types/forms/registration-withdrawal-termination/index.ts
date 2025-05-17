//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_15_12B } from "./Form_15_12B";
import { Form_15_12G } from "./Form_15_12G";
import { Form_15_15D } from "./Form_15_15D";
import { Form_15F_12B } from "./Form_15F_12B";
import { Form_15F_12G } from "./Form_15F_12G";
import { Form_15F_15D } from "./Form_15F_15D";
import { Form_24F_2TM } from "./Form_24F_2TM";
import { Form_8_A12B } from "./Form_8_A12B";
import { Form_8_A12G } from "./Form_8_A12G";
import { Form_8_B12B } from "./Form_8_B12B";
import { Form_8_B12G } from "./Form_8_B12G";
import { Form_8A12BEF } from "./Form_8A12BEF";
import { Form_8A12BT } from "./Form_8A12BT";
import { Form_RW } from "./Form_RW";
import { Form_AW } from "./Form_AW";

export const REGISTRATION_WITHDRAWAL_TERMINATION_FORMS = [
  ...Form_15_12B.forms,
  ...Form_15_12G.forms,
  ...Form_15_15D.forms,
  ...Form_15F_12B.forms,
  ...Form_15F_12G.forms,
  ...Form_15F_15D.forms,
  ...Form_24F_2TM.forms,
  ...Form_8_A12B.forms,
  ...Form_8_A12G.forms,
  ...Form_8_B12B.forms,
  ...Form_8_B12G.forms,
  ...Form_8A12BEF.forms,
  ...Form_8A12BT.forms,
  ...Form_RW.forms,
  ...Form_AW.forms,
] as const;

export type RegistrationWithdrawalTerminationForm =
  (typeof REGISTRATION_WITHDRAWAL_TERMINATION_FORMS)[number];
