//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

// data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json

import { ValueSchema } from "@ellmers/storage";
import { Frame, YYYYdMMdDD } from "./BaseTypes";
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

export enum FP {
  Fy = "FY",
  Q1 = "Q1",
  Q2 = "Q2",
  Q3 = "Q3",
  Q4 = "Q4",
}

export type Factoid = {
  cik: number;
  grouping: string;
  name: string;
  filed_date: YYYYdMMdDD;
  form: Form;
  units: string;
  frame: Frame | null;
  accession_number: string;
  start_date: YYYYdMMdDD | null;
  end_date: YYYYdMMdDD;
  val: number;
  fy: number;
  fp: FP;
};

export const FactoidSchema: ValueSchema = {
  cik: "number",
  grouping: "string",
  name: "string",
  filed_date: "date",
  form: "string",
  units: "string",
  frame: "string",
  accession_number: "string",
  start_date: "date",
  end_date: "date",
  val: "number",
  fy: "number",
  fp: "string",
} as const;

export const FactoidKey = [
  "cik",
  "name",
  "grouping",
  "accession_number",
  "frame",
  "units",
  "fy",
  "fp",
  "val",
] as const;
