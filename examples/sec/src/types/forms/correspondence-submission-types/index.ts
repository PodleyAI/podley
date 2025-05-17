//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_CORRESP } from "./Form_CORRESP";
import { Form_IRANNOTICE } from "./Form_IRANNOTICE";
import { Form_NO_ACT } from "./Form_NO_ACT";
import { Form_SEC_STAFF_ACTION } from "./Form_SEC_STAFF_ACTION";
import { Form_SEC_STAFF_LETTER } from "./Form_SEC_STAFF_LETTER";
import { Form_EFFECT } from "./Form_EFFECT";
import { Form_UPLOAD } from "./Form_UPLOAD";
import { Form_CT_ORDER } from "./Form_CT_ORDER";

export const CORRESPONDENCE_SUBMISSION_TYPE_FORM_NAMES = [
  ...Form_CORRESP.forms,
  ...Form_IRANNOTICE.forms,
  ...Form_NO_ACT.forms,
  ...Form_SEC_STAFF_ACTION.forms,
  ...Form_SEC_STAFF_LETTER.forms,
  ...Form_EFFECT.forms,
  ...Form_UPLOAD.forms,
  ...Form_CT_ORDER.forms,
] as const;

export type CorrespondenceSubmissionTypeForm =
  (typeof CORRESPONDENCE_SUBMISSION_TYPE_FORM_NAMES)[number];
