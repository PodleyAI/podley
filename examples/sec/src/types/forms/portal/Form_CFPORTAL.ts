//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CFPORTAL extends Form {
  static readonly name = "Crowdfunding Portal Registration";
  static readonly description = "Initial registration for crowdfunding portals.";
  static readonly forms = ["CFPORTAL", "CFPORTAL/A"] as const;
}
