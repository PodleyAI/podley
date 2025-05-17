//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_S_2 extends Form {
  static readonly name = "Registration Statement (S-2)";
  static readonly description =
    "This filing is an optional registration form that may be used by companies which have reported under the '34 Act for a minimum of three years and have timely filed all required reports during the 12 calendar months and any portion of the month immediately preceding the filing of the registration statement.";
  static readonly forms = ["S-2", "S-2/A", "S-2MEF"] as const;
}
