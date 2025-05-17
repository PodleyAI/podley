//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PERIODIC_REPORT_FORM_NAMES } from "./periodic-reports";
import { APPLICATION_WITHDRAWAL_FORM_NAMES } from "./application-withdrawal";
import { ASSET_BACKED_EXHIBIT_FORM_NAMES } from "./asset-backed-exhibit";
import { ATS_FORM_NAMES } from "./ats";
import { BROKER_DEALER_FORM_NAMES } from "./broker-dealer";
import { CORRESPONDENCE_SUBMISSION_TYPE_FORM_NAMES } from "./correspondence-submission-types";
import { DEVELOPMENT_BANK_FORM_NAMES } from "./development-bank";
import { EXCHANGE_LISTING_WITHDRAWAL_FORM_NAMES } from "./exchange-listing-withdrawal";
import { EXCHANGE_REGISTRATION_FORMS } from "./exchange-registration";
import { EXEMPT_OFFERING_FORM_NAMES } from "./exempt-offerings";
import { FOREIGN_REGISTRATION_FORM_NAMES } from "./foreign-registration-statements";
import { INSIDER_TRADING_FORM_NAMES } from "./insider-trading";
import { INVESTMENT_COMPANY_FORM_NAMES } from "./investment-companies";
import { LARGE_TRADER_FORM_NAMES } from "./large-trader";
import { MISCELLANEOUS_FILINGS_FORM_NAMES } from "./miscellaneous-filings";
import { MUNICIPAL_ADVISOR_FORM_NAMES } from "./municipal-advisor";
import { NRSRO_FORM_NAMES } from "./nrsro";
import { PORTAL_FORM_NAMES } from "./portal";
import { PROXY_FORMS } from "./proxies-information-statements";
import { PUBLIC_UTILITY_HOLDING_COMPANY_ACT_FORMS } from "./public-utility-holding-company-act";
import { REGISTRATION_STATEMENT_FORM_NAMES } from "./registration-statements";
import { REGISTRATION_WITHDRAWAL_TERMINATION_FORMS } from "./registration-withdrawal-termination";
import { REGULATION_E_FORM_NAMES } from "./regulation-e";
import { STATEMENTS_OF_OWNERSHIP_FORMS } from "./statements-of-ownership";
import { TRANSFER_AGENT_FORM_NAMES } from "./transfer-agent";
import { TRUST_INDENTURE_ACT_FORM_NAMES } from "./trust-indenture-act";

// Combine all form names into a single array
export const ALL_FORMS = [
  ...PERIODIC_REPORT_FORM_NAMES,
  ...APPLICATION_WITHDRAWAL_FORM_NAMES,
  ...ASSET_BACKED_EXHIBIT_FORM_NAMES,
  ...ATS_FORM_NAMES,
  ...BROKER_DEALER_FORM_NAMES,
  ...CORRESPONDENCE_SUBMISSION_TYPE_FORM_NAMES,
  ...DEVELOPMENT_BANK_FORM_NAMES,
  ...EXCHANGE_LISTING_WITHDRAWAL_FORM_NAMES,
  ...EXEMPT_OFFERING_FORM_NAMES,
  ...FOREIGN_REGISTRATION_FORM_NAMES,
  ...INSIDER_TRADING_FORM_NAMES,
  ...LARGE_TRADER_FORM_NAMES,
  ...MISCELLANEOUS_FILINGS_FORM_NAMES,
  ...MUNICIPAL_ADVISOR_FORM_NAMES,
  ...NRSRO_FORM_NAMES,
  ...PORTAL_FORM_NAMES,
  ...PROXY_FORMS,
  ...PUBLIC_UTILITY_HOLDING_COMPANY_ACT_FORMS,
  ...REGISTRATION_STATEMENT_FORM_NAMES,
  ...REGISTRATION_WITHDRAWAL_TERMINATION_FORMS,
  ...REGULATION_E_FORM_NAMES,
  ...STATEMENTS_OF_OWNERSHIP_FORMS,
  ...TRANSFER_AGENT_FORM_NAMES,
  ...TRUST_INDENTURE_ACT_FORM_NAMES,
  ...INVESTMENT_COMPANY_FORM_NAMES,
  ...EXCHANGE_REGISTRATION_FORMS,
] as const;

// Export a type that represents all possible form names
export type AllForms = (typeof ALL_FORMS)[number];
