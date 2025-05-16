//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const EXEMPT_OFFERINGS = [
  ["1-A", "Reg-A Offering Statement"],
  ["1-A/A", "Pre-qualification amendment for offering statement"],
  ["1-A POS", "Post-qualification amendment to offering statement"],
  ["1-A-W", "Offering Statement Withdrawal"],
  ["1-A-W/A", "Offering Statement Withdrawal Amendment"],
  ["1-K", "Annual report pursuant to Regulation A."],
  ["1-K/A", "Amendment to a previously filed 1-K."],
  ["1-SA", "Semiannual report pursuant to Regulation A."],
  ["1-SA/A", "Amendment to a previously filed 1-SA."],
  ["1-U", "Current report pursuant to Regulation A."],
  ["1-U/A", "Amendment to a previously filed 1-U."],
  ["1-Z", "Exit report pursuant to Regulation A."],
  ["1-Z/A", "Amendment to a previously filed 1-Z."],
  ["1-Z-W", "Withdrawal of exit report under Regulation A."],
  ["1-Z-W/A", "Amendment to a previously filed 1-Z-W."],
  ["DOS", "Confidential draft offering statement"],
  ["DOS/A", "Confidential draft pre-qualification amendment for offering statement"],
  ["DOSLTR", "Confidential draft offering statement letter"],
  ["C", "Offering Statement (Regulation Crowdfunding)"],
  ["C-W", "Offering Statement Withdrawal"],
  ["C/A", "Amendment to Offering Statement"],
  ["C/A-W", "Amendment to Offering Statement Withdrawal"],
  ["C-U", "Progress Update"],
  ["C-U-W", "Progress Update Withdrawal"],
  ["C-AR", "Annual Report"],
  ["C-AR-W", "Annual Report Withdrawal"],
  ["C-AR/A", "Annual Report Amendment"],
  ["C-AR/A-W", "Annual Report Amendment Withdrawal"],
  ["C-TR", "Termination of Reporting"],
  ["C-TR-W", "Termination of Reporting Withdrawal"],
  ["D", "Notice of sales of unregistered securities"],
  ["D/A", "An amendment to a form D filing."],
  [
    "REGDEX",
    "Notice of sale of securities under Regulation D and Section 4(6) of the Securities Act.",
  ],
  ["REGDEX/A", "Amendment to a previously filed REGDEX."],
  ["253G1", "Notice of sales of unregistered securities"],
  ["253G2", "Notice of sales of unregistered securities"],
  ["253G3", "Notice of sales of unregistered securities"],
  ["253G4", "Notice of sales of unregistered securities"],
  ["QUALIF", "Qualification of an offering statement and ready to sell."],
] as const;
export const EXEMPT_OFFERING_FORM_NAMES = EXEMPT_OFFERINGS.map(([name]) => name);
export type ExemptOfferingForm = (typeof EXEMPT_OFFERING_FORM_NAMES)[number];
