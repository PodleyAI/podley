//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_CSR extends Form {
  static readonly name = "Certified Annual Shareholder Report";
  static readonly description =
    "Certified annual shareholder report of registered management investment companies filed on Form N-CSR.";
  static readonly forms = ["N-CSR", "N-CSR/A", "NT-NCSR", "NTFNCSR"] as const;
}
