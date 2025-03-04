export * from "./utilities/Misc";
export * from "./utilities/EventEmitter";
export * from "./utilities/Crypto.node";
export * from "./utilities/TypeUtilities";
export * from "./di";
import bettersqlite from "better-sqlite3";

export const Sqlite: { Database: typeof bettersqlite } = {
  Database: bettersqlite,
};
