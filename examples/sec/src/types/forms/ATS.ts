//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const ATS = [
  ["ATS-N", "Initial Form ATS-N (Rule 304(a)(1)(i))."],
  ["ATS-N/CA", "Correcting Amendment (Rule 304(a)(2)(i)(C))."],
  ["ATS-N/MA", "Material Amendment (Rule 304(a)(2)(i)(A))."],
  ["ATS-N/OFA", "Order Display and Fair Access Amendment (Rule 304(a)(2)(i)(D))."],
  ["ATS-N/UA", "Updating Amendment (Rule 304(a)(2)(i)(B))."],
  ["ATS-N-C", "Notice of Cessation (Rule 304(a)(3))."],
  ["ATS-N-W", "Withdrawal of Form ATS-N filing."],
] as const;
export const ATS_FORM_NAMES = ATS.map(([name]) => name);
export type AtsForm = (typeof ATS_FORM_NAMES)[number];
