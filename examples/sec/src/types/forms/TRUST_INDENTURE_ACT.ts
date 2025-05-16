//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const TRUST_INDENTURE_ACT = [
  ["305B2", "Initial statement filed pursuant to the Trust Indenture Act."],
  ["305B2/A", "Amendment to a previously filed 305B2."],
  [
    "T-3",
    "Application for qualification of trust indentures. Filed pursuant to the Trust Indenture Act.",
  ],
  ["T-3/A", "Amendment to a previously filed T-3."],
] as const;
export const TRUST_INDENTURE_ACT_FORM_NAMES = TRUST_INDENTURE_ACT.map(([name]) => name);
export type TrustIndentureActForm = (typeof TRUST_INDENTURE_ACT_FORM_NAMES)[number];
