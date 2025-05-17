//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_U_1 } from "./Form_U_1";
import { Form_U_13_1 } from "./Form_U_13_1";
import { Form_U_12_IB } from "./Form_U_12_IB";
import { Form_U_13E_1 } from "./Form_U_13E_1";
import { Form_U_13_60 } from "./Form_U_13_60";
import { Form_U_33_S } from "./Form_U_33_S";
import { Form_U_3A_2 } from "./Form_U_3A_2";
import { Form_U_3A3_1 } from "./Form_U_3A3_1";
import { Form_U_57 } from "./Form_U_57";
import { Form_U_6B_2 } from "./Form_U_6B_2";
import { Form_U_7D } from "./Form_U_7D";
import { Form_U_R_1 } from "./Form_U_R_1";
import { Form_45B_3 } from "./Form_45B_3";
import { Form_U5A } from "./Form_U5A";
import { Form_U5B } from "./Form_U5B";
import { Form_U5S } from "./Form_U5S";
import { Form_U_9C_3 } from "./Form_U_9C_3";
import { Form_U_12_IA } from "./Form_U_12_IA";
import { Form_35_APP } from "./Form_35_APP";
import { Form_35_CERT } from "./Form_35_CERT";

export const PUBLIC_UTILITY_HOLDING_COMPANY_ACT_FORMS = [
  ...Form_U_1.forms,
  ...Form_U_13_1.forms,
  ...Form_U_12_IB.forms,
  ...Form_U_13E_1.forms,
  ...Form_U_13_60.forms,
  ...Form_U_33_S.forms,
  ...Form_U_3A_2.forms,
  ...Form_U_3A3_1.forms,
  ...Form_U_57.forms,
  ...Form_U_6B_2.forms,
  ...Form_U_7D.forms,
  ...Form_U_R_1.forms,
  ...Form_45B_3.forms,
  ...Form_U5A.forms,
  ...Form_U5B.forms,
  ...Form_U5S.forms,
  ...Form_U_9C_3.forms,
  ...Form_U_12_IA.forms,
  ...Form_35_APP.forms,
  ...Form_35_CERT.forms,
] as const;

export type PublicUtilityHoldingCompanyActForm =
  (typeof PUBLIC_UTILITY_HOLDING_COMPANY_ACT_FORMS)[number];
