export type TheNadas =
  | ''
  | 'N/A'
  | '(N/A)'
  | 'N//A'
  | 'N?A'
  | 'N.A'
  | 'N.A.'
  | 'N/AQ'
  | 'NONE'
  | '(NONE)'
  | '[NONE]'
  | '-'
  | '--'
  | '---'
  | '----'
  | '-----'
  | '------'
  | '"-"'
  | '.'
  | '..'
  | '...';

export type TheConfused =
  | ','
  | '"'
  | "'"
  | 'ETC'
  | 'SAME'
  | '("ETC")'
  | '(SAME)'
  | '[SAME]'
  | 'See Comments';

export type TheEntities =
  | 'CORP'
  | 'CORP.'
  | 'INC'
  | 'INC.'
  | 'LLC'
  | 'L.L.C.'
  | 'LTD'
  | 'LTD.'
  | 'PTE LTD'
  | 'GP'
  | 'LP'
  | '(GP)'
  | '(LP)'
  | '("GP")'
  | '("LP")'
  | 'Sponsor'
  | '(Sponsor)';

export type BadName = TheNadas | TheConfused | TheEntities;
