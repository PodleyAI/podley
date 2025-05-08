//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Static, Type, FormatRegistry } from "@sinclair/typebox";
import { ArrayToObject, TypeNullable } from "@ellmers/util";
// import { ALL_FORMS } from "./FormNames";

// const TypeSECForm = () => Type.Union(ALL_FORMS.map((f) => Type.Literal(f)));

FormatRegistry.Set("sec-form", (value: string) => {
  return true;
  // if (ALL_FORMS.includes(value as any)) {
  //   return true;
  // }
  // return false;
});
export const TypeSECForm = (annotations: Record<string, unknown> = {}) =>
  Type.String({ format: "sec-form", maxLength: 20, ...annotations });
export const TypeSECBoolean = (annotations: Record<string, unknown> = {}) =>
  Type.Transform(Type.Boolean(annotations))
    .Decode((value) => (value ? "1" : "0"))
    .Encode((value) => value === "1");
export const TypeAddress = (annotations: Record<string, unknown> = {}) =>
  Type.Object(
    {
      street1: TypeNullable(Type.String()),
      street2: TypeNullable(Type.String()),
      city: TypeNullable(Type.String()),
      stateOrCountry: TypeNullable(Type.String()),
      zipCode: TypeNullable(Type.String()),
      stateOrCountryDescription: TypeNullable(Type.String()),
      isForeignLocation: TypeNullable(TypeSECBoolean()),
      foreignStateTerritory: TypeNullable(Type.String()),
      country: TypeNullable(Type.String()),
      countryCode: TypeNullable(Type.String()),
    },
    annotations
  );
export const TypeSecCik = (annotations: Record<string, unknown> = {}) =>
  Type.Transform(
    Type.Number({ format: "cik", minimum: 0, maximum: 9999999999, title: "CIK", ...annotations })
  )
    .Decode((value) => value.toString())
    .Encode((value) => parseInt(value));

export type Address = Static<ReturnType<typeof TypeAddress>>;

export const TypeFilings = () =>
  Type.Object({
    accessionNumber: Type.Array(Type.String({ maxLength: 20 })),
    filingDate: Type.Array(Type.String()),
    reportDate: Type.Array(Type.String()),
    acceptanceDateTime: Type.Array(Type.String()),
    act: Type.Array(Type.String()),
    form: Type.Array(TypeSECForm()),
    filmNumber: Type.Array(Type.String({ maxLength: 10 })),
    fileNumber: Type.Array(Type.String({ maxLength: 10 })),
    items: Type.Array(Type.String()),
    size: Type.Array(Type.Number()),
    isXBRL: Type.Array(TypeSECBoolean()),
    isInlineXBRL: Type.Array(TypeSECBoolean()),
    primaryDocument: Type.Array(Type.String()),
    primaryDocDescription: Type.Array(Type.String()),
  });

export type Filings = Static<ReturnType<typeof TypeFilings>>;
export type Filing = ArrayToObject<Filings>;

export const CompanySubmissionSchema = () =>
  Type.Object({
    cik: TypeSecCik(),
    entityType: Type.String(),
    sic: Type.String(),
    sicDescription: Type.String(),
    insiderTransactionForOwnerExists: TypeSECBoolean(),
    insiderTransactionForIssuerExists: TypeSECBoolean(),
    name: Type.String(),
    tickers: Type.Array(Type.String()),
    exchanges: Type.Array(Type.String()),
    ein: TypeNullable(Type.String()),
    description: Type.String(),
    website: Type.String(),
    investorWebsite: Type.String(),
    category: Type.String(),
    fiscalYearEnd: TypeNullable(Type.String()),
    stateOfIncorporation: Type.String(),
    stateOfIncorporationDescription: Type.String(),
    addresses: Type.Object({
      mailing: TypeAddress(),
      business: TypeAddress(),
    }),
    phone: Type.String(),
    flags: Type.String(),
    formerNames: Type.Array(
      Type.Object({
        name: Type.String(),
        from: Type.String(),
        to: Type.String(),
      })
    ),
  });

export type CompanySubmission = Static<ReturnType<typeof CompanySubmissionSchema>>;

export const FullCompanySubmissionSchema = () =>
  Type.Object({
    ...CompanySubmissionSchema().properties,
    filings: Type.Object({
      recent: TypeFilings(),
      files: Type.Array(
        Type.Object({
          name: Type.String(),
          filingCount: Type.Number(),
          filingFrom: Type.String(),
          filingTo: Type.String(),
        })
      ),
    }),
  });

export type FullCompanySubmission = Static<ReturnType<typeof FullCompanySubmissionSchema>>;
