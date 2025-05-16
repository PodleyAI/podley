//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const MISCELLANEOUS_FILINGS = [
  [
    "8-K",
    "A report of unscheduled material events or corporate changes which could be of importance to the shareholders or to the SEC. Examples include acquisition, bankruptcy, resignation of directors, or a change in the fiscal year.",
  ],
  ["8-K/A", "Amendment to a previously filed 8-K."],
  [
    "N-30B-2",
    "Periodic and interim reports mailed to shareholders. Filed by registered investment companies.",
  ],
  ["N-30B-2/A", "Amendment to a previously filed N-30B-2."],
  [
    "2-E",
    "Reports of sales of securities pursuant to Regulation E. Filed by investment companies.",
  ],
  ["2-E/A", "Amendment to a previously filed 2-E."],
  ["SP 15D2", "Special financial report pursuant to Rule 15d-2 of the Securities Exchange Act."],
  ["SP 15D2/A", "Amendments to a previously filed SP 15D2."],
  ["NT 15D2", "Notification of late filing Special report pursuant to section 15d-2."],
  ["NT 15D2/A", "Amendment to a previously filed NT 15D2."],
  [
    "6-K",
    "Report of foreign issuer pursuant to Rules 13a-16 and 15d-16 of the Securities Exchange Act.",
  ],
  ["6-K/A", "Amendment to a previously filed 6-K."],
  [
    "8-K12B",
    "Notification that a class of securities of successor issuer is deemed to be registered pursuant to section 12(b)",
  ],
  ["8-K12B/A", "Amendment to a previously filed 8-K12B."],
  [
    "8-K12G3",
    "Notification of securities of successor issuers deemed to be registered pursuant to section 12(g) of the Securities Exchange Act.",
  ],
  ["8-K12G3/A", "Amendment to a previously filed 8-K12G3."],
  ["8-K15D5", "Notification of assumption of duty to report by successor issuer."],
  ["8-K15D5/A", "Amendment to a previously filed 8-K15D5."],
  ["BULK", "Bulk Submission."],
  ["BULK/A", "Amendment to a previously filed BULK."],
  ["SD", "Specialized disclosure report pursuant to Section 13(r) of the Exchange Act."],
  ["SD/A", "Amendment to a previously filed SD."],
  ["TH", "Notification of reliance on temporary hardship exemption."],
  [
    "12G3-2B",
    "Submission under Exchange Act Rule 12g3-2(b) to maintain exemption from Section 12(g) registration for foreign private issuers.",
  ],
  ["REVOKED", "Commission order revoking Exchange Act registration [Section 12(j)]."],
] as const;
export const MISCELLANEOUS_FORM_NAMES = MISCELLANEOUS_FILINGS.map(([name]) => name);
export type MiscellaneousFilingsForm = (typeof MISCELLANEOUS_FORM_NAMES)[number];
