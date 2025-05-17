//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_2DPOS extends Form {
  static readonly name = "F-2DPOS";
  static readonly description = "Post-effective amendment to F-2D registration statement";
  static readonly forms = ["F-2DPOS"] as const;
}
