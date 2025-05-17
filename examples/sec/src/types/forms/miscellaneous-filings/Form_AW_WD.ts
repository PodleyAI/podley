//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_AW_WD extends Form {
  static readonly name = "Withdrawal of Registration Statement";
  static readonly description =
    "Withdrawal of registration statement filed pursuant to the Securities Act of 1933";
  static readonly forms = ["AW WD"] as const;
}
