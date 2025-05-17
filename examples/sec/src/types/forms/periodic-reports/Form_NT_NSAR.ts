//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NT_NSAR extends Form {
  static readonly name = "Extension Request for NSAR Forms";
  static readonly description =
    "Request for an extension of time for filing form NSAR-A, NSAR-B or NSAR-U.";
  static readonly forms = ["NT-NSAR", "NT-NSAR/A"] as const;
}
