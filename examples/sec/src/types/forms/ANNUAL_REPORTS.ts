//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const ANNUAL_REPORTS = [
  ["ARS", "An annual report to security holders. This is a voluntary filing on EDGAR."],
  ["ARS/A", "Amendment to a previously filed ARS."],
  [
    "10-K",
    "An annual report which provides a comprehensive overview of the company for the past year. The filing is due 90 days after the close of the company's fiscal year, and contains information such as company history, organization, nature of business, equity, holdings, earnings per share, subsidiaries, and other pertinent financial information.",
  ],
  ["10-K/A", "Amendment to a previously filed 10-K."],
  [
    "10-K405",
    "An annual report which provides a comprehensive overview of the company for the past year. The Regulation S-K Item 405 box on the cover page is checked.",
  ],
  ["10-K405/A", "Amendment to a previously filed 10-K405."],
  ["NT 10-K", "Notification that form 10-K will be submitted late."],
  ["NT 10-K/A", "Amendment to a previously filed NT 10-K."],
  ["NTN 10K", "Notice under Rule 12b-25 of inability to timely file all or part of a Form 10-K."],
  [
    "10KSB",
    "An annual report which provides a comprehensive overview of the company for the past year. The 10KSB is filed by small businesses.",
  ],
  ["10KSB/A", "Amendment to a previously filed 10KSB."],
  [
    "10-C",
    "This filing is required of an issuer of securities quoted on the NASDAQ Interdealer Quotation System, and contains information regarding a change in the number of shares outstanding or a change in the name of the issuer.",
  ],
  ["10-C/A", "Amendment to a previously filed 10-C."],
  [
    "10-KT",
    "Annual transition reports filed pursuant to rule 13a-10 or 15d-10 of the Securities Exchange Act.",
  ],
  ["10-KT/A", "Amendment to a previously filed 10-KT."],
  [
    "10KSB40",
    "An optional form for annual and transition reports of small business issuers under Section 13 or 15(d) of the Securities Exchange Act where the Regulation S-B Item 405 box on the cover page is checked.",
  ],
  ["10KSB40/A", "Amendment to a previously filed 10KSB40."],
  [
    "10KT405",
    "Annual transition report filed pursuant to Rule 13a-10 or 15d-10 of the Securities Exchange Act.",
  ],
  ["10KT405/A", "Amendment to a previously filed 10KT405."],
  [
    "11-KT",
    "Annual report of employee stock purchase, savings and similar plans. Filed pursuant to rule 13a-10 or 15d-10 of the Securities Exchange Act.",
  ],
  ["11-KT/A", "Amendment to a previously filed 11-KT."],
  ["18-K", "Annual report for foreign governments and political subdivisions."],
  ["18-K/A", "Amendment to a previously filed 18-K."],
  ["11-K", "An annual report of employee stock purchase, savings and similar plans."],
  ["11-K/A", "Amendment to a previously filed 11-K."],
  ["NT 11-K", "Notification that form 11-K will be submitted late."],
  ["NT 11-K/A", "Amendment to a previously filed NT 11-K."],
  [
    "SBSE-A",
    "Application for Registration as either a Security-based Swap Dealer or Major Security-based Swap Participant .",
  ],
  ["SBSE-A/A", "Amendment to a previously filed SBSE-A."],
  [
    "SBSE-C",
    "Certification by security-based swap dealers and major security-based swap participants filed pursuant to Rule 15Fb2-1(a).",
  ],
  ["SBSE-C/A", "Amendment to a previously filed SBSE-C."],
  ["NSAR-A", "Semi-annual report for management companies."],
  ["NSAR-A/A", "Amendment to a previously filed NSAR-A."],
  ["NSAR-AT", "Transitional semi-annual report for registered investment companies (Management)."],
  ["NSAR-AT/A", "Amendment to a previously filed NSAR-AT."],
  ["NSAR-B", "Annual report for management companies."],
  ["NSAR-B/A", "Amendment to a previously filed NSAR-B."],
  ["NSAR-BT", "Transitional annual report for management companies."],
  ["NSAR-BT/A", "Amendment to a previously filed NSAR-BT."],
  ["NSAR-U", "Annual report for unit investment trusts."],
  ["NSAR-U/A", "Amendment to a previously filed NSAR-U."],
  ["NT-NSAR", "Request for an extension of time for filing form NSAR-A, NSAR-B or NSAR-U."],
  ["NT-NSAR/A", "Amendment to a previously filed NT-NSAR."],
  [
    "N-30D",
    "An annual and semi-annual report mailed to shareholders. Filed by registered investment companies.",
  ],
  ["N-30D/A", "Amendment to a previously filed N-30D."],
  [
    "20-F",
    "Annual and transition report of foreign private issuers filed pursuant to sections 13 or 15(d) of the Securities Exchange Act.",
  ],
  ["20-F/A", "Amendment to a previously filed 20-F."],
  ["NT 20-F", "Notification that form 20-F will be submitted late."],
  ["NT 20-F/A", "Amendment to a previously filed NT 20-F."],
  ["ARS", "Annual report to security holders."],
] as const;

export const ANNUAL_REPORT_FORM_NAMES = ANNUAL_REPORTS.map(([name]) => name);

export type AnnualReportForm = (typeof ANNUAL_REPORT_FORM_NAMES)[number];
