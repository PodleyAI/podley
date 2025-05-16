//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const CORRESPONDENCE_SUBMISSION_TYPES = [
  [
    "CORRESP",
    "Correspondence - submission to SEC staff; not immediately public, may be released later.",
  ],
  ["IRANNOTICE", "Internal review and annotation notice."],
  ["NO ACT", "No-action letter request."],
  ["SEC STAFF ACTION", "Notification of SEC staff action."],
  ["SEC STAFF LETTER", "SEC staff letter."],
  ["EFFECT", "Effectiveness notice."],
  ["UPLOAD", "File upload submission."],
  ["CT ORDER", "Court order affecting SEC filings."],
] as const;
export const CORRESPONDENCE_SUBMISSION_TYPE_FORM_NAMES = CORRESPONDENCE_SUBMISSION_TYPES.map(
  ([name]) => name
);
export type CorrespondenceSubmissionTypeForm =
  (typeof CORRESPONDENCE_SUBMISSION_TYPE_FORM_NAMES)[number];
