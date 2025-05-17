//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PRES14C extends Form {
  static readonly name = "Preliminary Information Statement for Special Meeting";
  static readonly description =
    "A preliminary information statement relating to a special meeting.";
  static readonly forms = ["PRES14C"] as const;
}
