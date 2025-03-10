//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

export * from "./graph";
export * from "./utilities/Misc";
export * from "./events/EventEmitter";
export * from "./crypto/Crypto.node";
export * from "./utilities/TypeUtilities";
export * from "./di";
import bettersqlite from "better-sqlite3";

export const Sqlite: { Database: typeof bettersqlite } = {
  Database: bettersqlite,
};
