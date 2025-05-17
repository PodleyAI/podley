//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_F_1 } from "./Form_F_1";
import { Form_F_1MEF } from "./Form_F_1MEF";
import { Form_F_2 } from "./Form_F_2";
import { Form_F_2D } from "./Form_F_2D";
import { Form_F_2DPOS } from "./Form_F_2DPOS";
import { Form_F_2MEF } from "./Form_F_2MEF";
import { Form_F_3 } from "./Form_F_3";
import { Form_F_3ASR } from "./Form_F_3ASR";
import { Form_F_3D } from "./Form_F_3D";
import { Form_F_3DPOS } from "./Form_F_3DPOS";
import { Form_F_4 } from "./Form_F_4";
import { Form_F_6 } from "./Form_F_6";
import { Form_F_6_POS } from "./Form_F_6_POS";
import { Form_F_6EF } from "./Form_F_6EF";
import { Form_F_10 } from "./Form_F_10";
import { Form_F_10EF } from "./Form_F_10EF";
import { Form_F_10POS } from "./Form_F_10POS";
import { Form_F_N } from "./Form_F_N";
import { Form_CB } from "./Form_CB";
import { Form_F_X } from "./Form_F_X";
import { Form_20FR12B } from "./Form_20FR12B";
import { Form_20FR12G } from "./Form_20FR12G";
import { Form_F_7 } from "./Form_F_7";
import { Form_F_8 } from "./Form_F_8";
import { Form_F_9 } from "./Form_F_9";

export const FOREIGN_REGISTRATION_FORM_NAMES = [
  ...Form_CB.forms,
  ...Form_F_X.forms,
  ...Form_F_1.forms,
  ...Form_20FR12B.forms,
  ...Form_20FR12G.forms,
  ...Form_F_1MEF.forms,
  ...Form_F_2.forms,
  ...Form_F_2D.forms,
  ...Form_F_2DPOS.forms,
  ...Form_F_2MEF.forms,
  ...Form_F_3.forms,
  ...Form_F_3ASR.forms,
  ...Form_F_3D.forms,
  ...Form_F_3DPOS.forms,
  ...Form_F_4.forms,
  ...Form_F_6.forms,
  ...Form_F_6_POS.forms,
  ...Form_F_6EF.forms,
  ...Form_F_7.forms,
  ...Form_F_8.forms,
  ...Form_F_9.forms,
  ...Form_F_10.forms,
  ...Form_F_10EF.forms,
  ...Form_F_10POS.forms,
  ...Form_F_N.forms,
] as const;

export type ForeignRegistrationStatementForm = (typeof FOREIGN_REGISTRATION_FORM_NAMES)[number];
