//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10_12G extends Form {
  static readonly name = "General Form for Registration of Securities";
  static readonly description =
    "General form for registration of securities pursuant to Section 12(g) of the Securities Exchange Act of 1934";
  static readonly forms = ["10-12G", "10-12G/A"] as const;
}
