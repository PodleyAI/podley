//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NTN_10Q extends Form {
  static readonly name = "Notice of Inability to Timely File";
  static readonly description =
    "Notice under Rule 12b-25 of inability to timely file all or part of a Form 10-Q or 10-QSB.";
  static readonly forms = ["NTN 10Q"] as const;
}
