//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

export class SQLiteWasmDB {
  private db: any;
  private stmtCache: Map<string, any> = new Map();

  private constructor(db: any) {
    this.db = db;
  }

  static async open(filename = ":memory:") {
    const sqlite3 = await sqlite3InitModule();
    const db = new sqlite3.oo1.DB(filename);
    return new SQLiteWasmDB(db);
  }

  prepare(query: string) {
    if (this.stmtCache.has(query)) {
      return new StatementWrapper(this.stmtCache.get(query));
    }

    const stmt = this.db.prepare(query);
    this.stmtCache.set(query, stmt);
    return new StatementWrapper(stmt);
  }

  run(query: string, ...params: any[]) {
    const stmt = this.prepare(query);
    stmt.run(...params);
    stmt.finalize();
  }

  get(query: string, ...params: any[]) {
    const stmt = this.prepare(query);
    const row = stmt.get(...params);
    stmt.finalize();
    return row;
  }

  all(query: string, ...params: any[]) {
    const stmt = this.prepare(query);
    const rows = stmt.all(...params);
    stmt.finalize();
    return rows;
  }

  close() {
    this.db.close();
  }
}

class StatementWrapper {
  private stmt: any;

  constructor(stmt: any) {
    this.stmt = stmt;
  }

  run(...params: any[]) {
    this.stmt.bind(params).step();
  }

  get(...params: any[]) {
    this.stmt.bind(params);
    return this.stmt.step() ? this.stmt.get() : null;
  }

  all(...params: any[]) {
    this.stmt.bind(params);
    const rows = [];
    while (this.stmt.step()) {
      rows.push(this.stmt.get());
    }
    return rows;
  }

  finalize() {
    this.stmt.finalize();
  }
}
