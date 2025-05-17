//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_35_CERT extends Form {
  static readonly name = "Terms and Conditions Certificate";
  static readonly description =
    "Certificate concerning terms and conditions filed pursuant to Rule 24 of the Public Utility Holding Company Act.";
  static readonly forms = ["35-CERT", "35-CERT/A"] as const;
}
