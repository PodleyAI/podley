//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_APP_WD extends Form {
  static readonly name = "Application Withdrawal";
  static readonly description =
    "Withdrawal of an application for exemptive or other relief from the federal securities laws.";
  static readonly forms = ["APP WD", "APP WD/A"] as const;
}
