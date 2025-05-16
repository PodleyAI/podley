//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const LARGE_TRADER = [
  ["13H", "Initial large trader registration filing pursuant to Rule 13h-1."],
  ["13H-Q", "Amended large trader filing pursuant to Rule 13h-1."],
  ["13H-A", "Annual large trader filing pursuant to Rule 13h-1."],
  ["13H-I", "Large trader inactive status filing pursuant to Rule 13h-1."],
  ["13H-R", "Large trader reactivation filing pursuant to Rule 13h-1."],
  ["13H-T", "Large trader termination filing pursuant to Rule 13h-1."],
] as const;
export const LARGE_TRADER_FORM_NAMES = LARGE_TRADER.map(([name]) => name);
export type LargeTraderForm = (typeof LARGE_TRADER_FORM_NAMES)[number];
