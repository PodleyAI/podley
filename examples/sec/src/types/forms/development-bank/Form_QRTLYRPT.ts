//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_QRTLYRPT extends Form {
  static readonly name = "Quarterly Development Bank Report";
  static readonly description = "Quarterly report of Development Bank, submitted quarterly.";
  static readonly forms = ["QRTLYRPT", "QRTLYRPT/A"] as const;
}
