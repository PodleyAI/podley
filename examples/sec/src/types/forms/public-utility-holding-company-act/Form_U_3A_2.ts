//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_3A_2 extends Form {
  static readonly name = "Holding Company Exemption Statement";
  static readonly description =
    "Statement by holding company claiming exemption from provisions of the act pursuant to Rule 2.";
  static readonly forms = ["U-3A-2", "U-3A-2/A"] as const;
}
