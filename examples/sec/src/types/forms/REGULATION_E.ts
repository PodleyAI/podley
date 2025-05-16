//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const REGULATION_E = [
  [
    "1-E",
    "Notification under Regulation E by small business investment companies and business development companies.",
  ],
  ["1-E/A", "Amendment to a previously filed 1-E."],
  ["1-E AD", "Sales material filed pursuant to Rule 607 under Regulation E."],
  ["1-E AD/A", "Amendment to a previously filed 1-E AD."],
] as const;
export const REGULATION_E_FORM_NAMES = REGULATION_E.map(([name]) => name);
export type RegulationEForm = (typeof REGULATION_E_FORM_NAMES)[number];
