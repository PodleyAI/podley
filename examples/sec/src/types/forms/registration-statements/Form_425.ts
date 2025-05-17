//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_425 extends Form {
  static readonly name = "Prospectus (425)";
  static readonly description =
    "Filing of certain prospectuses and communications in connection with business combination transactions.";
  static readonly forms = ["425"] as const;
}
