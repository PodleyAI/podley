//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFA14A extends Form {
  static readonly name = "Additional Proxy Soliciting Materials";
  static readonly description = "Additional proxy soliciting materials - definitive.";
  static readonly forms = ["DEFA14A"] as const;
}
