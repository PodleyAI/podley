//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_S_3D extends Form {
  static readonly name = "Registration Statement (S-3D)";
  static readonly description =
    "Registration statement of securities pursuant to dividend or interest reinvestment plans which become effective automatically upon filing.";
  static readonly forms = ["S-3D", "S-3D/A", "S-3DPOS"] as const;
}
