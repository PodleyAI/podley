//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const PUBLIC_UTILITY_HOLDING_COMPANY_ACT = [
  ["U-1", "Application of declaration under the Public Utility Holding Company Act."],
  ["U-1/A", "Amendment to a previously filed U-1."],
  [
    "U-13-1",
    "Application for approval for mutual service company filed pursuant to Rule 88 of the Public Utility Holding Company Act.",
  ],
  ["U-13-1/A", "Amendment to a previously filed U-13-1."],
  [
    "U-12-IB",
    "Annual statement pursuant to section 12(i) of the Public Utility Holding Company Act.",
  ],
  ["U-12-IB/A", "Amendment to a U-12-IB."],
  ["U-13E-1", "Report by affiliate service companies or independent service companies."],
  ["U-13E-1/A", "Amendment to a U-13E-1."],
  [
    "U-13-60",
    "Annual report for mutual and subsidiary service companies filed pursuant to Rule 94 of the Public Utility Holding Company Act.",
  ],
  ["U-13-60/A", "Amendment to a previously filed U-13-60."],
  [
    "U-33-S",
    "Annual report concerning Foreign Utility Companies pursuant to section 33(e) of the Public Utility Holding Company Act.",
  ],
  [
    "U-3A-2",
    "Statement by holding company claiming exemption from provisions of the act pursuant to Rule 2.",
  ],
  ["U-3A-2/A", "Amendment to a previously filed U-3A-2."],
  [
    "U-3A3-1",
    "Twelve-month statement by bank claiming exemption from provisions of the act pursuant to Rule 3 of the Public Utility Holding Company Act.",
  ],
  ["U-3A3-1/A", "Amendment to a previously filed U-3A3-1."],
  [
    "U-57",
    "Notification of Foreign Utility Company Status under section 33(a)(2) of the Public Utility Holding Company Act.",
  ],
  ["U-57/A", "Amendment to a previously filed U-57."],
  [
    "U-6B-2",
    "Certificate of notification of security issue, renewal or guaranty filed pursuant to Rule 20(d) of the Public Utility Holding Company Act.",
  ],
  [
    "U-7D",
    "Certificate concerning lease of a utility facility filed pursuant to Rule 7(d) of the Public Utility Holding Company Act.",
  ],
  ["U-7D/A", "Amendment to a previously filed U-7D."],
  [
    "U-R-1",
    "Declaration as to solicitations filed pursuant to Rule 62 of the Public Utility Holding Company Act.",
  ],
  ["45B-3", "Transitional initial statement concerning extensions of credit."],
  ["45B-3/A", "Amendment to 45B-3."],
  [
    "U5A",
    "Notification of registration filed under section 5(a) of the Public Utility Holding Company Act.",
  ],
  [
    "U5B",
    "Registration statement filed under section 5 of the Public Utility Holding Company Act.",
  ],
  ["U5B/A", "Amendment to a previously filed U5B."],
  [
    "U5S",
    "Annual report for holding companies registered pursuant to section 5 of the Public Utility Holding Company Act.",
  ],
  ["U-9C-3", "Quarterly report concerning energy and gas-related companies."],
  ["U-9C-3/A", "Amendment to a U-9C-3."],
  [
    "U-12-IA",
    "Statement pursuant to section 12(i) of the Act by person employed or retained by a registered holding company or subsidiary thereof.",
  ],
  ["U-12-IA/A", "Amendment to a U-12-IA."],
  ["U5S/A", "Amendment to a previously filed U5S."],
  [
    "35-APP",
    "Statement concerning proposed transaction for which no form of application is prescribed filed pursuant to Rule 20(e) of the Public Utility Holding Company Act.",
  ],
  ["35-APP/A", "Amendment to a previously filed 35-APP."],
  [
    "35-CERT",
    "Certificate concerning terms and conditions filed pursuant to Rule 24 of the Public Utility Holding Company Act.",
  ],
  ["35-CERT/A", "Amendment to a previously filed 35-CERT."],
] as const;
export const PUBLIC_UTILITY_HOLDING_COMPANY_ACT_FORM_NAMES = PUBLIC_UTILITY_HOLDING_COMPANY_ACT.map(
  ([name]) => name
);
export type PublicUtilityHoldingCompanyActForm =
  (typeof PUBLIC_UTILITY_HOLDING_COMPANY_ACT_FORM_NAMES)[number];
