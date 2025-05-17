//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFR14C extends Form {
  static readonly name = "Definitive Additional Information Statement";
  static readonly description =
    "Definitive additional information statement filed pursuant to Section 14(c) of the Securities Exchange Act of 1934";
  static readonly forms = ["DEFR14C"] as const;
}
