//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10KT405 extends Form {
  static readonly name = "Annual Transition Report (Item 405 Box Checked)";
  static readonly description =
    "Annual transition report filed pursuant to Rule 13a-10 or 15d-10 of the Securities Exchange Act.";
  static readonly forms = ["10KT405", "10KT405/A"] as const;
}
