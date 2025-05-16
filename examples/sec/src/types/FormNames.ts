//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

import { PROXIES_INFORMATION_STATEMENTS } from "./forms/PROXIES_INFORMATION_STATEMENTS";
import { REGISTRATION_STATEMENTS } from "./forms/REGISTRATION_STATEMENTS";
import { REGISTRATION_WITHDRAWAL_TERMINATION_STATEMENTS } from "./forms/REGISTRATION_WITHDRAWAL_TERMINATION";
import { QUARTERLY_REPORTS } from "./forms/QUARTERLY_REPORTS";
import { ANNUAL_REPORTS } from "./forms/ANNUAL_REPORTS";
import { STATEMENTS_OF_OWNERSHIP } from "./forms/STATEMENTS_OF_OWNERSHIP";
import { INSIDER_TRADING } from "./forms/INSIDER_TRADING";
import { TRUST_INDENTURE_ACT } from "./forms/TRUST_INDENTURE_ACT";
import { PUBLIC_UTILITY_HOLDING_COMPANY_ACT } from "./forms/PUBLIC_UTILITY_HOLDING_COMPANY_ACT";
import { ASSET_BACKED_EXHIBIT } from "./forms/ASSET_BACKED_EXHIBIT";
import { DEVELOPMENT_BANK } from "./forms/DEVELOPMENT_BANK";
import { APPLICATION_WITHDRAWAL } from "./forms/APPLICATION_WITHDRAWAL";
import { ATS } from "./forms/ATS";
import { PORTAL } from "./forms/PORTAL";
import { EXEMPT_OFFERINGS } from "./forms/EXEMPT_OFFERINGS";
import { REGULATION_E } from "./forms/REGULATION_E";
import { LARGE_TRADER } from "./forms/LARGE_TRADER";
import { BROKER_DEALER } from "./forms/BROKER_DEALER";
import { INVESTMENT_COMPANY_ACT } from "./forms/INVESTMENT_COMPANY_ACT";
import { EXCHANGE_LISTING_WITHDRAWAL } from "./forms/EXCHANGE_LISTING_WITHDRAWAL";
import { NRSRO } from "./forms/NRSRO";
import { TRANSFER_AGENT } from "./forms/TRANSFER_AGENT";
import { REGISTERED_INVESTMENT_COMPANIES } from "./forms/REGISTERED_INVESTMENT_COMPANIES";
import { MISCELLANEOUS_INVESTMENT } from "./forms/MISCELLANEOUS_INVESTMENT";
import { MISCELLANEOUS_FILINGS } from "./forms/MISCELLANEOUS_FILINGS";
import { CORRESPONDENCE_SUBMISSION_TYPES } from "./forms/CORRESPONDENCE_SUBMISSION_TYPES";

export const FORMS = [
  ["Registration Statements", REGISTRATION_STATEMENTS],
  [
    "Registration Withdrawal and Termination Statements",
    REGISTRATION_WITHDRAWAL_TERMINATION_STATEMENTS,
  ],
  ["Proxies and Information Statements", PROXIES_INFORMATION_STATEMENTS],
  ["Quarterly Reports", QUARTERLY_REPORTS],
  ["Annual Reports", ANNUAL_REPORTS],
  ["Statements of Ownership", STATEMENTS_OF_OWNERSHIP],
  ["Insider Trading", INSIDER_TRADING],
  ["Filings pursuant to the Trust Indenture Act", TRUST_INDENTURE_ACT],
  [
    "Filings pursuant to the Public Utility Holding Company Act",
    PUBLIC_UTILITY_HOLDING_COMPANY_ACT,
  ],
  ["Miscellaneous Filings", MISCELLANEOUS_FILINGS],
  ["Asset-Backed Exhibit Filings", ASSET_BACKED_EXHIBIT],
  ["Development Bank Filings", DEVELOPMENT_BANK],
  ["Application Withdrawal Filings", APPLICATION_WITHDRAWAL],
  ["ATS Filings", ATS],
  ["Portal", PORTAL],
  ["Exempt Offering", EXEMPT_OFFERINGS],
  ["Regulation E Filings", REGULATION_E],
  ["Large Trader Filings", LARGE_TRADER],
  ["Broker-Dealer Filings", BROKER_DEALER],
  ["Investment Company Act Filings", INVESTMENT_COMPANY_ACT],
  ["Exchange Listing Withdrawal Filings", EXCHANGE_LISTING_WITHDRAWAL],
  ["NRSRO Filings", NRSRO],
  ["Transfer Agent Filings", TRANSFER_AGENT],
  ["Periodic Reports for Registered Investment Companies", REGISTERED_INVESTMENT_COMPANIES],
  ["Miscellaneous Investment Company Reports", MISCELLANEOUS_INVESTMENT],
  ["Correspondence Submission Types", CORRESPONDENCE_SUBMISSION_TYPES],
] as const;

export const ALL_FORMS = FORMS.flatMap(([_, forms]) => forms.map(([name]) => name));
export type Form = (typeof ALL_FORMS)[number];

export const FORM_CATEGORIES = FORMS.map(([name]) => name);
export type FormCategory = (typeof FORM_CATEGORIES)[number];
