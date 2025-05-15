//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

// data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json

import { TypeDate, TypeNullable } from "@ellmers/util";
import { Static, Type } from "@sinclair/typebox";
import { YYYYdMMdDD } from "./../util/parseDate";
import { Frame } from "./BaseTypes";
import { TypeSECForm } from "./CompanySubmission";
import { Form } from "./FormNames";

export interface CompanyFacts {
  cik: number;
  entityName: string;
  facts: Facts;
}

type Group = string;
export type Facts = Record<Group, FactInfo>;
type Name = string;
type FactInfo = Record<Name, NameInfo>;
interface NameInfo {
  label: string;
  description: string;
  units: UnitInfo;
}
type Unit = string;
type UnitInfo = Record<Unit, FactSummary[]>;

export interface FactSummary {
  end: YYYYdMMdDD;
  val: number;
  accn: string;
  fy: number;
  fp: FP;
  form: Form;
  filed: YYYYdMMdDD;
  start?: YYYYdMMdDD;
  frame?: Frame;
}

export const FP = ["FY", "Q1", "Q2", "Q3", "Q4"] as const;
export type FP = (typeof FP)[number];

export const FactoidSchema = Type.Object({
  cik: Type.Number({ format: "cik", minimum: 0 }),
  grouping: Type.String({ maxLength: 10 }), // dei or us-gaap
  name: Type.String(),
  filed_date: TypeDate(),
  form: TypeSECForm(),
  val_unit: Type.String({ maxLength: 12 }),
  val: Type.Number(),
  frame: TypeNullable(Type.String({ maxLength: 12 })),
  accession_number: Type.String({ maxLength: 20 }),
  start_date: TypeNullable(TypeDate()),
  end_date: TypeDate(),
  fy: Type.Number({ format: "year" }),
  fp: Type.Union(FP.map((fp) => Type.Literal(fp))),
});

export type Factoid = Static<typeof FactoidSchema>;
