//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const MUNICIPAL_ADVISOR = [
  [
    "MA",
    "Application for municipal advisor registration under Section 15B(a)(1) of the Exchange Act.",
  ],
  ["MA/A", "Amendment to a previously filed MA."],
  [
    "MA-A",
    "Annual update of municipal advisor registration under Section 15B(a)(2) of the Exchange Act.",
  ],
  ["MA-A/A", "Amendment to a previously filed MA-A."],
  ["MA-I", "Information regarding natural persons who engage in municipal advisory activities."],
  [
    "MA-A",
    "Annual update of municipal advisor registration under Section 15B(a)(2) of the Exchange Act.",
  ],
  ["MA-I/A", "Amendment to a previously filed MA-I."],
] as const;
export const MUNICIPAL_ADVISOR_FORM_NAMES = MUNICIPAL_ADVISOR.map(([name]) => name);
export type MunicipalAdvisorForm = (typeof MUNICIPAL_ADVISOR_FORM_NAMES)[number];
