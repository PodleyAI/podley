//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U5A extends Form {
  static readonly name = "Registration Notification";
  static readonly description =
    "Notification of registration filed under section 5(a) of the Public Utility Holding Company Act.";
  static readonly forms = ["U5A"] as const;
}
