//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const ASSET_BACKED_EXHIBIT = [
  ["ABS-EE", "Form for Submission of Electronic Exhibits in asset-backed securities offerings."],
  ["ABS-EE/A", "Amendment to a previously filed ABS-EE."],
  ["ABS-15G", "Asset-backed securities report pursuant to Section 15G."],
  ["ABS-15G/A", "Amendment to a previously filed ABS-15G."],
  [
    "10-D",
    "Periodic distribution reports by asset-backed issuers pursuant to Rule 13a-17 or 15d-17.",
  ],
  ["10-D/A", "Amendment to a previously filed 10-D."],
  ["SF-3", "Registration statement for asset-backed securities under the Securities Act of 1933."],
  ["SF-3/A", "Amendment to a previously filed SF-3."],
  ["SF-3MEP", "Post-effective amendment to a previously filed SF-3."],
  ["SF-1", "Registration statement for asset-backed securities under the Securities Act of 1933."],
  ["SF-1/A", "Amendment to a previously filed SF-1."],
  ["SF-1MEP", "Post-effective amendment to a previously filed SF-1."],
] as const;
export const ASSET_BACKED_EXHIBIT_FORM_NAMES = ASSET_BACKED_EXHIBIT.map(([name]) => name);
export type AssetBackedExhibitForm = (typeof ASSET_BACKED_EXHIBIT_FORM_NAMES)[number];
