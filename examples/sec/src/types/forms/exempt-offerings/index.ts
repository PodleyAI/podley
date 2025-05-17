//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_1_A } from "./Form_1_A";
import { Form_1_A_POS } from "./Form_1_A_POS";
import { Form_1_A_W } from "./Form_1_A_W";
import { Form_1K } from "./Form_1K";
import { Form_1SA } from "./Form_1SA";
import { Form_1U } from "./Form_1U";
import { Form_1Z } from "./Form_1Z";
import { Form_1ZW } from "./Form_1ZW";
import { Form_DOS } from "./Form_DOS";
import { Form_DOSLTR } from "./Form_DOSLTR";
import { Form_C } from "./Form_C";
import { Form_CW } from "./Form_CW";
import { Form_CU } from "./Form_CU";
import { Form_CUW } from "./Form_CUW";
import { Form_CAR } from "./Form_CAR";
import { Form_CARW } from "./Form_CARW";
import { Form_CTR } from "./Form_CTR";
import { Form_CTRW } from "./Form_CTRW";
import { Form_D } from "./Form_D";
import { Form_REGDEX } from "./Form_REGDEX";
import { Form_253G1 } from "./Form_253G1";
import { Form_253G2 } from "./Form_253G2";
import { Form_253G3 } from "./Form_253G3";
import { Form_253G4 } from "./Form_253G4";
import { Form_QUALIF } from "./Form_QUALIF";
import { Form_TTW } from "./Form_TTW";

export const EXEMPT_OFFERING_FORM_NAMES = [
  ...Form_1_A.forms,
  ...Form_1_A_POS.forms,
  ...Form_1_A_W.forms,
  ...Form_1K.forms,
  ...Form_1SA.forms,
  ...Form_1U.forms,
  ...Form_1Z.forms,
  ...Form_1ZW.forms,
  ...Form_DOS.forms,
  ...Form_DOSLTR.forms,
  ...Form_C.forms,
  ...Form_CW.forms,
  ...Form_CU.forms,
  ...Form_CUW.forms,
  ...Form_CAR.forms,
  ...Form_CARW.forms,
  ...Form_CTR.forms,
  ...Form_CTRW.forms,
  ...Form_D.forms,
  ...Form_REGDEX.forms,
  ...Form_253G1.forms,
  ...Form_253G2.forms,
  ...Form_253G3.forms,
  ...Form_253G4.forms,
  ...Form_QUALIF.forms,
  ...Form_TTW.forms,
] as const;

export type ExemptOfferingForm = (typeof EXEMPT_OFFERING_FORM_NAMES)[number];
