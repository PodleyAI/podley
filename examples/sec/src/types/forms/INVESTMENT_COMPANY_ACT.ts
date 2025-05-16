//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const INVESTMENT_COMPANY_ACT = [
  ["40-6B", "Application under the Investment Company Act by an employees' securities company."],
  ["40-6B/A", "Amendment to a previously filed 40-6B."],
  ["40-6C", "Application for re-registration under the Investment Company Act (Form 40-6C)."],
  ["40-6C/A", "Amendment to a previously filed 40-6C."],
  [
    "40-17F1",
    "Certificate of accounting of securities and similar investments in custody of management investment companies (Rule 17f-1).",
  ],
  ["40-17F1/A", "Amendment to a previously filed 40-17F1."],
  [
    "40-17F2",
    "Certificate of accounting of securities and similar investments in custody of management investment companies (Rule 17f-2).",
  ],
  ["40-17F2/A", "Amendment to a previously filed 40-17F2."],
  ["40-17G", "Fidelity bond filed pursuant to Rule 17g-1 of the Investment Company Act."],
  ["40-17G/A", "Amendment to a previously filed 40-17G."],
  [
    "40-17GCS",
    "Filing of claim or settlement pursuant to Rule 17g-1 of the Investment Company Act.",
  ],
  ["4017GCS/A", "Amendment to a previously filed 40-17GCS."],
  ["40-24B2", "Filing of sales literature pursuant to Rule 24b-2 of the Investment Company Act."],
  ["40-24B2/A", "Amendment to a previously filed 40-24B2."],
  ["40-33", "Copies of stockholder derivative actions filed against an investment company."],
  ["40-33/A", "Amendment to a previously filed 40-33."],
  ["40-8B25", "Document or report filed pursuant to Rule 8b-25 of the Investment Company Act."],
  [
    "40-8F-2",
    "Application for de-registration pursuant to Rule 0-2 of the Investment Company Act.",
  ],
  ["40-8F-2/A", "Amendment to a previously filed 40-8F-2."],
  ["40-APP", "Application under the Investment Company Act (other than insurance products)."],
  ["40-APP/A", "Amendment to a previously filed 40-APP."],
  ["40-F", "Annual report filed by Canadian issuers pursuant to Section 15(d) and Rule 15d-4."],
  ["40-F/A", "Amendment to a previously filed 40-F."],
  ["40FR12B", "Registration of securities of Canadian issuers under Section 12(b)."],
  ["40FR12B/A", "Amendment to a previously filed 40FR12B."],
  ["40FR12G", "Registration of securities of Canadian issuers under Section 12(g)."],
  ["40FR12G/A", "Amendment to a previously filed 40FR12G."],
  [
    "40-OIP",
    "Application under the Investment Company Act reviewed by the Office of Insurance Products.",
  ],
  ["40-OIP/A", "Amendment to a previously filed 40-OIP."],
  ["OIP ORDR", "Order under Section 3(b)(2) of the Investment Company Act of 1940."],
  ["OIP NTC", "Notice under Section 8(a) of the Investment Company Act of 1940."],
  [
    "N-6",
    "Registration statement for separate accounts organized as unit investment trusts that offer variable life insurance contracts under the Investment Company Act of 1940 and the Securities Act of 1933.",
  ],
  ["N-6/A", "Amendment to a previously filed N-6."],
  [
    "N-6F",
    "Registration statement on Form N-6F for separate accounts organized as unit investment trusts offered exclusively to qualified institutional buyers under the Investment Company Act of 1940.",
  ],
  ["N-6F/A", "Amendment to a previously filed N-6F."],
  ["N-8F", "Application for deregistration made on Form N-8F."],
  ["N-8F/A", "Amendment to a previously filed N-8F."],
  ["N-18F1", "Initial notification of election pursuant to Rule 18f-1 filed on Form N-18F-1."],
  ["N-18F1/A", "Amendment to a previously filed N-18F1."],
] as const;
export const INVESTMENT_COMPANY_ACT_FORM_NAMES = INVESTMENT_COMPANY_ACT.map(([name]) => name);
export type InvestmentCompanyActForm = (typeof INVESTMENT_COMPANY_ACT_FORM_NAMES)[number];
