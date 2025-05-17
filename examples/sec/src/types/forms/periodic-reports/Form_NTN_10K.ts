//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NTN_10K extends Form {
  static readonly name = "Rule 12b-25 Notification for 10-K";
  static readonly description =
    "Notice under Rule 12b-25 of inability to timely file all or part of a Form 10-K.";
  static readonly forms = ["NTN 10K"] as const;
}
