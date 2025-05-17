//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DOSLTR extends Form {
  static readonly name = "Confidential Draft Offering Statement Letter";
  static readonly description = "Confidential draft offering statement letter";
  static readonly forms = ["DOSLTR"] as const;
}
