//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const REGISTERED_INVESTMENT_COMPANIES = [
  ["N-CEN", "Annual Report for Registered Investment Companies"],
  ["N-CEN/A", "Amendment to a previously filed N-CEN."],
  ["NT N-CEN", "Notice under Exchange Act Rule 12b-25 of inability to timely file Form N-CEN."],
  [
    "N-CSR",
    "Certified annual shareholder report of registered management investment companies filed on Form N-CSR.",
  ],
  ["N-CSR/A", "Amendment to a previously filed N-CSR."],
  [
    "N-CSRS",
    "Certified semi-annual shareholder report of registered management investment companies filed on Form N-CSRS.",
  ],
  ["N-CSRS/A", "Amendment to a previously filed N-CSRS."],
  ["N-MFP1", "Monthly Schedule of Portfolio Holdings of Money Market Funds on Form N-MFP1."],
  ["N-MFP1/A", "Amendment to a previously filed N-MFP1."],
  ["NT N-MFP1", "Notification that Form N-MFP1 will be submitted late."],
  ["N-MFP3", "Monthly distribution and dividend report of Money Market Funds on Form N-MFP3."],
  ["N-MFP3/A", "Amendment to a previously filed N-MFP3."],
  ["N-MFP", "Generic monthly report of Money Market Funds on Form N-MFP."],
  ["N-MFP/A", "Amendment to a previously filed N-MFP."],
  ["NT N-MFP", "Notice under Exchange Act Rule 12b-25 of inability to timely file Form N-MFP."],
  ["N-MFP2", "Monthly Schedule of Portfolio Holdings of Money Market Funds on Form N-MFP2."],
  ["N-MFP2/A", "Amendment to a previously filed N-MFP2."],
  ["NT N-MFP2", "Notice under Exchange Act Rule 12b-25 of inability to timely file Form N-MFP2."],
  [
    "N-VPFS",
    "Financial statements for certain variable contracts filed pursuant to the Investment Company Act.",
  ],
  ["N-VPFS/A", "Amendment to a previously filed N-VPFS."],
  ["NPORT-EX", "Portfolio Holdings Exhibit to Form N-PORT."],
  ["NPORT-EX/A", "Amendment to a previously filed NPORT-EX."],
  ["NPORT-NP", "Monthly Portfolio Investments Report on Form N-PORT (Non-Public)."],
  ["NPORT-NP/A", "Amendment to a previously filed NPORT-NP."],
  ["NPORT-P", "Monthly Portfolio Investments Report on Form N-PORT (Public)."],
  ["NPORT-P/A", "Amendment to a previously filed NPORT-P."],
  [
    "N-PX",
    "Annual Report of Proxy Voting Record of Registered Management Investment Companies filed on Form N-PX.",
  ],
  ["N-PX/A", "Amendment to a previously filed N-PX."],
  ["N-PX-CR", "Annual Form N-PX Combination Report filed by institutional managers."],
  ["N-PX-CR/A", "Amendment to a previously filed N-PX-CR."],
  ["N-PX-FM", "Annual Form N-PX Voting Record filed by institutional managers."],
  ["N-PX-FM/A", "Amendment to a previously filed N-PX-FM."],
  ["N-PX-NT", "Annual Form N-PX Notice filed by institutional managers."],
  ["N-PX-NT/A", "Amendment to a previously filed N-PX-NT."],
  ["N-PX-VR", "Annual Form N-PX Voting Record filed by institutional managers."],
  ["N-PX-VR/A", "Amendment to a previously filed N-PX-VR."],
  [
    "N-Q",
    "Quarterly Schedule of Portfolio Holdings of Registered Management Investment Company filed on Form N-Q.",
  ],
  ["N-Q/A", "Amendment to a previously filed N-Q."],
] as const;
export const REGISTERED_INVESTMENT_COMPANIES_FORM_NAMES = REGISTERED_INVESTMENT_COMPANIES.map(
  ([name]) => name
);
export type RegisteredInvestmentCompaniesForm =
  (typeof REGISTERED_INVESTMENT_COMPANIES_FORM_NAMES)[number];
