//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEF13E3 extends Form {
  static readonly name = "Definitive Schedule 13E-3";
  static readonly description = "Schedule filed as definitive materials.";
  static readonly forms = ["DEF13E3", "DEF13E3/A"] as const;
}
