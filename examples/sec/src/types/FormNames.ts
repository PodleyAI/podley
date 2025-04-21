//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

/* These descriptions taken from https://help.edgar-online.com/edgar/formtypes.asp */

export type RegistrationForm =
  | "DRS" // Intent to register
  | "DRS/A" // Intent to register (ammended)
  | "DRSLTR" // Correspondence Related to Draft Registration Statement
  | "S-1" // This filing is a pre-effective registration statement submitted when a company decides to go public. Commonly referred to as an "IPO" (Initial Public Offering) filing.
  | "S-1/A" // This filing is a pre-effective amendment to an S-1 IPO filing.
  | "S-1MEF" // Registration of up to an additional 20% of securities for any offering registered on an S-1.
  | "POS AM" // This filing is a post-effective amendment to an S-Type filing.
  | "S-3ASR"
  | "S-4" // This filing is for the registration of securities issued in business combination transactions.
  | "S-4/A" // This filing is a pre-effective amendment to an S-4 filing.
  | "F-1" // Registration statement for certain foreign private issuers.
  | "F-1/A" // This filing is a pre-effective amendment to an F-1 filing.
  | "F-10" // Registration statement for certain Canadian private issuers.
  | "F-10/A" // This filing is a pre-effective amendment to an F-10 filing.
  | "F-10EF" // Auto effective registration statement for securities of certain Canadian issuers under the Securities Act of 1933.
  | "F-1MEF" // Registration of up to an additional 20% of securities for an offering filed on an F-1. Rule 462(b)
  | "POS462B" // Post-effective amendment to Securities Act Rule 462(b) registration statement. POS for MEF
  | "F-4" // Registration statement for foreign private issuers issued in certain business transactions.
  | "F-4/A" // Amendment to a previously filed F-4.
  | "F-4EF" // Auto effective registration statement for securities by certain foreign private issuers in connection with certain business combination transactions.
  | "F-6" // Registration of depository shares evidenced by American Depository Receipts. Filing to become effective other than immediately upon filing.
  | "F-6/A" // Amendment to a previously filed F-6.
  | "F-6POS" // Post-effective amendment to a previously filed F-6.
  | "F-6EF" // Registration of depositary shares evidenced by American Depository Receipts. Filing to become effective immediately upon filing.
  | "F-6EF/A" // Amendment to a previously filed F-6EF.
  | "8-A12B" // Registration of certain classes of securities pursuant to section 12(b) of the Securities Exchange Act.
  | "8-A12B/A" // Amendment to a previously filed 8-A12B.
  | "424A" // Contains substantive changes from or additions to a prospectus previously filed with the SEC as part of the registration statement.
  | "424B1" // A form of prospectus that discloses information previously omitted from the prospectus filed as part of a registration statement.
  | "424B2" // A form of prospectus filed in connection with a primary offering of securities on a delayed basis which includes the public offering price, description of securities and specific method of distribution.
  | "424B3" // A form of prospectus that reflects facts or events that constitute a substantive change from or addition to the information set forth in the last form of prospectus filed with the SEC.
  | "424B4" // A form of prospectus that discloses information, facts or events covered in both form 424B1 and form 424B3.
  | "424B5" // A form of prospectus that discloses information, facts or events covered in both form 424B2 and form 424B3.
  | "425" // Filing of certain prospectuses and communications in connection with business combination transactions.
  | "DEL AM" // Delaying amendment.
  | "S-8" // This filing is required when securities are to be offered to employees pursuant to employee benefit plans.
  | "S-8/A" // Amendment to a previously filed S-8.
  | "S-8 POS" // This filing is a post-effective amendment to an S-8 filing.
  | "FWP"; // A free writing prospectus (FWP) is a written communication regarding securities being publicly offered disseminated by the issuer during the waiting period of an initial public offering (IPO)  that discloses information that would not be included in the registration statement.

export type RegistrationOnExchange =
  | "8-A12B"
  | "8-A12B/A" // Form for the registration / listing of a class of securities on a national securities exchange pursuant to Section 12(b)
  | "8-A12G"
  | "8-A12G/A" // Form for the registration / listing of a class of securities on a national securities exchange pursuant to Section 12(g)
  | "CERT"; // CERT Certification by an exchange approving securities for listing

export type RegistrationWithdrawalForm =
  | "RW" // Request for a withdrawal of a previously filed registration statement.
  | "AW" // Amendment to a previously filed RW.
  | "RW WD" // Undo RW
  | "15-12B" // Certification of termination of registration of a class of security under Section 12(b) or notice of suspension of duty to file reports pursuant to Section 13 and 15(d) of the Securities Exchange Act. Section 12 (g) initial filing.
  | "15-12B/A" // Amendment to a previously filed 15-12B.
  | "15-12D" // Certification of termination of registration of a class of security under Section 12(d) or notice of suspension of duty to file reports pursuant to Section 13 and 15(d) of the Securities Exchange Act. Section 12 (g) initial filing.
  | "15-12D/A" // Amendment to a previously filed 15-12D.
  | "15-12G" // Certification of termination of registration of a class of security under Section 12(g) or notice of suspension of duty to file reports pursuant to Section 13 and 15(d) of the Securities Exchange Act. Section 12 (g) initial filing.
  | "15-12G/A" // Amendment to a previously filed 15-12G.
  | "15F-15D"
  | "15F-15D/A"
  | "25"
  | "25/A" // Notice of listing removal
  | "25-NSE"
  | "25-NSE/A" // Delisting warning from national stock exchange
  | "SC 13E3" // Going private transaction by certain issuers.
  | "SC 13E3/A"; // Amendment to a previously filed SC 13E3.

export type InsiderTrading =
  | "3" // An initial filing of equity securities filed by every director, officer, or owner of more than ten percent of a class of equity securities.
  | "3/A" // An amendment to a 3 filing. This form is not required to be filed with the EDGAR system.
  | "4" // Any changes to a previously filed form 3 are reported in this filing.
  | "4/A" // Amendment to a previously filed 4.
  | "5" // An annual statement of ownership of securities filed by every director, officer, or owner of more than ten percent of a class of equity securities.
  | "5/A" // Amendment to a previously filed 5.
  | "144" // This form must be filed by "insiders" prior to their intended sale of restricted stock.
  | "144/A"; // Amendment to a previously filed 144.

export type BeneficialOwnership =
  | "SC 13D" // This filing is made by person(s) reporting beneficially owned shares of common stock in a public company.
  | "SC 13D/A" // An amendment to a SC 13D filing.
  | "SC 13G" // A statement of beneficial ownership of common stock by certain persons.
  | "SC 13G/A"; // An amendment to a SC 13G filing.

export type TenderForms =
  | "SC TO-C" // Written public communication relating to an issuer or third party tender offer not by the subject company.
  | "SC TO-C/A" // An amendment to a SC To-C filing.
  | "SC TO-T" // Tender offer schedule and amendment filed by a third party.
  | "SC TO-T/A" // An amendment to a SC To-T filing.
  | "SC TO-I" // Tender offer schedule and amendment filed by the issuer.
  | "SC TO-I/A"; // An amendment to a SC To-I filing.

export type ProxyForms =
  | "PRE 14A" // A preliminary proxy statement providing official notification to designated classes of shareholders of matters to be brought to a vote at a shareholders meeting.
  | "PREC14A" //Preliminary proxy statement containing contested solicitations.
  | "PREC14C" // Preliminary information statement containing contested solicitations.
  | "DEF 14A" // Provides official notification to designated classes of shareholders of matters to be brought to a vote at a shareholders meeting. This form is commonly refered to as a "Proxy".
  | "DEFM14A" // Provides official notification to designated classes of shareholders of matters relating to a merger or acquisition. (business combination)
  | "DEFM14C" // A definitive information statement relating to a merger or an acquisition.
  | "DEFA14A" // Additional proxy soliciting materials - definitive.
  | "PX14A6G"; // Notice of exempt solicitation. Definitive material.

export type CompanyReports =
  | "8-K" // A report of unscheduled material events or corporate changes which could be of importance to the shareholders or to the SEC. Examples include acquisition, bankruptcy, resignation of directors, or a change in the fiscal year.
  | "8-K/A" // Amendment to a previously filed 8-K.
  | "8-K12B" // Notification that a class of securities of successor issuer is deemed to be registered pursuant to section 12(b)
  | "10-Q" // Quartly report
  | "10-Q/A" // Quartly report (ammended)
  | "NT 10-Q" // Notification that form type 10-Q will be submitted late.
  | "NT 10-Q/A" // Amendment to a previously filed NT 10-Q.
  | "10-K" // An annual report which provides a comprehensive overview of the company for the past year. The filing is due 90 days after the close of the company's fiscal year
  | "10-K/A" // Amendment to a previously filed 10-K.
  | "11-K" // Annual report of Employee Stock Purchase plans
  | "11-K/A" // Annual report of Employee Stock Purchase plans (ammended)
  | "1-K" // Annual Report Pursuant to Regulation A.
  | "1-K/A" // Annual Report Pursuant to Regulation A (ammended)
  | "1-SA" //Semiannual Report Pursuant to Regulation A
  | "1-SA/A" //Semiannual Report Pursuant to Regulation A
  | "1-U" // Current Report pursuant to Regulation A
  | "1-U/A" // Current Report pursuant to Regulation A (ammended)
  | "1-Z"
  | "1-Z/A" // Exit Report under Regulation A
  | "1-Z-W"
  | "1-Z-W/A" // Withdrawal of Exit Report under Regulation A
  | "QUALIF";

export type SecCorrespondence =
  | "CORRESP" // Correspondence
  | "IRANNOTICE"
  | "NO ACT"
  | "SEC STAFF ACTION" //
  | "EFFECT" //
  | "UPLOAD"; // File upload

export type ExemptOfferings =
  | "1-A" // Reg-A Offering Statement
  | "1-A/A" // Pre-qualification amendment for offering statement
  | "1-A POS" // Post-qualification amendment to offering statement
  | "1-A-W" // Offering Statement Withdrawal
  | "1-A-W/A" // Offering Statement Withdrawal Amendment
  | "DOS" // Confidential draft offering statement
  | "DOS/A" // Confidential draft pre-qualification amendment for offering statement
  | "DOSLTR"
  | "C" // Offering Statement (Regulation Crowdfunding)
  | "C-W" // Offering Statement Withdrawal
  | "C/A" // Amendment to Offering Statement
  | "C/A-W" // Amendment to Offering Statement Withdrawal
  | "C-U" // Progress Update
  | "C-U-W" // Progress Update Withdrawal
  | "C-AR" // Annual Report
  | "C-AR-W" // Annual Report Withdrawal
  | "C-AR/A" // Annual Report Amendment
  | "C-AR/A-W" // Annual Report Amendment Withdrawal
  | "C-TR" // Termination of Reporting
  | "C-TR-W" // Termination of Reporting Withdrawal
  | "D" // Notice of sales of unregistered securities
  | "D/A" // An amendment to a form D filing.
  | "253G1"
  | "253G2"
  | "253G3"
  | "253G4";

export type Portal = "CFPORTAL" | "CFPORTAL/A" | "CFPORTAL-W";

export type FormOther = "SD"; // Special Disclosure (example: Conflict Minerals Disclosure)

export type Form =
  | RegistrationForm
  | RegistrationOnExchange
  | RegistrationWithdrawalForm
  | InsiderTrading
  | BeneficialOwnership
  | ProxyForms
  | TenderForms
  | CompanyReports
  | SecCorrespondence
  | ExemptOfferings
  | Portal
  | FormOther;
