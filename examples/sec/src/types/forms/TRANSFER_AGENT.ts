//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const TRANSFER_AGENT = [
  [
    "TA-1",
    "Application for registration as a transfer agent filed pursuant to the Securities Exchange Act of 1934.",
  ],
  ["TA-1/A", "Amendment to a previously filed TA-1."],
  [
    "TA-2",
    "Annual report of transfer agent activities filed pursuant to the Securities Exchange Act of 1934.",
  ],
  ["TA-2/A", "Amendment to a previously filed TA-2."],
  [
    "TA-W",
    "Notice of withdrawal from registration as transfer agent filed pursuant to the Securities Exchange Act of 1934.",
  ],
] as const;
export const TRANSFER_AGENT_FORM_NAMES = TRANSFER_AGENT.map(([name]) => name);
export type TransferAgentForm = (typeof TRANSFER_AGENT_FORM_NAMES)[number];
