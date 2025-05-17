//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_APP_WD } from "./Form_APP_WD";
import { Form_APP_ORDR } from "./Form_APP_ORDR";
import { Form_APP_NTC } from "./Form_APP_NTC";
import { Form_APP_WDG } from "./Form_APP_WDG";

export const APPLICATION_WITHDRAWAL_FORM_NAMES = [
  ...Form_APP_WD.forms,
  ...Form_APP_ORDR.forms,
  ...Form_APP_NTC.forms,
  ...Form_APP_WDG.forms,
] as const;

export type ApplicationWithdrawalForm = (typeof APPLICATION_WITHDRAWAL_FORM_NAMES)[number];
