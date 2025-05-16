//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* Original descriptions taken from https://help.edgar-online.com/edgar/formtypes.asp and copyright 2025 Edgar Online, Inc. */
/* Much was added via LLM based on OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const REGISTRATION_STATEMENTS = [
  [
    "DRS",
    "Draft registration statement submitted by Emerging Growth Companies or foreign private issuers under specified policies.",
  ],
  ["DRS/A", "Amended draft registration statement."],
  ["DRSLTR", "Correspondence related to draft registration statements."],
  [
    "S-1",
    'This filing is a pre-effective registration statement submitted when a company decides to go public. Commonly referred to as an "IPO" (Initial Public Offering) filing.',
  ],
  ["S-1/A", "This filing is a pre-effective amendment to an S-1 IPO filing."],
  [
    "S-1MEF",
    "Registration of up to an additional 20% of securities for any offering registered on an S-1.",
  ],
  ["POS AM", "This filing is a post-effective amendment to an S-Type filing."],
  [
    "S-2",
    "This filing is an optional registration form that may be used by companies which have reported under the '34 Act for a minimum of three years and have timely filed all required reports during the 12 calendar months and any portion of the month immediately preceding the filing of the registration statement.",
  ],
  ["S-2/A", "This filing is a pre-effective amendment to an S-2 filing."],
  [
    "S-2MEF",
    "Registration of up to an additional 20% of securities for any offering registered on an S-2.",
  ],
  [
    "S-3",
    "This filing is the most simplified registration form and it may only be used by companies which have reported under the '34 Act for a minimum of twelve months and meet the timely filing requirements set forth under Form S-2. The filing company must also meet the stringent qualitative tests prescribed by the form.",
  ],
  ["S-3/A", "This filing is a pre-effective amendment to an S-3 filing."],
  [
    "S-3MEF",
    "Registration of up to an additional 20% of securities for any offering registered on an S-3.",
  ],
  [
    "S-3D",
    "Registration statement of securities pursuant to dividend or interest reinvestment plans which become effective automatically upon filing.",
  ],
  ["S-3D/A", "Amendment to a previously filed S-3D."],
  ["S-3DPOS", "This filing is a post-effective amendment to an S-3D filing."],
  [
    "S-4",
    "This filing is for the registration of securities issued in business combination transactions.",
  ],
  ["S-4/A", "This filing is a pre-effective amendment to an S-4 filing."],
  [
    "S-4EF",
    "Filed when securities are issued in connection with the formation of a bank, savings and loan, or holding company.",
  ],
  ["S-4EF/A", "This filing is a pre-effective amendment to an S-4EF filing."],
  ["S-4 POS", "This filing is a post-effective amendment to an S-4EF filing."],
  [
    "S-4MEF",
    "Registration pursuant to Securities Act Rule 462(b) of up to an additional 20% of securities for an offering that was registered on a Form S-3.",
  ],
  ["S-6", "Initial registration statement for unit investment trusts."],
  ["S-6/A", "This filing is a pre-effective amendment to an S-6 filing."],
  [
    "S-8",
    "This filing is required when securities are to be offered to employees pursuant to employee benefit plans.",
  ],
  ["S-8/A", "Amendment to a previously filed S-8."],
  ["S-8 POS", "This filing is a post-effective amendment to an S-8 filing."],
  ["S-11", "Filing for the registration of securities of certain real estate companies."],
  ["S-11/A", "This filing is a pre-effective amendment to an S-11 filing."],
  [
    "S-11MEF",
    "Registration of up to an additional 20% of securities for any offering registered on an S-11.",
  ],
  ["S-20", "Initial registration statement for standardized options."],
  ["S-20/A", "Amendment to a previously filed S-20."],
  [
    "SB-1",
    "An optional filing for small business issuers for the registration of securities to be sold to the public.",
  ],
  ["SB-1/A", "This filing is a pre-effective amendment to an SB-1 filing."],
  [
    "SB-1MEF",
    "Registration of up to an additional 20% of securities for any offering registered on an SB-1.",
  ],
  [
    "SB-2",
    "Also an optional filing for small business issuers for the registration of securities to be sold to the public.",
  ],
  ["SB-2/A", "This filing is a pre-effective amendment to an SB-2 filing."],
  [
    "SB-2MEF",
    "Registration of up to an additional 20% of securities for any offering registered on an SB-2.",
  ],
  ["POS AMI", "Post-effective amendments."],
  [
    "424A",
    "Contains substantive changes from or additions to a prospectus previously filed with the SEC as part of the registration statement.",
  ],
  [
    "424B1",
    "A form of prospectus that discloses information previously omitted from the prospectus filed as part of a registration statement.",
  ],
  [
    "424B2",
    "A form of prospectus filed in connection with a primary offering of securities on a delayed basis which includes the public offering price, description of securities and specific method of distribution.",
  ],
  [
    "424B3",
    "A form of prospectus that reflects facts or events that constitute a substantive change from or addition to the information set forth in the last form of prospectus filed with the SEC.",
  ],
  [
    "424B4",
    "A form of prospectus that discloses information, facts or events covered in both form 424B1 and form 424B3.",
  ],
  [
    "424B5",
    "A form of prospectus that discloses information, facts or events covered in both form 424B2 and form 424B3.",
  ],
  [
    "424B7",
    "Prospectus supplement filed pursuant to Rule 424(b)(7) to supplement a previously filed prospectus.",
  ],
  [
    "425",
    "Filing of certain prospectuses and communications in connection with business combination transactions.",
  ],
  [
    "424B8",
    "Allows issuers to indicate that a prospectus supplement is being filed late under Rule 424(b)(8).",
  ],
  ["424H", "Prospectus filed pursuant to Securities Act Rule 424(h)."],
  ["424H/A", "Amendment to a previously filed 424H."],
  ["FWP", "Free writing prospectus filed pursuant to Securities Act Rules 163 and 433."],
  ["DEL AM", "Delaying amendment."],
  ["497", "Definitive materials filed by investment companies."],
  ["497J", "Certification of no change in definitive materials."],
  [
    "497VPI",
    "Initial summary prospectus for variable contracts filed pursuant to Securities Act Rule 497(k).",
  ],
  [
    "497VPU",
    "Updating summary prospectus for variable contracts filed pursuant to Securities Act Rule 497(k).",
  ],
  ["487", "Pre-effective pricing amendment."],
  [
    "10-12B",
    "A general registration filing of securities pursuant to section 12(b) of the Securities Exchange Act.",
  ],
  ["10-12B/A", "Amendment to a previously filed 10-12B."],
  [
    "10-12G",
    "A general registration filing of securities pursuant to section 12(g) of the Securities Exchange Act.",
  ],
  ["10-12G/A", "Amendment to a previously filed 10-12G."],
  [
    "10SB12B",
    "Filed for the registration of securities for small business issuers pursuant to section 12(b) of the Securities Exchange Act.",
  ],
  ["10SB12B/A", "Amendment to a previously filed 10SB12B."],
  [
    "10SB12G",
    "Filed for the registration of securities for small business issuers pursuant to section 12(g) of the Securities Exchange Act.",
  ],
  ["10SB12G/A", "Amendment to a previously filed 10SB12G."],
  [
    "18-12B",
    "Registration of securities filed pursuant to section 12(b) of the Securities Exchange Act.",
  ],
  ["18-12B/A", "Amendment to a previously filed 18-12B."],
  [
    "18-12G",
    "Registration of securities filed pursuant to section 12(g) of the Securities Exchange Act.",
  ],
  ["18-12G/A", "Amendment to a previously filed 18-12G."],
  [
    "N-8A",
    "Notification of registration filed pursuant to Section 8(a) of the Investment Company Act of 1940.",
  ],
  ["N-8A/A", "Amendment to a previously filed N-8A."],
  ["N-8B-2", "Registration statement for unit investment trusts."],
  ["N-8B-2/A", "Amendments to a previously filed N-8B-2."],
  ["N-1", "Registration statement for open-end management investment companies."],
  ["N-1/A", "Amendments to a previously filed N-1."],
  ["N-1A", "Registration statement for Mutual Funds."],
  ["N-1A/A", "Amendments to a previously filed N-1A."],
  ["N-2", "Registration statement for closed-end investment companies."],
  ["N-2/A", "This filing is a pre-effective amendment to an N-2 filing."],
  ["N-3", "Registration statement for separate accounts (management investment companies)."],
  ["N-3/A", "This filing is a pre-effective amendment to an N-3 filing."],
  ["N-4", "Registration statement for separate accounts (unit investment trusts)."],
  ["N-4/A", "This filing is a pre-effective amendment to an N-4 filing."],
  ["N-5", "Registration statement for small business investment companies."],
  ["N-5/A", "This filing is a pre-effective amendment to an N-5 filing."],
  ["N-54A", "Notification of election by business development companies filed on Form N-54A."],
  ["N-54A/A", "Amendment to a previously filed N-54A."],
  ["N-54C", "Notification of withdrawal by business development companies filed on Form N-54C."],
  ["N-54C/A", "Amendment to a previously filed N-54C."],
  ["N-14", "Registration statement for investment companies business combination."],
  ["N-14/A", "Pre-effective amendment to a previously filed N-14."],
  ["N-14/AE", "Initial statement with automatic effectiveness."],
  ["N-14/AE/A", "Pre-effective amendment."],
  ["N-14 8C", "Registration statement for closed-end investment company."],
  ["N-14 8C/A", "Pre-effective amendment."],
  ["F-1", "Registration statement for certain foreign private issuers."],
  ["F-1/A", "This filing is a pre-effective amendment to an F-1 filing."],
  [
    "F-1MEF",
    "Registration of up to an additional 20% of securities for an offering filed on an F-1.",
  ],
  ["F-2", "Registration statement for certain foreign private issuers."],
  ["F-2/A", "Amendment to a previously filed F-2."],
  [
    "F-2D",
    "Registration of securities pursuant to dividend or interest reinvestment plans (foreign).",
  ],
  ["F-2DPOS", "Post-effective amendments to a previously filed F-2D."],
  [
    "F-2MEF",
    "Registration pursuant to Securities Act Rule 462(b) of up to an additional 20% of securities for an offering that was registered on a Form F-2.",
  ],
  [
    "F-3",
    "Registration statement for certain foreign private issuers offered pursuant to certain types of transactions.",
  ],
  ["F-3/A", "Amendment to a previously filed F-3."],
  ["F-3ASR", "Automatic shelf registration report filed pursuant to Rule 462(b)(1)."],
  ["F-3ASR/A", "Amendment to a previously filed F-3ASR."],
  ["S-3ASR", "Automatic shelf registration filed by a well-known seasoned issuer (WKSIs)."],
  ["S-3ASR/A", "Amendment to a previously filed S-3ASR."],
  ["POSASR", "Post-effective amendment to a previously filed S-3ASR or F-3ASR."],
  [
    "F-3D",
    "Registration statement for certain foreign private issuers offered pursuant to dividend or interest reinvestment plans.",
  ],
  ["F-3DPOS", "Amendment to a previously filed F-3D."],
  [
    "F-4",
    "Registration statement for foreign private issuers issued in certain business transactions.",
  ],
  ["F-4/A", "Amendment to a previously filed F-4."],
  [
    "F-6",
    "Registration of depository shares evidenced by American Depository Receipts. Filing to become effective other than immediately upon filing.",
  ],
  ["F-6/A", "Amendment to a previously filed F-6."],
  ["F-6 POS", "Post-effective amendment to a previously filed F-6."],
  [
    "F-6EF",
    "Registration of depositary shares evidenced by American Depository Receipts. Filing to become effective immediately upon filing.",
  ],
  ["F-6EF/A", "Amendment to a previously filed F-6EF."],
  [
    "F-10",
    "Registration statement for securities of certain Canadian issuers under the Securities Act of 1933.",
  ],
  ["F-10/A", "Amendment to a previously filed F-10."],
  [
    "F-N",
    "Appointment of agent for service of process by foreign banks and foreign insurance companies.",
  ],
  ["F-N/A", "Amendment to a previously filed F-N."],
  [
    "F-10EF",
    "Auto effective registration statement for securities of certain Canadian issuers under the Securities Act of 1933.",
  ],
  ["F-10EF/A", "Amendment to a previously filed F-10EF."],
  ["F-10POS", "Post-effective amendment to a previously filed F-10EF."],
  [
    "20FR12B",
    "Registration of securities of foreign private issuers pursuant to section 12(b) of the Securities Exchange Act.",
  ],
  ["20FR12B/A", "Amendment to a previously filed 20FR12B."],
  [
    "20FR12G",
    "Registration of securities of foreign private issuers pursuant to section 12(g) of the Securities Exchange Act.",
  ],
  ["20FR12G/A", "Amendment to a previously filed 20FR12G."],
  [
    "24F-1",
    "Registration of securities by certain investment companies pursuant to rule 24f-1. Notification of election.",
  ],
  [
    "24F-2EL",
    "Registration of securities by certain investment companies pursuant to rule 24f-2. Declaration of election.",
  ],
  ["24F-2EL/A", "Amendment to a previously filed 24F-2EL."],
  [
    "24F-2NT",
    "Registration of securities by certain investment companies pursuant to rule 24f-2. Rule 24f-2 notice.",
  ],
  ["24F-2NT/A", "Amendment to a previously filed 24F-2NT."],
  [
    "POS462B",
    "Post-effective amendment to proposed Securities Act Rule 462(b) registration statement.",
  ],
  [
    "POS462C",
    "Post-effective amendment to proposed Securities Act Rule 462(c) registration statement.",
  ],
  ["CERT", "General certificate filing."],
  ["CERTNYS", "Certificate filed pursuant to New York Stock Exchange rules."],
  ["CERTNYS/A", "Amendment to a previously filed CERTNYS."],
  ["CERTARCA", "Certificate filed pursuant to NYSE Arca rules."],
  ["CERTARCA/A", "Amendment to a previously filed CERTARCA."],
  [
    "CERTPAC",
    "Certification by the Pacific Coast Stock Exchange approving securities for listing.",
  ],
  ["CERTNAS", "Certification by the Nasdaq Stock Market approving securities for listing."],
  ["CERTCBO", "Certification by the Chicago Board of Options approving securities for listing."],
  ["CERTAMX", "Certification by the American Stock Exchange approving securities for listing."],
  ["CERTPAC/A", "Amendment to a previously filed CERTPAC."],
  ["CERTCBO/A", "Amendment to a previously filed CERTCBO."],
  ["CERTNAS/A", "Amendment to a previously filed CERTNAS."],
  ["CERTAMX/A", "Amendment to a previously filed CERTAMX."],
  ["CERTBATS", "Certificate filed pursuant to BATS Exchange rules."],
  ["CERTBATS/A", "Amendment to a previously filed CERTBATS."],
  [
    "8-A12B",
    "Registration of certain classes of securities pursuant to section 12(b) of the Securities Exchange Act.",
  ],
  ["8-A12B/A", "Amendment to a previously filed 8-A12B."],
  [
    "8-A12G",
    "Registration of certain classes of securities pursuant to section 12(g) of the Securities Exchange Act.",
  ],
  ["8-A12G/A", "Amendment to a previously filed 8-A12G."],
  [
    "8-B12B",
    "Registration of securities of certain successor issuers pursuant to section 12(b) of the Securities Exchange Act.",
  ],
  ["8-B12B/A", "Amendment to a previously filed 8-B12B."],
  [
    "8-B12G",
    "Registration of securities of certain successor issuers pursuant to section 12(g) of the Securities Exchange Act.",
  ],
  ["8-B12G/A", "Amendment to a previously filed 8-B12G."],
  [
    "8A12BEF",
    "Registration of listed debt securities pursuant to section 12(b) - filing to become effective automatically upon filing.",
  ],
  [
    "8A12BT",
    "Registration of listed debt securities pursuant to section 12(b) - filing to become effective simultaneously with the effective of a concurrent Securities Act registration statement.",
  ],
  ["8A12BT/A", "Amendment to a previously filed 8A12BT."],
  [
    "485A24E",
    "Registration statement for separate accounts (management investment companies). Post-effective amendment filed pursuant to Rule 485(b) with additional shares under 24e-2.",
  ],
  [
    "485A24F",
    "Registration statement for separate accounts (management investment companies). Post-effective amendment filed pursuant to Rule 485(b) with additional shares under 24f-2.",
  ],
  [
    "485APOS",
    "Registration statement for separate accounts (management investment companies). Post-effective amendment filed pursuant to Rule 485(a).",
  ],
  [
    "485B24E",
    "Registration statement for separate accounts (management investment companies). Post-effective amendment filed pursuant to Rule 485(a) with additional shares under 24e-2.",
  ],
  [
    "485B24F",
    "Registration statement for separate accounts (management investment companies). Post-effective amendment filed pursuant to Rule 485(b) with additional shares under 24f-2.",
  ],
  [
    "485BPOS",
    "Registration statement for separate accounts (management investment companies). Post-effective amendment filed pursuant to Rule 485(b).",
  ],
  [
    "485BXT",
    "Post-effective amendment filed pursuant to Securities Act Rule 485(b)(1)(iii) to designate a new effective date for a post-effective amendment previously filed pursuant to Rule 485(a).",
  ],
  ["486BPOS", "Post-effective amendment filed pursuant to Rule 485(b)."],
  ["497K", "Prospectus filed in accordance with Investment Company Act Form 497-K."],
  ["497K1", "Additional certification under Investment Company Act Form 497-K1."],
  ["POS EX", "Post-effective amendment exhibit to a registration statement."],
  ["CB", "Business combination transaction report under Section 12(b)."],
  ["F-X", "Registration statement or amendment under Securities Act Form F-X."],
  ["F-X/A", "Amendment to a previously filed F-X."],
  [
    "SUPPL",
    "Supplemental information or corrections to a registration statement outside of the normal prospectus update process.",
  ],
] as const;

export const REGISTRATION_FORMS = REGISTRATION_STATEMENTS.map(([name]) => name);

export type RegistrationForm = (typeof REGISTRATION_FORMS)[number];
