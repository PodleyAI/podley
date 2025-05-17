//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_14AE24 extends Form {
  static readonly name = "Proxy Statement for Mergers and Acquisitions";
  static readonly description =
    "Proxy statement for mergers and acquisitions involving investment companies pursuant to Section 14(a) of the Securities Exchange Act of 1934";
  static readonly forms = ["N14AE24", "N14AE24/A", "N-14AE24", "N-14AE24/A"] as const;
}
