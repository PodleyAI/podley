//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const DEVELOPMENT_BANK = [
  ["ANNLRPT", "Periodic Development Bank filing, submitted annually."],
  ["ANNLRPT/A", "Amendment to a previously filed ANNLRPT."],
  ["QRTLYRPT", "Quarterly report of Development Bank, submitted quarterly."],
  ["QRTLYRPT/A", "Amendment to a previously filed QRTLYRPT."],
  ["DSTRBRPT", "Distribution of primary obligations Development Bank report."],
  ["DSTRBRPT/A", "Amendment to a previously filed DSTRBRPT."],
] as const;
export const DEVELOPMENT_BANK_FORM_NAMES = DEVELOPMENT_BANK.map(([name]) => name);
export type DevelopmentBankForm = (typeof DEVELOPMENT_BANK_FORM_NAMES)[number];
