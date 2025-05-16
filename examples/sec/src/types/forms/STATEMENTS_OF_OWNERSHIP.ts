//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const STATEMENTS_OF_OWNERSHIP = [
  [
    "SC 13D",
    "This filing is made by person(s) reporting beneficially owned shares of common stock in a public company.",
  ],
  ["SC 13D/A", "An amendment to a SC 13D filing."],
  ["SCHEDULE 13D", "Schedule 13D."],
  ["SCHEDULE 13D/A", "Amendment to a previously filed SCHEDULE 13D."],
  ["SC 13G", "A statement of beneficial ownership of common stock by certain persons."],
  ["SC 13G/A", "An amendment to a SC 13G filing."],
  ["SCHEDULE 13G", "Schedule 13G."],
  ["SCHEDULE 13G/A", "Amendment to a previously filed SCHEDULE 13G."],
  ["SC 13E1", "Statement of issuer required by Rule 13e-1 of the Securities Exchange Act."],
  ["SC 13E1/A", "Amendment to a previously filed SC 13E1."],
  ["SC 13E3", "Going private transaction by certain issuers."],
  ["SC 13E3/A", "Amendment to a previously filed SC 13E3."],
  ["SC 13E4", "Issuer tender offer statement."],
  ["SC 13E4/A", "Amendment to a previously filed SC 13E4."],
  ["SC 13E4F", "Issuer tender offer statement filed pursuant to Rule 13(e)(4) by foreign issuers."],
  ["SC 13E4F/A", "Amendment to a previously filed SC 13E4F."],
  ["SC 14D1", "Tender offer statement."],
  ["SC 14D1/A", "Amendment to a previously filed SC 14D1."],
  [
    "SC 14D1F",
    "Third party tender offer statement filed pursuant to Rule 14d-1(b) by foreign issuers.",
  ],
  ["SC 14D1F/A", "Amendment to a previously filed SC 14D1F."],
  ["SC 14D9", "Solicitation/recommendation statements."],
  ["SC 14D9/A", "Amendment to a previously filed SC 14D9."],
  ["SC 14F1", "Statement regarding change in majority of directors pursuant to Rule 14f-1."],
  ["SC 14F1/A", "Amendment to a previously filed SC 14F1."],
  [
    "SC 14N",
    "Information filed by certain nominating shareholders (pursuant to Section 240 14n-1).",
  ],
  ["SC 14N/A", "Amendment to a previously filed SC 14N."],
  [
    "SC TO-C",
    "Written public communication relating to an issuer or third party tender offer not by the subject company.",
  ],
  ["SC TO-C/A", "Amendment to a previously filed SC TO-C."],
  ["SC TO-T", "Tender offer schedule and amendment filed by a third party."],
  ["SC TO-T/A", "Amendment to a previously filed SC TO-T."],
  ["SC TO-I", "Tender offer schedule and amendment filed by the issuer."],
  ["SC TO-I/A", "Amendment to a previously filed SC TO-I."],
] as const;

export const STATEMENT_OF_OWNERSHIP_FORM_NAMES = STATEMENTS_OF_OWNERSHIP.map(([name]) => name);

export type StatementOfOwnershipForm = (typeof STATEMENT_OF_OWNERSHIP_FORM_NAMES)[number];
