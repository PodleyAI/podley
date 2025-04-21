// data.sec.gov/submissions/CIK{cik}.json

import type { YYYYdMMdDD, OptionalFullDateString, SecBoolean } from "./base-types";
import type { Form } from "./form-names";

export interface CompanySubmission {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  insiderTransactionForOwnerExists: SecBoolean;
  insiderTransactionForIssuerExists: SecBoolean;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string;
  description: string;
  website: string;
  investorWebsite: string;
  category: string;
  fiscalYearEnd: string;
  stateOfIncorporation: string;
  stateOfIncorporationDescription: string;
  addresses: Addresses;
  phone: string;
  flags: string;
  formerNames: FormerName[];
  filings: Filings;
}

export interface Addresses {
  mailing: Address;
  business: Address;
}

export interface Address {
  street1: string | null;
  street2: string | null;
  city: string | null;
  stateOrCountry: string | null;
  zipCode: string | null;
  stateOrCountryDescription: string | null;
}

export interface Filings {
  recent: SubmissionList;
  files: AdditionsCompanySubmissions[];
}

export interface AdditionsCompanySubmissions {
  name: string;
  filingCount: number;
  filingFrom: YYYYdMMdDD;
  filingTo: YYYYdMMdDD;
}

export type Act = "33" | "34" | "";

export interface SubmissionList {
  accessionNumber: string[];
  filingDate: YYYYdMMdDD[];
  reportDate: OptionalFullDateString[];
  acceptanceDateTime: string[];
  act: Act[];
  form: Form[];
  filmNumber: string[];
  fileNumber: string[];
  items: string[];
  size: number[];
  isXBRL: SecBoolean[];
  isInlineXBRL: SecBoolean[];
  primaryDocument: string[];
  primaryDocDescription: string[];
}

export interface FormerName {
  name: string;
  from: string;
  to: string;
}
