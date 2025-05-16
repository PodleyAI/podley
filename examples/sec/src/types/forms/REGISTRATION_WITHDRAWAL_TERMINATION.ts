//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const REGISTRATION_WITHDRAWAL_TERMINATION_STATEMENTS = [
  ["RW", "Request for a withdrawal of a previously filed registration statement."],
  ["AW", "Amendment to a previously filed RW."],
  ["AW WD", "Withdrawal of a request for withdrawal of an amendment to a registration statement."],
  [
    "15-12G",
    "Certification of termination of registration of a class of security under Section 12(g) or notice of suspension of duty to file reports pursuant to Section 13 and 15(d) of the Securities Exchange Act. Section 12 (g) initial filing.",
  ],
  ["15-12G/A", "Amendment to a previously filed 15-12G."],
  [
    "15-15D",
    "Certification of termination of registration of a class of security under Section 12(g) or notice of suspension of duty to file reports pursuant to Section 13 and 15(d) of the Securities Exchange Act. Section 13 and 15 (d) initial filing.",
  ],
  ["15-15D/A", "Amendment to a previously filed 15-15D."],
  [
    "15-12B",
    "Certification of termination of registration of a class of security under Section 12(g) or notice of suspension of duty to file reports pursuant to Section 13 and 15(d) of the Securities Exchange Act. Section 12 (b) initial filing.",
  ],
  ["15-12B/A", "Amendment to a previously filed 15-12B."],
  [
    "24F-2TM",
    "Registration of securities by certain investment companies pursuant to rule 24f-2. Termination of declaration of election.",
  ],
  [
    "15F-12B",
    "Notice of termination by a foreign private issuer of a class of securities under Section 12(b).",
  ],
  ["15F-12B/A", "Amendment to a previously filed 15F-12B."],
  [
    "15F-12G",
    "Notice of termination of a foreign private issuer's registration of a class of securities under Section 12(g).",
  ],
  ["15F-12G/A", "Amendment to a previously filed 15F-12G."],
  [
    "15F-15D",
    "Notice of a foreign private issuer's suspension of duty to file reports pursuant to Section 13 and 15(d) of the Act.",
  ],
  ["15F-15D/A", "Amendment to a previously filed 15F-15D."],
] as const;
export const REGISTRATION_WITHDRAWAL_FORMS = REGISTRATION_WITHDRAWAL_TERMINATION_STATEMENTS.map(
  ([name]) => name
);
export type RegistrationWithdrawalForm = (typeof REGISTRATION_WITHDRAWAL_FORMS)[number];
