//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

// Type utilities for array transformations
// Makes specified properties optional arrays
export type ConvertSomeToOptionalArray<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? Array<T[P]> | T[P] : T[P];
};

// Makes all properties optional arrays
export type ConvertAllToOptionalArray<T> = {
  [P in keyof T]: Array<T[P]> | T[P];
};

// Makes specified properties required arrays
export type ConvertSomeToArray<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? Array<T[P]> : T[P];
};

// Makes all properties required arrays
export type ConvertAllToArrays<T> = {
  [P in keyof T]: Array<T[P]>;
};

// Removes readonly modifiers from object properties
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
