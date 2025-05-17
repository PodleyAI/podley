//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CFPORTAL_W extends Form {
  static readonly name = "Crowdfunding Portal Withdrawal";
  static readonly description = "Withdrawal of crowdfunding portal registration.";
  static readonly forms = ["CFPORTAL-W"] as const;
}
