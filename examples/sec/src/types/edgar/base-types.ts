type oneToFour = 1 | 2 | 3 | 4;
type oneToNine = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type zeroToNine = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type YYYY =
  | `19${zeroToNine}${zeroToNine}`
  | `20${zeroToNine}${zeroToNine}`;
export type MM = `0${oneToNine}` | `1${0 | 1 | 2}`;
export type DD = `0${oneToNine}` | `1${zeroToNine}` | `2${zeroToNine}` | `3${0 | 1}`;
export type YYYYdMMdDD = string;
export type OptionalFullDateString = YYYYdMMdDD | '';
export type SecBoolean = '0' | '1';
export type Frame = string;
