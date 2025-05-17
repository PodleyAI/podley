//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_N_8A } from "./Form_N_8A";
import { Form_N_8B_2 } from "./Form_N_8B_2";
import { Form_N_1 } from "./Form_N_1";
import { Form_N_4_EL } from "./Form_N_4_EL";
import { Form_N_14_AE } from "./Form_N_14_AE";
import { Form_N_14_8C } from "./Form_N_14_8C";
import { Form_N_14AE24 } from "./Form_N_14AE24";
import { Form_24F_1 } from "./Form_24F_1";
import { Form_24F_2EL } from "./Form_24F_2EL";
import { Form_24F_2NT } from "./Form_24F_2NT";
import { Form_40 } from "./Form_40";
import { Form_40FR12B } from "./Form_40FR12B";
import { Form_40FR12G } from "./Form_40FR12G";
import { Form_40OIP } from "./Form_40OIP";
import { Form_OIP_ORDR } from "./Form_OIP_ORDR";
import { Form_OIP_NTC } from "./Form_OIP_NTC";
import { Form_N_6 } from "./Form_N_6";
import { Form_N_6F } from "./Form_N_6F";
import { Form_N_8F } from "./Form_N_8F";
import { Form_N_18F1 } from "./Form_N_18F1";
import { Form_N_23_3 } from "./Form_N_23_3";
import { Form_N_23C_1 } from "./Form_N_23C_1";
import { Form_N_23C_2 } from "./Form_N_23C_2";
import { Form_N_23C_3 } from "./Form_N_23C_3";
import { Form_N_27D_1 } from "./Form_N_27D_1";
import { Form_N_27E_1 } from "./Form_N_27E_1";
import { Form_N_27F_1 } from "./Form_N_27F_1";
import { Form_N_27I_1 } from "./Form_N_27I_1";
import { Form_N_27I_2 } from "./Form_N_27I_2";
import { Form_N_CEN } from "./Form_N_CEN";
import { Form_N_CSR } from "./Form_N_CSR";
import { Form_N_CSRS } from "./Form_N_CSRS";
import { Form_N_MFP1 } from "./Form_N_MFP1";
import { Form_N_MFP3 } from "./Form_N_MFP3";
import { Form_N_MFP } from "./Form_N_MFP";
import { Form_N_MFP2 } from "./Form_N_MFP2";
import { Form_N_VP } from "./Form_N_VP";
import { Form_N_VPFS } from "./Form_N_VPFS";
import { Form_NPORT_EX } from "./Form_NPORT_EX";
import { Form_NPORT_NP } from "./Form_NPORT_NP";
import { Form_NPORT_P } from "./Form_NPORT_P";
import { Form_N_PX } from "./Form_N_PX";
import { Form_N_Q } from "./Form_N_Q";
import { Form_N_1A } from "./Form_N_1A";
import { Form_N_2 } from "./Form_N_2";
import { Form_N_3 } from "./Form_N_3";
import { Form_N_4 } from "./Form_N_4";
import { Form_N_5 } from "./Form_N_5";
import { Form_N_54A } from "./Form_N_54A";
import { Form_N_54C } from "./Form_N_54C";
import { Form_N_14 } from "./Form_N_14";
import { Form_N_14MEF } from "./Form_N_14MEF";
import { Form_N_14AE } from "./Form_N_14AE";
import { Form_N_14EL24 } from "./Form_N_14EL24";
import { Form_497 } from "./Form_497";
import { Form_ADV_NR } from "./Form_ADV_NR";
import { Form_N_CR } from "./Form_N_CR";
import { Form_N_LIQUID } from "./Form_N_LIQUID";
import { Form_6B_ORDR } from "./Form_6B_ORDR";
import { Form_6B_NTC } from "./Form_6B_NTC";

export const INVESTMENT_COMPANY_FORM_NAMES = [
  ...Form_N_8A.forms,
  ...Form_N_8B_2.forms,
  ...Form_N_1.forms,
  ...Form_N_4_EL.forms,
  ...Form_N_14_AE.forms,
  ...Form_N_14_8C.forms,
  ...Form_N_14AE24.forms,
  ...Form_24F_1.forms,
  ...Form_24F_2EL.forms,
  ...Form_24F_2NT.forms,
  ...Form_40.forms,
  ...Form_40FR12B.forms,
  ...Form_40FR12G.forms,
  ...Form_40OIP.forms,
  ...Form_OIP_ORDR.forms,
  ...Form_OIP_NTC.forms,
  ...Form_N_6.forms,
  ...Form_N_6F.forms,
  ...Form_N_8F.forms,
  ...Form_N_18F1.forms,
  ...Form_N_23_3.forms,
  ...Form_N_23C_1.forms,
  ...Form_N_23C_2.forms,
  ...Form_N_23C_3.forms,
  ...Form_N_27D_1.forms,
  ...Form_N_27E_1.forms,
  ...Form_N_27F_1.forms,
  ...Form_N_27I_1.forms,
  ...Form_N_27I_2.forms,
  ...Form_N_CEN.forms,
  ...Form_N_CSR.forms,
  ...Form_N_CSRS.forms,
  ...Form_N_MFP1.forms,
  ...Form_N_MFP3.forms,
  ...Form_N_MFP.forms,
  ...Form_N_MFP2.forms,
  ...Form_N_VP.forms,
  ...Form_N_VPFS.forms,
  ...Form_NPORT_EX.forms,
  ...Form_NPORT_NP.forms,
  ...Form_NPORT_P.forms,
  ...Form_N_PX.forms,
  ...Form_N_Q.forms,
  ...Form_N_1A.forms,
  ...Form_N_2.forms,
  ...Form_N_3.forms,
  ...Form_N_4.forms,
  ...Form_N_5.forms,
  ...Form_N_54A.forms,
  ...Form_N_54C.forms,
  ...Form_N_14.forms,
  ...Form_N_14MEF.forms,
  ...Form_N_14AE.forms,
  ...Form_N_14EL24.forms,
  ...Form_497.forms,
  ...Form_ADV_NR.forms,
  ...Form_N_CR.forms,
  ...Form_N_LIQUID.forms,
  ...Form_6B_NTC.forms,
  ...Form_6B_ORDR.forms,
] as const;

export type InvestmentCompanyForm = (typeof INVESTMENT_COMPANY_FORM_NAMES)[number];
