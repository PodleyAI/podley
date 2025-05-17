//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_14 extends Form {
  static readonly name = "Proxy Statement for Investment Company Mergers";
  static readonly description = "Proxy statement for investment company mergers and acquisitions";
  static readonly forms = ["N-14", "N-14/A"] as const;
}
