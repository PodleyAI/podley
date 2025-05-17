//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_33_S extends Form {
  static readonly name = "Foreign Utility Companies Annual Report";
  static readonly description =
    "Annual report concerning Foreign Utility Companies pursuant to section 33(e) of the Public Utility Holding Company Act.";
  static readonly forms = ["U-33-S"] as const;
}
