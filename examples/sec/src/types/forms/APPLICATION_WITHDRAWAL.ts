//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const APPLICATION_WITHDRAWAL = [
  [
    "APP WD",
    "Withdrawal of an application for exemptive or other relief from the federal securities laws.",
  ],
  ["APP WD/A", "Amendment to a previously filed APP WD."],
  ["APP ORDR", "Application order under the Investment Company Act of 1940."],
  ["APP NTC", "Application notice under the Investment Company Act of 1940."],
  [
    "APP WDG",
    "Record of automatic withdrawal of an application under the Investment Company Act of 1940.",
  ],
] as const;
export const APPLICATION_WITHDRAWAL_FORM_NAMES = APPLICATION_WITHDRAWAL.map(([name]) => name);
export type ApplicationWithdrawalForm = (typeof APPLICATION_WITHDRAWAL_FORM_NAMES)[number];
