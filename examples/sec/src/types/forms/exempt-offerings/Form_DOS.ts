//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DOS extends Form {
  static readonly name = "Confidential Draft Offering Statement";
  static readonly description = "Confidential draft offering statement";
  static readonly forms = ["DOS", "DOS/A"] as const;
}
