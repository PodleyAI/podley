//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_14EL24 extends Form {
  static readonly name = "Proxy Statement for Investment Company Mergers Electronic Filing";
  static readonly description =
    "Proxy statement for investment company mergers and acquisitions filed electronically";
  static readonly forms = ["N14EL24", "N14EL24/A", "N-14EL24", "N-14EL24/A"] as const;
}
