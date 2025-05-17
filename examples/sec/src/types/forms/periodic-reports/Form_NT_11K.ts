//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NT_11K extends Form {
  static readonly name = "Late Submission Notification for 11-K";
  static readonly description = "Notification that form 11-K will be submitted late.";
  static readonly forms = ["NT 11-K", "NT 11-K/A"] as const;
}
