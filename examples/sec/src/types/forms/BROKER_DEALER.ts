//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const BROKER_DEALER = [
  ["17HACON", "Confidential broker-dealer annual 17-H report."],
  ["17HACON/A", "Amendment to a previously filed 17HACON."],
  ["17HQCON", "Confidential broker-dealer quarterly 17-H report."],
  ["17HQCON/A", "Amendment to a previously filed 17HQCON."],
  ["X-17A-5", "Annual FOCUS report filed by broker-dealers under Rule 17a-5."],
  ["X-17A-5/A", "Amendment to a previously filed X-17A-5."],
  ["FOCUSN", "Normalized FOCUS report filed by broker-dealers."],
  ["FOCUSN/A", "Amendment to a previously filed FOCUSN."],
] as const;
export const BROKER_DEALER_FORM_NAMES = BROKER_DEALER.map(([name]) => name);
export type BrokerDealerForm = (typeof BROKER_DEALER_FORM_NAMES)[number];
