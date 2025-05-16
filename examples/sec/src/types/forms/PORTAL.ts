//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const PORTAL = [
  ["CFPORTAL", "Crowdfunding Portal Registration"],
  ["CFPORTAL/A", "Crowdfunding Portal Amendment"],
  ["CFPORTAL-W", "Crowdfunding Portal Withdrawal"],
] as const;
export const PORTAL_FORM_NAMES = PORTAL.map(([name]) => name);
export type PortalForm = (typeof PORTAL_FORM_NAMES)[number];
