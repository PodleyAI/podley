//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_8_K extends Form {
  static readonly name = "Form 8-K";
  static readonly description =
    "A report of unscheduled material events or corporate changes which could be of importance to the shareholders or to the SEC. Examples include acquisition, bankruptcy, resignation of directors, or a change in the fiscal year.";
  static readonly forms = ["8-K", "8-K/A"] as const;
}

export const Form_8_K_ITEMS: Record<string, string> = {
  "1.01": "Entry into a Material Definitive Agreement",
  "1.02": "Termination of a Material Definitive Agreement",
  "1.03": "Bankruptcy or Receivership",
  "1.04": "Mine Safety - Reporting of Shutdowns and Patterns of Violations",
  "1.05": "Material Cybersecurity Incidents",
  "2.01": "Completion of Acquisition or Disposition of Assets",
  "2.02": "Results of Operations and Financial Condition",
  "2.03":
    "Creation of a Direct Financial Obligation or an Obligation under an Off-Balance Sheet Arrangement of a Registrant",
  "2.04":
    "Triggering Events That Accelerate or Increase a Direct Financial Obligation or an Obligation under an Off-Balance Sheet Arrangement",
  "2.05": "Cost Associated with Exit or Disposal Activities",
  "2.06": "Material Impairments",
  "3.01":
    "Notice of Delisting or Failure to Satisfy a Continued Listing Rule or Standard; Transfer of Listing",
  "3.02": "Unregistered Sales of Equity Securities",
  "3.03": "Material Modifications to Rights of Security Holders",
  "4.01": "Changes in Registrant's Certifying Accountant",
  "4.02":
    "Non-Reliance on Previously Issued Financial Statements or a Related Audit Report or Completed Interim Review",
  "5.01": "Changes in Control of Registrant",
  "5.02":
    "Departure of Directors or Certain Officers; Election of Directors; Appointment of Certain Officers: Compensatory Arrangements of Certain Officers",
  "5.03": "Amendments to Articles of Incorporation or Bylaws; Change in Fiscal Year",
  "5.04": "Temporary Suspension of Trading Under Registrant's Employee Benefit Plans",
  "5.05":
    "Amendments to the Registrant's Code of Ethics, or Waiver of a Provision of the Code of Ethics",
  "5.06": "Change in Shell Company Status",
  "5.07": "Submission of Matters to a Vote of Security Holders",
  "5.08": "Shareholder Nominations Pursuant to Exchange Act Rule 14a-11",
  "6.01": "ABS Informational and Computational Material",
  "6.02": "Change of Servicer or Trustee",
  "6.03": "Change in Credit Enhancement or Other External Support",
  "6.04": "Failure to Make a Required Distribution",
  "6.05": "Securities Act Updating Disclosure",
  "6.06": "Static Pool",
  "6.10": "Alternative Filings of Asset-Backed Issuers",
  "7.01": "Regulation FD Disclosure",
  "8.01": "Other Events",
  "9.01": "Financial Statements and Exhibits",
} as const;
