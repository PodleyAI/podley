//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const EXCHANGE_LISTING_WITHDRAWAL = [
  [
    "25",
    "Notification filed by issuer to voluntarily withdraw a class of securities from listing and registration on a national securities exchange.",
  ],
  ["25/A", "Amendment to a previously filed 25."],
  [
    "25-NSE",
    "Notification filed by a national securities exchange to remove matured, redeemed, or retired securities from listing.",
  ],
  ["25-NSE/A", "Amendment to a previously filed 25-NSE."],
] as const;
export const EXCHANGE_LISTING_WITHDRAWAL_FORM_NAMES = EXCHANGE_LISTING_WITHDRAWAL.map(
  ([name]) => name
);
export type ExchangeListingWithdrawalForm = (typeof EXCHANGE_LISTING_WITHDRAWAL_FORM_NAMES)[number];
