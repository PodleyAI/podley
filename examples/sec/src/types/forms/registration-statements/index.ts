//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_424 } from "./Form_424";
import { Form_424B8 } from "./Form_424B8";
import { Form_424H } from "./Form_424H";
import { Form_425 } from "./Form_425";
import { Form_DRS } from "./Form_DRS";
import { Form_FWP } from "./Form_FWP";
import { Form_POS_AM } from "./Form_POS_AM";
import { Form_POS_AMI } from "./Form_POS_AMI";
import { Form_S_1 } from "./Form_S_1";
import { Form_S_2 } from "./Form_S_2";
import { Form_S_3 } from "./Form_S_3";
import { Form_S_3D } from "./Form_S_3D";
import { Form_S_4 } from "./Form_S_4";
import { Form_S_6 } from "./Form_S_6";
import { Form_S_6EL24 } from "./Form_S_6EL24";
import { Form_S_8 } from "./Form_S_8";
import { Form_S_11 } from "./Form_S_11";
import { Form_S_20 } from "./Form_S_20";
import { Form_SB } from "./Form_SB";
import { Form_SB_1 } from "./Form_SB_1";
import { Form_SB_2 } from "./Form_SB_2";
import { Form_S_3ASR } from "./Form_S_3ASR";
import { Form_POSASR } from "./Form_POSASR";
import { Form_POS462B } from "./Form_POS462B";
import { Form_POS462C } from "./Form_POS462C";
import { Form_486APOS } from "./Form_486APOS";
import { Form_486BPOS } from "./Form_486BPOS";
import { Form_POS_EX } from "./Form_POS_EX";
import { Form_POS_8C } from "./Form_POS_8C";
import { Form_POS_AMC } from "./Form_POS_AMC";
import { Form_486BXT } from "./Form_486BXT";

export const REGISTRATION_STATEMENT_FORM_NAMES = [
  ...Form_424.forms,
  ...Form_424B8.forms,
  ...Form_424H.forms,
  ...Form_425.forms,
  ...Form_DRS.forms,
  ...Form_FWP.forms,
  ...Form_POS_AM.forms,
  ...Form_POS_AMI.forms,
  ...Form_S_1.forms,
  ...Form_S_2.forms,
  ...Form_S_3.forms,
  ...Form_S_3D.forms,
  ...Form_S_4.forms,
  ...Form_S_6.forms,
  ...Form_S_6EL24.forms,
  ...Form_S_8.forms,
  ...Form_S_11.forms,
  ...Form_S_20.forms,
  ...Form_SB.forms,
  ...Form_SB_1.forms,
  ...Form_SB_2.forms,
  ...Form_S_3ASR.forms,
  ...Form_POSASR.forms,
  ...Form_POS462B.forms,
  ...Form_POS462C.forms,
  ...Form_486APOS.forms,
  ...Form_486BPOS.forms,
  ...Form_POS_EX.forms,
  ...Form_POS_8C.forms,
  ...Form_POS_AMC.forms,
  ...Form_486BXT.forms,
] as const;

export type RegistrationStatementForm = (typeof REGISTRATION_STATEMENT_FORM_NAMES)[number];
