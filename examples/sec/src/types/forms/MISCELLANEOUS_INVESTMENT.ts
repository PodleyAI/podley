//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const MISCELLANEOUS_INVESTMENT = [
  ["N-CR", "Current Report of Money Market Fund Material Events"],
  ["N-CR/A", "Amendment to a previously filed N-CR."],
  ["N-LIQUID", "Current Report Open-End Management Investment Company Liquidity"],
  ["N-LIQUID/A", "Amendment to a previously filed N-LIQUID."],
] as const;
export const MISCELLANEOUS_INVESTMENT_COMPANY_REPORT_FORM_NAMES = MISCELLANEOUS_INVESTMENT.map(
  ([name]) => name
);
export type MiscellaneousInvestmentCompanyReportForm =
  (typeof MISCELLANEOUS_INVESTMENT_COMPANY_REPORT_FORM_NAMES)[number];
