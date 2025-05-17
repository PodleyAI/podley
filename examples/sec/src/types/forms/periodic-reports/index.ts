//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_ARS } from "./Form_ARS";
import { Form_10K } from "./Form_10K";
import { Form_10K405 } from "./Form_10K405";
import { Form_NT_10K } from "./Form_NT_10K";
import { Form_NTN_10K } from "./Form_NTN_10K";
import { Form_10KSB } from "./Form_10KSB";
import { Form_10C } from "./Form_10C";
import { Form_10KT } from "./Form_10KT";
import { Form_10KSB40 } from "./Form_10KSB40";
import { Form_10KT405 } from "./Form_10KT405";
import { Form_11KT } from "./Form_11KT";
import { Form_18K } from "./Form_18K";
import { Form_11K } from "./Form_11K";
import { Form_NT_11K } from "./Form_NT_11K";
import { Form_SBSEA } from "./Form_SBSEA";
import { Form_SBSEC } from "./Form_SBSEC";
import { Form_NSARA } from "./Form_NSARA";
import { Form_NSARAT } from "./Form_NSARAT";
import { Form_NSARB } from "./Form_NSARB";
import { Form_NSARBT } from "./Form_NSARBT";
import { Form_NSARU } from "./Form_NSARU";
import { Form_NT_NSAR } from "./Form_NT_NSAR";
import { Form_N30D } from "./Form_N30D";
import { Form_20F } from "./Form_20F";
import { Form_NT_20F } from "./Form_NT_20F";
import { Form_10_Q } from "./Form_10_Q";
import { Form_NTN_10Q } from "./Form_NTN_10Q";
import { Form_10QSB } from "./Form_10QSB";
import { Form_NT_10_Q } from "./Form_NT_10_Q";
import { Form_10_QT } from "./Form_10_QT";
import { Form_13F_E } from "./Form_13F_E";
import { Form_13F_HR } from "./Form_13F_HR";
import { Form_13F_NT } from "./Form_13F_NT";
import { Form_NTFNSAR } from "./Form_NTFNSAR";

export const ANNUAL_REPORT_FORM_NAMES = [
  ...Form_ARS.forms,
  ...Form_10K.forms,
  ...Form_10K405.forms,
  ...Form_NT_10K.forms,
  ...Form_NTN_10K.forms,
  ...Form_10KSB.forms,
  ...Form_10C.forms,
  ...Form_10KT.forms,
  ...Form_10KSB40.forms,
  ...Form_10KT405.forms,
  ...Form_11KT.forms,
  ...Form_18K.forms,
  ...Form_11K.forms,
  ...Form_NT_11K.forms,
  ...Form_SBSEA.forms,
  ...Form_SBSEC.forms,
  ...Form_NSARA.forms,
  ...Form_NSARAT.forms,
  ...Form_NSARB.forms,
  ...Form_NSARBT.forms,
  ...Form_NSARU.forms,
  ...Form_NT_NSAR.forms,
  ...Form_N30D.forms,
  ...Form_20F.forms,
  ...Form_NT_20F.forms,
  ...Form_NTFNSAR.forms,
] as const;

export type AnnualReportForm = (typeof ANNUAL_REPORT_FORM_NAMES)[number];

export const QUARTERLY_REPORT_FORM_NAMES = [
  ...Form_10_Q.forms,
  ...Form_NTN_10Q.forms,
  ...Form_10QSB.forms,
  ...Form_NT_10_Q.forms,
  ...Form_10_QT.forms,
  ...Form_13F_E.forms,
  ...Form_13F_HR.forms,
  ...Form_13F_NT.forms,
] as const;

export type QuarterlyReportForm = (typeof QUARTERLY_REPORT_FORM_NAMES)[number];

export const PERIODIC_REPORT_FORM_NAMES = [
  ...ANNUAL_REPORT_FORM_NAMES,
  ...QUARTERLY_REPORT_FORM_NAMES,
] as const;

export type PeriodicReportForm = (typeof PERIODIC_REPORT_FORM_NAMES)[number];
