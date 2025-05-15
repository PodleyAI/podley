// data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json

import { YYYYdMMdDD } from "../../util/parseDate";
import { Frame } from "../BaseTypes";
import { Form } from "./form-names";
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
