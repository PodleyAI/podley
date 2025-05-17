//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_12_IA extends Form {
  static readonly name = "Employee Statement";
  static readonly description =
    "Statement pursuant to section 12(i) of the Act by person employed or retained by a registered holding company or subsidiary thereof.";
  static readonly forms = ["U-12-IA", "U-12-IA/A"] as const;
}
