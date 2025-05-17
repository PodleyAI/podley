//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_R_1 extends Form {
  static readonly name = "Solicitations Declaration";
  static readonly description =
    "Declaration as to solicitations filed pursuant to Rule 62 of the Public Utility Holding Company Act.";
  static readonly forms = ["U-R-1"] as const;
}
