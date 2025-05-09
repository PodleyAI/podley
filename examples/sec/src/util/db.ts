//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Sqlite } from "@ellmers/sqlite";
import { globalServiceRegistry } from "@ellmers/util";
import { mkdirSync } from "fs";
import path from "path";
import { SEC_DB_FOLDER, SEC_DB_NAME } from "./tokens";

let db: Sqlite.Database | null = null;

function getDb() {
  if (!db) {
    const location = path.join(
      globalServiceRegistry.get(SEC_DB_FOLDER),
      `${globalServiceRegistry.get(SEC_DB_NAME)}.sqlite`
    );
    db = new Sqlite.Database(location, {
      readwrite: true,
    });
    query_run("PRAGMA synchronous = 0");
    query_run("PRAGMA cache_size = 1000000");
    query_run("PRAGMA locking_mode = EXCLUSIVE");
    query_run("PRAGMA temp_store = MEMORY");
    query_run("PRAGMA journal_mode = OFF");
  }
  return db;
}

export function createDb() {
  const dir = globalServiceRegistry.get(SEC_DB_FOLDER);
  try {
    mkdirSync(dir, { recursive: true });
  } catch (err) {}
  const location = path.join(
    globalServiceRegistry.get(SEC_DB_FOLDER),
    `${globalServiceRegistry.get(SEC_DB_NAME)}.sqlite`
  );
  db = new Sqlite.Database(location, {
    readwrite: true,
    create: true,
  });

  query_run(
    `CREATE TABLE IF NOT EXISTS cik_last_update (
      cik unsigned int not null,
      last_update date not null,
      primary key (cik)
    )`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS processed_facts (
      cik unsigned int not null,
      last_processed date null,
      primary key (cik)
    )`
  );
  query_run(
    `CREATE INDEX IF NOT EXISTS processed_facts_last_processed ON processed_facts(last_processed)`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS processed_submissions (
      cik unsigned int not null,
      last_processed date null,
      primary key (cik)
    )`
  );
  query_run(
    `CREATE INDEX IF NOT EXISTS processed_submissions_last_processed ON processed_submissions(last_processed)`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS processed_filings (
      cik unsigned int not null,
      accession_number char(20) not null,
      form char(8),
      last_processed date,
      primary key (cik, accession_number)
    )`
  );
  query_run(
    `CREATE INDEX IF NOT EXISTS processed_filings_last_processed ON processed_filings(last_processed, form)`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS filings (
      cik unsigned int not null,
      accession_number char(20) not null,
      filing_date date not null,
      report_date date,
      acceptance_date datetime not null,
      form char(8),
      file_number varchar(10),
      film_number varchar(10),
      primary_doc char(45) not null,
      primary_doc_description char(45),
      size int,
      is_xbrl bool,
      is_inline_xbrl bool,
      items text,
      act char(2),
      primary key (cik, accession_number)
    )`
  );
  query_run(`CREATE INDEX IF NOT EXISTS filings_file_number ON filings(cik,file_number,form)`);
  query_run(`CREATE INDEX IF NOT EXISTS filings_global_form ON filings(form,cik)`);

  query_run(
    `CREATE TABLE IF NOT EXISTS cik_name (
      name char(140) COLLATE NOCASE not null,
      cik unsigned int not null,
      primary key(name,cik)
    )`
  );
  query_run(`CREATE INDEX IF NOT EXISTS cik_name_cik ON cik_name(cik)`);

  query_run(
    `CREATE TABLE IF NOT EXISTS entities(
      cik unsigned int not null,
      name text,
      type string,
      sic unsigned smallint,
      ein char(10),
      description text,
      website text,
      investor_website text,
      category text,
      fiscal_year char(4),
      state_incorporation char(2),
      state_incorporation_desc text,
      primary key (cik)
    )`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS entity_tickers (
      cik unsigned int not null,
      ticker char(8),
      exchange char(20),
      primary key (cik, ticker, exchange)
    ) without rowid`
  );
  query_run(`CREATE INDEX IF NOT EXISTS entity_tickers_ticker ON entity_tickers(ticker)`);

  query_run(
    `CREATE TABLE IF NOT EXISTS phones (
      phone_raw text primary key,
      country_code char(2) not null,
      phone_number varchar(20) not null
    ) without rowid`
  );
  query_run(`CREATE INDEX IF NOT EXISTS phones_to_cik ON phones(country_code, phone_number)`);

  query_run(
    `CREATE TABLE IF NOT EXISTS phones_entities_junction (
      relation_name char(50) not null,
      cik unsigned int not null,
      country_code char(2) not null,
      phone_number varchar(20) not null,
      primary key (cik, relation_name, country_code, phone_number)
    ) without rowid`
  );
  query_run(
    `CREATE INDEX IF NOT EXISTS phones_entities_junction_phone ON phones_entities_junction(country_code, phone_number)`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS sic (
      sic unsigned smallint primary key,
      description text
    ) without rowid`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS addresses (
      address_hash_id text not null primary key,
      street1 text,
      street2 text,
      city text,
      state_or_country char(2),
      state_or_country_desc text,
      zip text
    )`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS addresses_entity_junction (
      relation_name char(50) not null,
      cik unsigned int not null,
      address_hash_id text not null,
      primary key (cik, relation_name, address_hash_id)
    )`
  );
  query_run(
    `CREATE INDEX IF NOT EXISTS addresses_entity_junction_discovery ON addresses_entity_junction(address_hash_id)`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS investment_offering (
      cik unsigned int not null,
      file_number varchar(10) not null,
      industry_group varchar(25) not null,
      industry_subgroup varchar(25) null,
      date_of_first_sale date null,
      exemptions json null,
      is_debt_type bool null,
      is_equity_type bool null,
      is_mineral_property_type bool null,
      is_option_to_aquire_type bool null,
      is_pooled_investment_type bool null,
      is_security_to_be_aquired bool null,
      is_tenant_in_common bool null,
      is_business_combination_type bool null,
      is_other_type bool null,
      description_of_other text null,
      primary key (cik,file_number)
    )`
  );
  query_run(
    `CREATE INDEX IF NOT EXISTS investment_offering_industry_group ON investment_offering(industry_group,industry_subgroup)`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS investment_offering_history (
      cik unsigned int not null,
      file_number varchar(10) not null,
      accession_number varchar(10) not null,
      minimum_investment_accepted number null,
      total_offering_amount int null,
      total_amount_sold int null,
      total_remaining int null,
      investor_count int null,
      non_accredited_count int null,
      primary key(cik,file_number, accession_number)  
    )`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS issuers (
      cik unsigned int not null,
      issuer_cik unsigned int not null,
      is_primary bool,
      primary key(cik,issuer_cik)
    )`
  );
  query_run(`CREATE INDEX IF NOT EXISTS issuers_entities ON issuers(issuer_cik,cik)`);

  query_run(
    `CREATE TABLE IF NOT EXISTS crowdfunding (
      cik unsigned int not null,
      file_number varchar(10) not null,
      filing_date date not null,
      name varchar(140) not null,
      legal_status varchar(50) not null,
      state_jurisdiction varchar(2) not null,
      date_incorporation date not null,
      url varchar(255) not null,
      portal_cik unsigned int not null,
      status char(20) not null,
      primary key (cik,file_number)
    )`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS crowdfunding_offerings (
      cik unsigned int not null,
      file_number varchar(10) not null,
      filing_date date not null,
      compensation_amount_percent decimal(5,4),
      financial_interest_percent decimal(5,4),
      compensation_amount_detail text,
      financial_interest_detail text,
      security_offered_type text,
      no_of_security_offered unsigned int,
      price decimal(7,2),
      price_determination_method text,
      offering_amount decimal(7,2),
      maximum_offering_amount decimal(7,2),
      over_subscription_accepted char(3),
      deadline_date date,
      primary key (cik,file_number,filing_date)
    )`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS crowdfunding_reports (
      cik unsigned int not null,
      file_number varchar(10) not null,
      filing_date date not null,
      disclosure_name char(50),
      disclosure_value decimal(14,2),
      primary key (cik,file_number,filing_date,disclosure_name)
    )`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS spacs (
      cik unsigned int not null primary key,
      name text,
      status text,
      focus text,
      target_name text,
      target_desc text,
      s1_date date,
      s1_url text,
      ipo_date date,
      ipo_url text,
      unit_split_date date,
      loi_date date,
      da_date date,
      da_url text,
      investorpres_date date,
      vote_date date,
      completion_date date,
      completion_url text,
      failure_date date,
      failure_url text,
      ipo_size_value int,
      description text,
      leadership json,
      ticker text,
      ticker_exchange text,
      registration_type char(5)
    )`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS company_facts (
      cik unsigned int not null,
      grouping char(8),
      name text,
      filed_date char(10),
      form char(10),
      val_unit char(12),
      frame text,
      accession_number char(20) not null,
      start_date text,
      end_date text,
      val number,
      fy unsigned int,
      fp char(2)
    )`
  );

  query_run(
    `CREATE UNIQUE INDEX IF NOT EXISTS facts ON company_facts(cik,grouping,name,accession_number,frame,val_unit,fy,fp,val)`
  );
  query_run(`CREATE INDEX IF NOT EXISTS company_facts_name ON company_facts(cik,name)`);

  query_run(
    `CREATE TABLE IF NOT EXISTS portals (
      cik unsigned int primary key,
      name text,
      brand text,
      url text,
      live bool
    )`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS persons (
      slug text COLLATE NOCASE primary key,
      complete_name text COLLATE NOCASE not null,
      full_name text COLLATE NOCASE not null,
      is_natural_person bool not null,
      first text COLLATE NOCASE,
      middle text COLLATE NOCASE,
      last text COLLATE NOCASE,
      prefix text COLLATE NOCASE,
      suffix text COLLATE NOCASE,
      generation text COLLATE NOCASE,
      nickname text COLLATE NOCASE,
      crd unsigned int,
      cik unsigned int
    )`
  );
  query_run(`CREATE INDEX IF NOT EXISTS persons_name ON persons(last, first)`);
  query_run(`CREATE INDEX IF NOT EXISTS persons_cik ON persons(cik)`);
  query_run(`CREATE INDEX IF NOT EXISTS persons_crd ON persons(crd)`);

  query_run(
    `CREATE TABLE IF NOT EXISTS persons_entities_junction (
      relation_name char(50) not null,
      cik unsigned int not null,
      slug text COLLATE NOCASE not null,
      relationship json,
      primary key (cik, relation_name, slug)
    )`
  );
  query_run(
    `CREATE INDEX IF NOT EXISTS persons_entities_junction_discovery ON persons_entities_junction(slug)`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS persons_addresses_junction (
      relation_name char(50) not null,
      address_hash_id text not null,
      slug text COLLATE NOCASE not null,
      primary key (slug, relation_name, address_hash_id)
    )`
  );
  query_run(
    `CREATE INDEX IF NOT EXISTS persons_addresses_junction_discovery ON persons_addresses_junction(address_hash_id)`
  );

  query_run(
    `CREATE TABLE IF NOT EXISTS persons_phones_junction (
      relation_name char(50) not null,
      country_code char(2) not null,
      phone_number varchar(20) not null,
      slug text COLLATE NOCASE not null,
      primary key (slug, relation_name, country_code, phone_number)
    )`
  );
  query_run(
    `CREATE INDEX IF NOT EXISTS persons_phones_junction_discovery ON persons_phones_junction(country_code, phone_number)`
  );

  // query_run(
  //   `CREATE TABLE IF NOT EXISTS connections (
  //     cik unsigned int not null,
  //     reason text COLLATE NOCASE,
  //     person_slug text COLLATE NOCASE,
  //     address_hash_id text COLLATE NOCASE ,
  //     phone text COLLATE NOCASE,
  //     relationship json,
  //   )`
  // );

  db.close();
}

let cache = new Map();
export function query<ReturnType, ParamsType extends Sqlite.SQLQueryBindings>(
  sql: string,
  prepare = true
) {
  const db = getDb();
  let stmt: Sqlite.Statement<ReturnType, ParamsType[]> | undefined = undefined;
  if (prepare) {
    if (cache.has(sql)) {
      stmt = cache.get(sql);
    } else {
      stmt = db.prepare<ReturnType, ParamsType>(sql);
      cache.set(sql, stmt);
    }
  } else {
    stmt = db.query<ReturnType, ParamsType>(sql);
  }
  return stmt;
}

interface Exists {
  _exists: boolean;
}

export function query_get<ReturnType = any>(
  sql: string,
  params?: Sqlite.SQLQueryBindings,
  prepare = true
): (ReturnType & Exists) | Exists {
  let res;
  try {
    res = query<ReturnType, Sqlite.SQLQueryBindings>(sql, prepare)?.get(
      params ? params : null
    ) as ReturnType;
  } catch (err) {
    if (err == "Error: database is locked") {
      Bun.sleepSync(2000);
      res = query<ReturnType, Sqlite.SQLQueryBindings>(sql, prepare)?.get(
        params ? params : null
      ) as ReturnType;
    } else throw new Error(`${err} in ${sql} \n with ${JSON.stringify(params)}`);
  }
  if (res) return { ...res, _exists: true };
  return { _exists: false };
}

export function query_all<ReturnType = any>(
  sql: string,
  params?: Sqlite.SQLQueryBindings,
  prepare = true
): ReturnType[] {
  let ret;
  try {
    ret = query<ReturnType, Sqlite.SQLQueryBindings>(sql, prepare)?.all(
      params ? params : null
    ) as ReturnType[];
  } catch (err) {
    if (err == "Error: database is locked") {
      Bun.sleepSync(2000);
      ret = query<ReturnType, Sqlite.SQLQueryBindings>(sql, prepare)?.all(
        params ? params : null
      ) as ReturnType[];
    } else throw new Error(`${err} in ${sql} \n with ${JSON.stringify(params)}`);
  }
  return ret || [];
}

export function query_run<ReturnType = any>(
  sql: string,
  params?: Sqlite.SQLQueryBindings | Sqlite.SQLQueryBindings[],
  prepare = true
) {
  function tryRun(params?: Sqlite.SQLQueryBindings | Sqlite.SQLQueryBindings[]) {
    const prep = query<ReturnType, Sqlite.SQLQueryBindings>(sql, prepare);
    if (Array.isArray(params)) {
      const db = getDb();
      const insertMany = db.transaction((rows: Sqlite.SQLQueryBindings[]) => {
        for (const row of rows) {
          prep?.run(row);
        }
      });
      insertMany(params);
    } else {
      return prep?.run(params ? params : null);
    }
  }
  try {
    return tryRun(params);
  } catch (err) {
    if (err == "Error: database is locked") {
      Bun.sleepSync(2000);
      return tryRun(params);
    } else throw new Error(`${err} in ${sql} \n with ${JSON.stringify(params)}`);
  }
}
