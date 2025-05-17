//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NT_20F extends Form {
  static readonly name = "Late Submission Notification for 20-F";
  static readonly description = "Notification that form 20-F will be submitted late.";
  static readonly forms = ["NT 20-F", "NT 20-F/A", "NTN 20-F", "NTN 20-F/A"] as const;
}
