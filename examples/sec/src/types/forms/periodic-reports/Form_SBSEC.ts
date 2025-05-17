//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SBSEC extends Form {
  static readonly name = "Security-Based Swap Dealer/Participant Certification";
  static readonly description =
    "Certification by security-based swap dealers and major security-based swap participants filed pursuant to Rule 15Fb2-1(a).";
  static readonly forms = ["SBSE-C", "SBSE-C/A"] as const;
}
