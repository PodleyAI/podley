//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_3DPOS extends Form {
  static readonly name = "F-3DPOS";
  static readonly description = "Post-effective amendment to F-3D registration statement";
  static readonly forms = ["F-3DPOS"] as const;
}
