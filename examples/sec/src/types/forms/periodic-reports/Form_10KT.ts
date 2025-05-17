//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10KT extends Form {
  static readonly name = "Annual Transition Report";
  static readonly description =
    "Annual transition reports filed pursuant to rule 13a-10 or 15d-10 of the Securities Exchange Act.";
  static readonly forms = ["10-KT", "10-KT/A"] as const;
}
