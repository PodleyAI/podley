//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_144 extends Form {
  static readonly name = "Notice of Proposed Sale of Securities";
  static readonly description =
    'This form must be filed by "insiders" prior to their intended sale of restricted stock. A Form 144 is NOT an EDGAR electronic filing; each 144 is filed by the seller in paper during the day at the SEC.';
  static readonly forms = ["144", "144/A"] as const;
}
