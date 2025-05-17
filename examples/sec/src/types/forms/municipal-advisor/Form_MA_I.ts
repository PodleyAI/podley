//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_MA_I extends Form {
  static readonly name = "Municipal Advisor Information";
  static readonly description =
    "Information regarding natural persons who engage in municipal advisory activities.";
  static readonly forms = ["MA-I", "MA-I/A"] as const;
}
