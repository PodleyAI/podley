//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/* OFFICIAL descriptions at https://www.sec.gov/info/edgar/forms/edgform.pdf */

export const PROXIES_INFORMATION_STATEMENTS = [
  [
    "PRE 14A",
    "A preliminary proxy statement providing official notification to designated classes of shareholders of matters to be brought to a vote at a shareholders meeting.",
  ],
  ["PREC14A", "Preliminary proxy statement containing contested solicitations."],
  ["PREC14C", "Preliminary information statement containing contested solicitations."],
  ["PREN14A", "Non-management preliminary proxy statements not involving contested solicitations."],
  ["PREM14A", "A preliminary proxy statement relating to a merger or acquisition."],
  ["PREM14C", "A preliminary information statement relating to a merger or acquisition."],
  ["PRES14A", "A preliminary proxy statement giving notice regarding a special meeting."],
  ["PRES14C", "A preliminary information statement relating to a special meeting."],
  ["PRE 14C", "A preliminary proxy statement containing all other information."],
  ["DEF 14C", "Definitive information statement containing all other information."],
  ["PRER14A", "Proxy soliciting materials. Revised preliminary material."],
  ["PRER14C", "Information statements. Revised preliminary material."],
  ["PRE13E3", "Initial statement - preliminary form."],
  ["PRE13E3/A", "Amendment to a previously filed PRE13E3."],
  [
    "PRRN14A",
    "Non-management revised preliminary proxy soliciting materials for both contested solicitations and other situations. Revised preliminary material.",
  ],
  ["PX14A6G", "Notice of exempt solicitation. Definitive material."],
  [
    "DEF 14A",
    'Provides official notification to designated classes of shareholders of matters to be brought to a vote at a shareholders meeting. This form is commonly referred to as a "Proxy".',
  ],
  [
    "DEFM14A",
    "Provides official notification to designated classes of shareholders of matters relating to a merger or acquisition.",
  ],
  ["DEFM14C", "A definitive information statement relating to a merger or an acquisition."],
  ["DEFC14C", "Definitive information statement (all other types)."],
  ["DEFS14A", "A definitive proxy statement giving notice regarding a special meeting."],
  ["DEFS14C", "A definitive information statement regarding a special meeting."],
  ["DEFC14A", "Definitive proxy statement in connection with contested solicitations."],
  ["DEFC14C", "Definitive information statement indicating contested solicitations."],
  ["DEFA14A", "Additional proxy soliciting materials - definitive."],
  [
    "DEFN14A",
    "Definitive proxy statement filed by non-management not in connection with contested solicitations.",
  ],
  ["DFRN14A", "Revised definitive proxy statement filed by non-management."],
  ["DFAN14A", "Additional proxy soliciting materials filed by non-management."],
  ["DEF13E3", "Schedule filed as definitive materials."],
  ["DEF13E3/A", "Amendment to a previously filed DEF 13E3."],
  ["DEFA14C", "Additional information statement materials - definitive."],
  ["DEFR14C", "Revised information statement materials - definitive."],
  ["DEFR14A", "Revised proxy soliciting materials - definitive."],
] as const;

export const PROXY_FORMS = PROXIES_INFORMATION_STATEMENTS.map(([name]) => name);

export type ProxyForm = (typeof PROXY_FORMS)[number];
