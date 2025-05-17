//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEL_AM extends Form {
  static readonly name = "Delayed Amendment";
  static readonly description =
    "Delayed amendment to a previously filed registration statement or report";
  static readonly forms = ["DEL AM"] as const;
}
