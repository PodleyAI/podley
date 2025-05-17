//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10_QT extends Form {
  static readonly name = "Quarterly Transition Report";
  static readonly description =
    "Quarterly transition reports filed pursuant to rule 13a-10 or 15d-10 of the Securities Exchange Act.";
  static readonly forms = ["10-QT", "10-QT/A"] as const;
}
