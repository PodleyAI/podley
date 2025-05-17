//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SEC_STAFF_ACTION extends Form {
  static readonly name = "SEC Staff Action Notification";
  static readonly description = "Notification of SEC staff action.";
  static readonly forms = ["SEC STAFF ACTION"] as const;
}
