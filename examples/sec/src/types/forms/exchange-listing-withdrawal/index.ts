//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form_25 } from "./Form_25";
import { Form_25NSE } from "./Form_25NSE";

export const EXCHANGE_LISTING_WITHDRAWAL_FORM_NAMES = [
  ...Form_25.forms,
  ...Form_25NSE.forms,
] as const;

export type ExchangeListingWithdrawalForm = (typeof EXCHANGE_LISTING_WITHDRAWAL_FORM_NAMES)[number];
