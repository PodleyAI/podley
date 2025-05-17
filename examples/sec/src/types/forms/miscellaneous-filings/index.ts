//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_8_K } from "./Form_8_K";
import { Form_N_30B_2 } from "./Form_N_30B_2";
import { Form_2_E } from "./Form_2_E";
import { Form_SP_15D2 } from "./Form_SP_15D2";
import { Form_NT_15D2 } from "./Form_NT_15D2";
import { Form_6_K } from "./Form_6_K";
import { Form_8_K12B } from "./Form_8_K12B";
import { Form_8_K12G3 } from "./Form_8_K12G3";
import { Form_8_K15D5 } from "./Form_8_K15D5";
import { Form_BULK } from "./Form_BULK";
import { Form_SD } from "./Form_SD";
import { Form_TH } from "./Form_TH";
import { Form_12G3_2B } from "./Form_12G3_2B";
import { Form_REVOKED } from "./Form_REVOKED";
import { Form_DEL_AM } from "./Form_DEL_AM";
import { Form_CERT } from "./Form_CERT";
import { Form_487 } from "./Form_487";
import { Form_485A24E } from "./Form_485A24E";
import { Form_485A24F } from "./Form_485A24F";
import { Form_485APOS } from "./Form_485APOS";
import { Form_485B24E } from "./Form_485B24E";
import { Form_485B24F } from "./Form_485B24F";
import { Form_485BPOS } from "./Form_485BPOS";
import { Form_485BXT } from "./Form_485BXT";
import { Form_AW_WD } from "./Form_AW_WD";
import { Form_SUPPL } from "./Form_SUPPL";
import { Form_SE } from "./Form_SE";

export const MISCELLANEOUS_FILINGS_FORM_NAMES = [
  ...Form_AW_WD.forms,
  ...Form_SUPPL.forms,
  ...Form_8_K.forms,
  ...Form_N_30B_2.forms,
  ...Form_2_E.forms,
  ...Form_SP_15D2.forms,
  ...Form_NT_15D2.forms,
  ...Form_6_K.forms,
  ...Form_8_K12B.forms,
  ...Form_8_K12G3.forms,
  ...Form_8_K15D5.forms,
  ...Form_BULK.forms,
  ...Form_SD.forms,
  ...Form_TH.forms,
  ...Form_12G3_2B.forms,
  ...Form_REVOKED.forms,
  ...Form_DEL_AM.forms,
  ...Form_CERT.forms,
  ...Form_487.forms,
  ...Form_485A24E.forms,
  ...Form_485A24F.forms,
  ...Form_485APOS.forms,
  ...Form_485B24E.forms,
  ...Form_485B24F.forms,
  ...Form_485BPOS.forms,
  ...Form_485BXT.forms,
  ...Form_SE.forms,
] as const;

export type MiscellaneousFilingForm = (typeof MISCELLANEOUS_FILINGS_FORM_NAMES)[number];
