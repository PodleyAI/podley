//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_MFP1 extends Form {
  static readonly name = "Monthly Schedule of Portfolio Holdings";
  static readonly description =
    "Monthly Schedule of Portfolio Holdings of Money Market Funds on Form N-MFP1.";
  static readonly forms = ["N-MFP1", "N-MFP1/A", "NT N-MFP1"] as const;
}
