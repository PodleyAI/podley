//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_MFP extends Form {
  static readonly name = "Generic Monthly Report";
  static readonly description = "Generic monthly report of Money Market Funds on Form N-MFP.";
  static readonly forms = ["N-MFP", "N-MFP/A", "NT N-MFP"] as const;
}
