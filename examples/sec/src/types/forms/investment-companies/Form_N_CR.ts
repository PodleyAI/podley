//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_CR extends Form {
  static readonly name = "Form N-CR";
  static readonly description = "Current Report of Money Market Fund Material Events.";
  static readonly forms = ["N-CR", "N-CR/A"] as const;
}
