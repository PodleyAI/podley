//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_CFPORTAL } from "./Form_CFPORTAL";
import { Form_CFPORTAL_W } from "./Form_CFPORTAL_W";

export const PORTAL_FORM_NAMES = [...Form_CFPORTAL.forms, ...Form_CFPORTAL_W.forms] as const;

export type PortalForm = (typeof PORTAL_FORM_NAMES)[number];
