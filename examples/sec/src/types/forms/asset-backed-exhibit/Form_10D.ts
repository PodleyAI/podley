//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10D extends Form {
  static readonly name = "Periodic Distribution Report (Asset-Backed)";
  static readonly description =
    "Periodic distribution reports by asset-backed issuers pursuant to Rule 13a-17 or 15d-17.";
  static readonly forms = ["10-D", "10-D/A", "NT 10-D", "NT 10-D/A"] as const;
}
