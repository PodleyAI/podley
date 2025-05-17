//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_23C_3 extends Form {
  static readonly name = "Notification of Repurchase Offer (Rule 23c-3 ICA 1940)";
  static readonly description =
    "Notification of repurchase offer pursuant to Rule 23c-3 of the Investment Company Act of 1940.";
  static readonly forms = [
    "N-23C-3",
    "N-23C-3/A",
    "N-23C-3A",
    "N-23C-3A/A",
    "N-23C-3B",
    "N-23C-3B/A",
    "N-23C3A",
    "N-23C3A/A",
    "N-23C3B",
    "N-23C3B/A",
  ] as const;
}
