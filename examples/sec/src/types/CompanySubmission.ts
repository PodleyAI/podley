//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Filings } from "./FilingMetaData";

export interface Address {
  street1: string | null;
  street2: string | null;
  city: string | null;
  stateOrCountry: string | null;
  zipCode: string | null;
  stateOrCountryDescription: string | null;
}

export interface CompanySubmission {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  insiderTransactionForOwnerExists: boolean;
  insiderTransactionForIssuerExists: boolean;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string | null;
  description: string;
  website: string;
  investorWebsite: string;
  category: string;
  fiscalYearEnd: string | null;
  stateOfIncorporation: string;
  stateOfIncorporationDescription: string;
  flags: string;
  formerNames: string[];
}

export interface FullCompanySubmission extends CompanySubmission {
  addresses: {
    mailing: Address;
    business: Address;
  };
  phone: string;
  filings: {
    recent: Filings;
    files: {
      name: string;
      filingCount: number;
      filingFrom: string;
      filingTo: string;
    }[];
  };
}
