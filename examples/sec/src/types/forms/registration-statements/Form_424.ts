//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_424 extends Form {
  static readonly name = "Prospectus (424)";
  static readonly description =
    "Contains substantive changes from or additions to a prospectus previously filed with the SEC as part of the registration statement.";
  static readonly forms = ["424A", "424B1", "424B2", "424B3", "424B4", "424B5", "424B7"] as const;
}
