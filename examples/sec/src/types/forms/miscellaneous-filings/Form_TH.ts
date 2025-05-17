//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_TH extends Form {
  static readonly name = "Temporary Hardship";
  static readonly description = "Notification of reliance on temporary hardship exemption.";
  static readonly forms = ["TH"] as const;
}
