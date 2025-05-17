//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_7D extends Form {
  static readonly name = "Utility Facility Lease Certificate";
  static readonly description =
    "Certificate concerning lease of a utility facility filed pursuant to Rule 7(d) of the Public Utility Holding Company Act.";
  static readonly forms = ["U-7D", "U-7D/A"] as const;
}
