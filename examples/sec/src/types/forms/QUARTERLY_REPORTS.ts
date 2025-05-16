//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const QUARTERLY_REPORTS = [
  [
    "10-Q",
    "A quarterly report which provides a continuing view of a company's financial position during the year. The filing is due 45 days after each of the first three fiscal quarters. No filing is due for the fourth quarter.",
  ],
  ["10-Q/A", "Amendment to a previously filed 10-Q."],
  [
    "10QSB",
    "A quarterly report which provides a continuing view of a company's financial position during the year. The 10QSB form is filed by small businesses.",
  ],
  ["10QSB/A", "An amendment to a previously filed 10QSB."],
  ["NT 10-Q", "Notification that form type 10-Q will be submitted late."],
  ["NT 10-Q/A", "Amendment to a previously filed NT 10-Q."],
  [
    "10-QT",
    "Quarterly transition reports filed pursuant to rule 13a-10 or 15d-10 of the Securities Exchange Act.",
  ],
  ["10-QT/A", "Amendment to a previously filed 10-QT."],
  ["13F-E", "Quarterly reports filed by institutional managers."],
  ["13F-E/A", "Amendment to a previously filed 13F-E."],
  ["13F-HR", "13F Holdings Report Initial Filing."],
  ["13F-HR/A", "13F Holdings Report Initial Filing amendment."],
  ["13F-NT", "13F Notice Report Initial Filing."],
  ["13F-NT/A", "13F Notice Report Initial Filing amendment."],
  ["13F-HR", "13F Combination Report Initial Filing."],
  ["13F-HR/A", "13F Combination Report Initial Filing amendment."],
] as const;
export const QUARTERLY_REPORT_FORM_NAMES = QUARTERLY_REPORTS.map(([name]) => name);
export type QuarterlyReportForm = (typeof QUARTERLY_REPORT_FORM_NAMES)[number];
