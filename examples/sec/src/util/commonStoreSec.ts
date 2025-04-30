import { Address, Submission } from "../types/edgar/company-submissions";
import { FilingMetaData } from "../types/FilingMetaData";
import {
  cleanAddress,
  cleanCompanyName,
  cleanEin,
  cleanName,
  cleanPhoneNumber,
} from "./dataCleaningUtils";
import { query_run } from "./db";

export function todayYYYYdMMdDD() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function processCikName(cik: number, name: string) {
  query_run(
    `INSERT INTO cik_name(cik,name)
      VALUES($cik,$name)
      ON CONFLICT DO NOTHING`,
    {
      $cik: cik,
      $name: name,
    }
  );
}

export function processSubmissionSic(sic: string, sicDescription: string) {
  query_run(
    `INSERT INTO sic(sic,description)
      VALUES($sic,$description)
      ON CONFLICT DO NOTHING`,
    {
      $sic: sic,
      $description: sicDescription,
    }
  );
}

export function processSubmissionEntity(submission: Omit<Submission, "filings" | "files">) {
  query_run(
    `INSERT OR REPLACE INTO entities(cik,name,type,sic,ein,description,website,investor_website,category,fiscal_year,state_incorporation,state_incorporation_desc)
      VALUES($cik,$name,$type,$sic,$ein,$description,$website,$investor_website,$category,$fiscal_year,$state_incorporation,$state_incorporation_desc)`,
    {
      $cik: parseInt(submission.cik),
      $name: submission.name,
      $type: submission.entityType,
      $sic: submission.sic || null,
      $ein: cleanEin(submission.ein || ""),
      $description: submission.description || null,
      $website: submission.website || null,
      $investor_website: submission.investorWebsite || null,
      $category: submission.category || null,
      $fiscal_year: submission.fiscalYearEnd || null,
      $state_incorporation: submission.stateOfIncorporation || null,
      $state_incorporation_desc: submission.stateOfIncorporationDescription || null,
    }
  );
}

export function processSubmissionFilings(cik: number, filing: FilingMetaData) {
  query_run(
    `INSERT OR REPLACE INTO filings(cik,accession_number,filing_date,report_date,acceptance_date,form,file_number,film_number,primary_doc,primary_doc_description,size,is_xbrl,is_inline_xbrl,items,act) 
        VALUES ($cik,$accession_number,$filing_date,$report_date,$acceptance_date,$form,$file_number,$film_number,$primary_doc,$primary_doc_description,$size,$is_xbrl,$is_inline_xbrl,$items,$act)`,
    {
      $cik: cik,
      $accession_number: filing.accessionNumber,
      $filing_date: filing.filingDate,
      $report_date: filing.reportDate,
      $acceptance_date: filing.acceptanceDateTime,
      $form: filing.form,
      $file_number: filing.fileNumber,
      $film_number: filing.filmNumber,
      $primary_doc: filing.primaryDocument,
      $primary_doc_description: filing.primaryDocDescription,
      $size: filing.size,
      $is_xbrl: filing.isXBRL === "1",
      $is_inline_xbrl: filing.isInlineXBRL === "1",
      $items: filing.items,
      $act: filing.act,
    }
  );
}

export function processUpdateProcessing(cik: number) {
  query_run(
    `INSERT OR REPLACE INTO processed_submissions(cik,last_processed)
      VALUES($cik,$last_processed)`,
    {
      $cik: cik,
      $last_processed: todayYYYYdMMdDD(),
    }
  );
}

export function processSubmissionTickers(cik: number, ticker: string, exchange: string) {
  query_run(
    `INSERT OR REPLACE INTO entity_tickers(cik,ticker,exchange)
        VALUES($cik,$ticker,$exchange)
        ON CONFLICT DO NOTHING`,
    {
      $cik: cik,
      $ticker: ticker,
      $exchange: exchange || "",
    }
  );
}

export function insertPhone(phone_raw: string, relation_name: string, cik: number) {
  const [country_code, phone_number] = cleanPhoneNumber(phone_raw);
  if (country_code && phone_number) {
    query_run(
      `INSERT INTO phones(country_code,phone_number,phone_raw)
        VALUES($country_code,$phone_number,$phone_raw)
        ON CONFLICT DO NOTHING`,
      {
        $country_code: country_code,
        $phone_number: phone_number,
        $phone_raw: phone_raw,
      }
    );
    query_run(
      `INSERT INTO phones_entities_junction(relation_name,cik,country_code,phone_number)
        VALUES($relation_name,$cik,$country_code,$phone_number)
        ON CONFLICT DO NOTHING`,
      {
        $relation_name: relation_name,
        $cik: cik,
        $country_code: country_code,
        $phone_number: phone_number,
      }
    );
  }
  return [country_code, phone_number];
}

export function insertSimpleAddress(
  address_raw: Omit<Address, "stateOrCountryDescription">,
  relation_name: string,
  cik: number
) {
  return insertAddress({ stateOrCountryDescription: null, ...address_raw }, relation_name, cik);
}

export function insertAddress(address_raw: Address, relation_name: string, cik: number) {
  // Edgar style addresses
  const { hash, address } = cleanAddress(address_raw);
  if (hash && address) {
    const { street1, street2, city, stateOrCountry, stateOrCountryDescription, zipCode } = address;
    query_run(
      `INSERT INTO addresses(address_hash_id,street1,street2,city,state_or_country,state_or_country_desc,zip)
        VALUES($address_hash_id,$street1,$street2,$city,$state_or_country,$state_or_country_desc,$zip)
        ON CONFLICT DO NOTHING`,
      {
        $address_hash_id: hash,
        $street1: street1,
        $street2: street2,
        $city: city,
        $state_or_country: stateOrCountry,
        $state_or_country_desc: stateOrCountryDescription || null,
        $zip: zipCode,
      }
    );
    query_run(
      `INSERT INTO addresses_entity_junction(address_hash_id,relation_name,cik)
        VALUES($address_hash_id,$relation_name,$cik)
        ON CONFLICT DO NOTHING`,
      {
        $address_hash_id: hash,
        $relation_name: relation_name,
        $cik: cik,
      }
    );
  }
  return hash;
}

export function insertPerson(
  person_raw: string,
  is_natural_person: boolean,
  person_cik: number | null,
  person_crd: string | null,
  relation_name: string,
  relation_cik: number,
  relationship: string[] | null
) {
  person_raw = person_raw.replace(/ ?\*$/g, ""); // remove any trailing asterisk
  const {
    full_name,
    complete_name,
    first,
    middle,
    nickname,
    last,
    prefix,
    suffix,
    generation,
    slug,
  } = is_natural_person ? cleanName(person_raw) : cleanCompanyName(person_raw);

  if (full_name) {
    query_run(
      `INSERT OR REPLACE INTO persons(full_name, complete_name, is_natural_person, first, middle, nickname, last, prefix, suffix, generation, slug, crd, cik)
        VALUES($full_name, $complete_name, $is_natural_person, $first, $middle, $nickname, $last, $prefix, $suffix, $generation, $slug, $crd, $cik)`,
      {
        $complete_name: complete_name,
        $full_name: full_name,
        $is_natural_person: is_natural_person,
        $first: first,
        $middle: middle,
        $nickname: nickname,
        $last: last,
        $prefix: prefix,
        $suffix: suffix,
        $generation: generation,
        $slug: slug,
        $crd: person_crd,
        $cik: person_cik,
      }
    );

    query_run(
      `INSERT OR REPLACE INTO persons_entities_junction(slug,relation_name,cik,relationship)
        VALUES($slug,$relation_name,$cik,$relationship)`,
      {
        $slug: slug,
        $relation_name: relation_name,
        $cik: relation_cik,
        $relationship: relationship ? JSON.stringify(relationship) : null,
      }
    );
  }
  return slug;
}

export function insertPersonFull(
  person_raw: string,
  is_natural_person: boolean,
  person_cik: number | null,
  person_crd: string | null,
  relation_name: string,
  relation_cik: number,
  relationship: string[] | null,
  address_raw: Address | null,
  phone_raw: string | null
) {
  let address_hash_id, country_code, phone_number;
  const slug = insertPerson(
    person_raw,
    is_natural_person,
    person_cik,
    person_crd,
    relation_name,
    relation_cik,
    relationship
  );
  if (address_raw) address_hash_id = insertAddress(address_raw, relation_name, relation_cik);
  if (phone_raw) [country_code, phone_number] = insertPhone(phone_raw, relation_name, relation_cik);
  if (slug && address_hash_id) {
    query_run(
      `INSERT INTO persons_addresses_junction(slug,relation_name,address_hash_id)
      VALUES($slug,$relation_name,$address_hash_id)
      ON CONFLICT DO NOTHING`,
      {
        $slug: slug,
        $relation_name: relation_name,
        $address_hash_id: address_hash_id,
      }
    );
  }
  if (slug && country_code && phone_number) {
    query_run(
      `INSERT INTO persons_phones_junction(slug,country_code,phone_number)
      VALUES($slug,$country_code,$phone_number)
      ON CONFLICT DO NOTHING`,
      {
        $slug: slug,
        $relation_name: relation_name,
        $country_code: country_code,
        $phone_number: phone_number,
      }
    );
  }
}
