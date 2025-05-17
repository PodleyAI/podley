//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NPORT_P extends Form {
  static readonly name = "Monthly Portfolio Investments Report (Public)";
  static readonly description = "Monthly Portfolio Investments Report on Form N-PORT (Public).";
  static readonly forms = ["NPORT-P", "NPORT-P/A", "NT NPORT-P"] as const;
}
