//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_9 extends Form {
  static readonly name = "Multijurisdictional Disclosure System (MJDS) registration statement";
  static readonly description =
    "Multijurisdictional Disclosure System (MJDS) registration statement.";
  static readonly forms = ["F-9", "F-9/A", "F-9 POS"] as const;
}
