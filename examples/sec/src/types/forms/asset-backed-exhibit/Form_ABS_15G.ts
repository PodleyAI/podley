//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_ABS_15G extends Form {
  static readonly name = "Asset-Backed Securities Report (Section 15G)";
  static readonly description = "Asset-backed securities report pursuant to Section 15G.";
  static readonly forms = ["ABS-15G", "ABS-15G/A"] as const;
}
