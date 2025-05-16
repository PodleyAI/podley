//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const INSIDER_TRADING = [
  [
    "3",
    "An initial filing of equity securities filed by every director, officer, or owner of more than ten percent of a class of equity securities.",
  ],
  [
    "3/A",
    "An amendment to a 3 filing. This form is not required to be filed with the EDGAR system.",
  ],
  ["4", "Any changes to a previously filed form 3 are reported in this filing."],
  ["4/A", "Amendment to a previously filed 4."],
  [
    "5",
    "An annual statement of ownership of securities filed by every director, officer, or owner of more than ten percent of a class of equity securities.",
  ],
  ["5/A", "Amendment to a previously filed 5."],
  [
    "144",
    'This form must be filed by "insiders" prior to their intended sale of restricted stock. A Form 144 is NOT an EDGAR electronic filing; each 144 is filed by the seller in paper during the day at the SEC.',
  ],
  ["144/A", "Amendment to a previously filed 144."],
] as const;
export const INSIDER_TRADING_FORM_NAMES = INSIDER_TRADING.map(([name]) => name);
export type InsiderTradingForm = (typeof INSIDER_TRADING_FORM_NAMES)[number];
