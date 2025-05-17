//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10QSB extends Form {
  static readonly name = "Small Business Quarterly Report";
  static readonly description =
    "A quarterly report which provides a continuing view of a company's financial position during the year. The 10QSB form is filed by small businesses.";
  static readonly forms = ["10QSB", "10QSB/A"] as const;
}
