//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_POS_AMI extends Form {
  static readonly name = "Post-effective Amendments (POS AMI)";
  static readonly description = "Post-effective amendments.";
  static readonly forms = ["POS AMI"] as const;
}
