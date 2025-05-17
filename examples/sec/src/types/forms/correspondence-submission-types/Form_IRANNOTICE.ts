//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_IRANNOTICE extends Form {
  static readonly name = "Internal Review and Annotation Notice";
  static readonly description = "Internal review and annotation notice.";
  static readonly forms = ["IRANNOTICE"] as const;
}
