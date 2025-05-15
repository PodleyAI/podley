// Source files:
// file://public/formDStateCodes.xsd.xml
// file://public/formDSubmission.xsd.xml
// file://public/statesOfSolicitationCodes.xsd.xml

import { YYYYdMMdDD } from "../../util/parseDate";
import { YYYY } from "../BaseTypes";
import { StateOrCountryCode, StateOrCountryEnum, StateSolicitationCode } from "./state-country";

export interface EdgarFormDType {
  contactData: PointOfContact;
  issuerList: IssuerList;
  notificationAddressList: NotificationAddresses;
  offeringData: OfferingData;
  primaryIssuer: Issuer;
  relatedPersonsList: RelatedPersonList;
  returnCopy?: BOOLEAN_STRING;
  schemaVersion?: string;
  submissionType?: string;
  testOrLive?: string;
}

export interface PointOfContact {
  contactEmailAddress?: string;
  contactName?: string;
  contactPhoneNumber?: string;
}

export interface IssuerList {
  issuer: Issuer[];
  over100IssuerFlag?: BOOLEAN_STRING;
}

export enum EntityEnum {
  Corporation = "Corporation",
  LimitedPartnership = "Limited Partnership",
  LLC = "Limited Liability Company",
  GeneralPartnership = "General Partnership",
  BusinessTrust = "Business Trust",
  Other = "Other",
}

// export type ENTITY_TYPE =
// | 'Corporation'
// | 'Limited Partnership'
// | 'Limited Liability Company'
// | 'General Partnership'
// | 'Business Trust'
// | 'Other';

export interface Issuer {
  cik: string;
  edgarPreviousNameList: PreviousNameList;
  entityName?: string;
  entityType?: EntityEnum;
  entityTypeOtherDesc?: string;
  issuerAddress: Address;
  issuerPhoneNumber?: string;
  issuerPreviousNameList: PreviousNameList;
  jurisdictionOfInc?: StateOrCountryEnum;
  yearOfInc: FuzzyYear;
}

export interface FuzzyAmount {
  dollarAmount?: number;
  isEstimate?: BOOLEAN_STRING;
}

export interface BusinesCombinationTransaction {
  isBusinessCombinationTransaction?: BOOLEAN_STRING;
  clarificationOfResponse?: string;
}

export interface CommissionFee {
  clarificationOfResponse?: string;
  findersFees: FuzzyAmount;
  salesCommissions: FuzzyAmount;
}

export interface FederalExamptionsExclusions {
  item: ExemptionsExclusions[];
}

export interface FILED_BY_COMPANY_FORMD_TYPE {
  ccc?: string;
  cik?: string;
  entityName?: string;
}

export interface FilingType {
  dateOfFirstSale: FirstSaleDate;
  newOrAmendment: Amendment;
}

export interface FirstSaleDate {
  value?: YYYYdMMdDD;
  yetToOccur?: BOOLEAN_STRING;
}

export interface Address {
  street1: string | null;
  street2: string | null;
  city: string | null;
  stateOrCountry: StateOrCountryCode | null;
  stateOrCountryDescription: string | null;
  zipCode: string | null;
}

export interface NotificationAddresses {
  notificationEmailAddress?: string[];
}

export interface Amendment {
  isAmendment?: BOOLEAN_STRING;
  previousAccessionNumber?: string;
}

export type HEALTH_CARE_INDUSTRY_LIST =
  | "Biotechnology"
  | "Health Insurance"
  | "Hospitals and Physicians"
  | "Pharmaceuticals"
  | "Other Health Care";

export interface IndustryGroup {
  industryGroupType: INDUSTRY_GROUP;
  investmentFundInfo?: InvestmentFundInfo;
}

export type INVESTMENT_FUND_TYPE =
  | "Hedge Fund"
  | "Private Equity Fund"
  | "Venture Capital Fund"
  | "Other Investment Fund";

export interface InvestmentFundInfo {
  investmentFundType?: INVESTMENT_FUND_TYPE;
  is40Act?: BOOLEAN_STRING;
}

export interface InvestorInfo {
  totalNumberAlreadyInvested?: number;
  hasNonAccreditedInvestors?: BOOLEAN_STRING;
  numberNonAccreditedInvestors?: number;
}

export type AGGREGATE_NET_ASSET_VALUE_RANGE_TYPE =
  | "No Aggregate Net Asset Value"
  | "$1 - $5,000,000"
  | "$5,000,001 - $25,000,000"
  | "$25,000,001 - $50,000,000"
  | "$50,000,001 - $100,000,000"
  | "Over $100,000,000"
  | "Decline to Disclose"
  | "Not Applicable";

export type REVENUE_RANGE_TYPE =
  | "No Revenues"
  | "$1 - $1,000,000"
  | "$1,000,001 - $5,000,000"
  | "$5,000,001 - $25,000,000"
  | "$25,000,001 - $100,000,000"
  | "Over $100,000,000"
  | "Decline to Disclose"
  | "Not Applicable";

export interface FuzzyIssuerSize {
  aggregateNetAssetValueRange?: AGGREGATE_NET_ASSET_VALUE_RANGE_TYPE;
  revenueRange?: REVENUE_RANGE_TYPE;
}

export interface PersonName {
  firstName?: string;
  lastName?: string;
  middleName?: string;
}

export interface PreviousNameList {
  previousName?: string[];
}

export interface OfferingData {
  businessCombinationTransaction: BusinesCombinationTransaction;
  durationOfOffering: OfferingDuration;
  federalExemptionsExclusions: FederalExamptionsExclusions;
  industryGroup: IndustryGroup;
  investors: InvestorInfo;
  issuerSize: FuzzyIssuerSize;
  minimumInvestmentAccepted?: number;
  offeringSalesAmounts: OfferingSalesAmounts;
  salesCommissionsFindersFees: CommissionFee;
  salesCompensationList: SalesCompensationList;
  signatureBlock: SignatureBlock;
  typeOfFiling: FilingType;
  typesOfSecuritiesOffered: SecuritiesOfferedType;
  useOfProceeds: ProceedsUse;
}

export interface OfferingDuration {
  moreThanOneYear?: BOOLEAN_STRING;
}

export const INDEFINITE = "Indefinite";

export interface OfferingSalesAmounts {
  clarificationOfResponse?: string;
  totalAmountSold?: number;
  totalOfferingAmount?: number | typeof INDEFINITE;
  totalRemaining?: number | typeof INDEFINITE;
}

export type OTHER = "Other";

export interface ProceedsUse {
  clarificationOfResponse?: string;
  grossProceedsUsed: FuzzyAmount;
}

export type REAL_ESTATE_INDUSTRY_LIST =
  | "Commercial"
  | "Construction"
  | "REITS and Finance"
  | "Residential"
  | "Other Real Estate";

export interface RelatedPersonList {
  over100PersonsFlag?: BOOLEAN_STRING;
  relatedPersonInfo: RelatedPerson[];
}

export interface RelatedPerson {
  relatedPersonAddress: Address;
  relatedPersonName: PersonName;
  relatedPersonRelationshipList: RelationshipTypeList;
  relationshipClarification?: string;
}

export type RELATIONSHIP_TYPE = "Executive Officer" | "Director" | "Promoter";

export interface RelationshipTypeList {
  relationship: RELATIONSHIP_TYPE[];
}

export interface SalesCompensationList {
  over100RecipientFlag?: BOOLEAN_STRING;
  recipient?: SalesCompensationRecipient[];
}

export interface SalesCompensationRecipient {
  associatedBDCRDNumber?: string;
  associatedBDName?: string;
  foreignSolicitation?: BOOLEAN_STRING;
  recipientAddress: Address;
  recipientCRDNumber?: string;
  recipientName?: string;
  statesOfSolicitationList: StatesOfSolicitationList;
}

export class SecuritiesOfferedType {
  descriptionOfOtherType?: string;
  isDebtType?: BOOLEAN_STRING;
  isEquityType?: BOOLEAN_STRING;
  isMineralPropertyType?: BOOLEAN_STRING;
  isOptionToAcquireType?: BOOLEAN_STRING;
  isOtherType?: BOOLEAN_STRING;
  isPooledInvestmentFundType?: BOOLEAN_STRING;
  isSecurityToBeAcquiredType?: BOOLEAN_STRING;
  isTenantInCommonType?: BOOLEAN_STRING;
}

export interface SignatureBlock {
  authorizedRepresentative?: BOOLEAN_STRING;
  signature: Signature[];
}

export class Signature {
  issuerName?: string;
  nameOfSigner?: string;
  signatureDate?: Date;
  signatureName?: string;
  signatureTitle?: string;
}

export interface StatesOfSolicitationList {
  description?: string[];
  state?: StateSolicitationCode[];
}

export interface FuzzyYear {
  overFiveYears?: BOOLEAN_STRING;
  value?: YYYY;
  withinFiveYears?: BOOLEAN_STRING;
  yetToBeFormed?: BOOLEAN_STRING;
}

export type ExemptionsExclusions =
  | "04"
  | "04.1"
  | "04.2"
  | "04.3"
  | "05"
  | "06"
  | "06b"
  | "06c"
  | "46"
  | "4a5"
  | "3C";

export type BUSINESS_SERVICES_LIST = "Business Services";

export type AGRICULTURE_INDUSTRY_LIST = "Agriculture";

export type BANKING_FINANCIAL_INDUSTRY_LIST =
  | "Commercial Banking"
  | "Insurance"
  | "Investing"
  | "Investment Banking"
  | "Pooled Investment Fund"
  | "Other Banking and Financial Services";

export type TECHNOLOGY_INDUSTRY_LIST = "Computers" | "Telecommunications" | "Other Technology";

export type MANUFACTURING_INDUSTRY_LIST = "Manufacturing";

export type TRAVEL_INDUSTRY_LIST =
  | "Airlines and Airports"
  | "Lodging and Conventions"
  | "Tourism and Travel Services"
  | "Other Travel";

export type RESTAURANTS_INDUSTRY_LIST = "Restaurants";

export type RETAILING_INDUSTRY_LIST = "Retailing";

export type SECTION_3C_LIST =
  | "3C.1"
  | "3C.2"
  | "3C.3"
  | "3C.4"
  | "3C.5"
  | "3C.6"
  | "3C.7"
  | "3C.9"
  | "3C.10"
  | "3C.11"
  | "3C.12"
  | "3C.13"
  | "3C.14";

export type ENERGY_INDUSTRY_LIST =
  | "Coal Mining"
  | "Electric Utilities"
  | "Energy Conservation"
  | "Environmental Services"
  | "Oil and Gas"
  | "Other Energy";

export type INDUSTRY_GROUP =
  | AGRICULTURE_INDUSTRY_LIST
  | BANKING_FINANCIAL_INDUSTRY_LIST
  | BUSINESS_SERVICES_LIST
  | ENERGY_INDUSTRY_LIST
  | HEALTH_CARE_INDUSTRY_LIST
  | MANUFACTURING_INDUSTRY_LIST
  | REAL_ESTATE_INDUSTRY_LIST
  | RETAILING_INDUSTRY_LIST
  | RESTAURANTS_INDUSTRY_LIST
  | TECHNOLOGY_INDUSTRY_LIST
  | "Other";

export type BOOLEAN_STRING = "true" | "false";
