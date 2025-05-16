//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const NRSRO = [
  [
    "NRSRO-UPD",
    "Update of registration for Nationally Recognized Statistical Rating Organizations.",
  ],
  ["NRSRO-CE", "Annual certification for Nationally Recognized Statistical Rating Organizations."],
  ["NRSRO-CE/A", "Amendment to a previously filed NRSRO-CE."],
  [
    "NRSRO-WCLS",
    "Withdrawal from credit rating class for Nationally Recognized Statistical Rating Organizations.",
  ],
  [
    "NRSRO-WREG",
    "Withdrawal from registration as Nationally Recognized Statistical Rating Organization.",
  ],
  [
    "NRSRO-FR",
    "Annual financial or other reports for Nationally Recognized Statistical Rating Organizations, as required by Rule 17g-3 (non-public).",
  ],
  ["NRSRO-FR/A", "Amendment to a previously filed NRSRO-FR."],
] as const;
export const NRSRO_FORM_NAMES = NRSRO.map(([name]) => name);
export type NrsroForm = (typeof NRSRO_FORM_NAMES)[number];
