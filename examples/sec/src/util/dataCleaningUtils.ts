import { AddressParser } from "@sroussey/parse-address";
import { getRegionCodeForCountryCode, parsePhoneNumber } from "awesome-phonenumber";
import { StateSolicitationCodeEnum } from "../types/edgar/state-country";
import { Address } from "../types/edgar/company-submissions";

const intlPhoneCodes1 = [1, 7];

const intlPhoneCodes2 = [
  20, 27, 30, 31, 32, 33, 34, 36, 39, 40, 41, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56,
  57, 58, 60, 61, 62, 63, 64, 65, 66, 81, 82, 84, 86, 90, 91, 92, 93, 94, 95, 98,
];

const intlPhoneCodes3 = [
  211, 212, 213, 216, 218, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233,
  234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 248, 249, 250, 251, 252, 253,
  254, 255, 256, 257, 258, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 290, 291, 297, 298,
  299, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 370, 371, 372, 373, 374, 375, 376, 377,
  378, 380, 381, 382, 383, 385, 386, 387, 389, 420, 421, 423, 500, 501, 502, 503, 504, 505, 506,
  507, 508, 509, 590, 591, 592, 593, 595, 597, 598, 599, 670, 672, 673, 674, 675, 676, 677, 678,
  679, 680, 681, 682, 683, 685, 686, 687, 688, 689, 690, 691, 692, 850, 852, 853, 855, 856, 880,
  886, 960, 961, 962, 963, 964, 965, 966, 967, 968, 970, 971, 972, 973, 974, 975, 976, 977, 992,
  993, 994, 995, 996, 998,
];

const intlPhoneCodes = intlPhoneCodes1.concat(intlPhoneCodes2).concat(intlPhoneCodes3);

export function cleanPhoneNumber(phone_raw: string): [string | null, string | null] {
  if (!phone_raw) return [null, null];
  phone_raw = String(phone_raw || "").trim();
  if (!phone_raw) return [null, null];
  if (phone_raw == "(000) 000-0000") return [null, null];

  let phoneParsed = parsePhoneNumber(phone_raw);

  if (phoneParsed.valid) {
    return [phoneParsed.regionCode, phoneParsed.number.e164];
  }

  let country_code = "999";
  let phone_number = "";
  let strip_phone = phone_raw.replaceAll(/[\,\+\*\(\)\ \-\.\\\/]/g, "");
  const hasExtension = /(?<phone>\d+)([xX]|EXT|ext)\.?(?<ext>\d+)?$/.exec(strip_phone);
  if (hasExtension?.groups) {
    strip_phone = hasExtension.groups.phone;
  }
  const numbers_only = phone_raw.replaceAll(/\D/g, "");
  if (numbers_only === "") return [null, null];
  if (/^(0+|1+|2+|3+|4+|5+|6+|7+|8+|9+)$/.exec(numbers_only)) return [null, null]; // all the same number

  if (strip_phone.length === 10 && strip_phone[0] !== "0" && strip_phone[0] !== "1") {
    // sounds like an American number
    country_code = "1";
    phone_number = strip_phone;
  } else if (
    strip_phone.length === 11 &&
    strip_phone[0] === "1" &&
    strip_phone[1] !== "0" &&
    strip_phone[1] !== "1"
  ) {
    // sounds like an American number pre-fixed with 1-
    country_code = "1";
    phone_number = strip_phone.slice(1);
  } else {
    // OK, try international with easy to spot format
    const markedAsIntl =
      /^[+]?(?:[\(\-\[\ \.]?[+]?(?:011|00|000|0000|01|0|001|0110|01101|010|010\-1|011\-0|01100)[\)\-\ \\\]\.]?(?<restofphone>.*)$)/.exec(
        phone_raw
      );
    if (markedAsIntl?.groups) {
      const intl_phone_raw = markedAsIntl.groups.restofphone;
      const ittl_phone_strip = intl_phone_raw.replaceAll(/[\(\)\ \-\.\\\/]/g, "");
      if (intlPhoneCodes1.includes(parseInt(ittl_phone_strip.slice(0, 1)))) {
        country_code = ittl_phone_strip.slice(0, 1);
        phone_number = ittl_phone_strip;
      } else if (intlPhoneCodes2.includes(parseInt(ittl_phone_strip.slice(0, 2)))) {
        country_code = ittl_phone_strip.slice(0, 2);
        phone_number = ittl_phone_strip;
      } else if (intlPhoneCodes3.includes(parseInt(ittl_phone_strip.slice(0, 3)))) {
        country_code = ittl_phone_strip.slice(0, 3);
        phone_number = ittl_phone_strip;
      }
    } else {
      // OK, try international with no prefix
      const ittl_phone_strip = numbers_only.replaceAll(/[\+\(\)\ \-\.\\\/]/g, "");
      if (intlPhoneCodes1.includes(parseInt(ittl_phone_strip.slice(0, 1)))) {
        country_code = ittl_phone_strip.slice(0, 1);
        phone_number = ittl_phone_strip;
      } else if (intlPhoneCodes2.includes(parseInt(ittl_phone_strip.slice(0, 2)))) {
        country_code = ittl_phone_strip.slice(0, 2);
        phone_number = ittl_phone_strip;
      } else if (intlPhoneCodes3.includes(parseInt(ittl_phone_strip.slice(0, 3)))) {
        country_code = ittl_phone_strip.slice(0, 3);
        phone_number = ittl_phone_strip;
      }
    }

    if (!phone_number) phone_number = numbers_only;
  }

  phoneParsed = parsePhoneNumber("+" + country_code + phone_number);

  if (phoneParsed.valid) {
    return [phoneParsed.regionCode, phoneParsed.number.e164];
  }

  // if (country_code === 999) console.log({phone_raw,strip_phone,numbers_only, country_code,phone_number,dummy:'',dummy2:''})
  const region = getRegionCodeForCountryCode(parseInt(country_code));
  return [region, String(phone_number)];
}

export function cleanEin(ein: string): string | null {
  if (ein === "000000000") return null;
  return ein;
}

const parser = new AddressParser();
const careOf = /(C\/O.*)$/i;
const zip9 = /([0-9]{5})-[0-9]{4}/;
const companyRegExp = new RegExp("^[^0-9]*" + getCompanyEndings() + "$", "gi");

export function cleanAddress(address: Address | null): {
  hash: string | null;
  address: Address | null;
} {
  if (!address) return { hash: null, address: null };
  const cleanerAddress = Object.fromEntries<string | null>(
    Object.entries(address).map(([i, v]) => {
      if (typeof v === "string") v = v.trim();
      if (v == null) v = null;
      if (typeof v !== "string" && v !== null) v = String(v);
      return [i, v];
    })
  ) as unknown as Address;
  if (address.stateOrCountry == null && address.city == null) return { hash: null, address: null };

  if (cleanerAddress.street1)
    cleanerAddress.street1 =
      String(cleanerAddress.street1).replace(careOf, "").replace(companyRegExp, "") || null;
  if (cleanerAddress.street2)
    cleanerAddress.street2 =
      String(cleanerAddress.street2).replace(careOf, "").replace(companyRegExp, "") || null;
  if (cleanerAddress.street1 == null && cleanerAddress.street2 != null) {
    cleanerAddress.street1 = cleanerAddress.street2;
    cleanerAddress.street2 = null;
  }
  if (cleanerAddress.zipCode)
    cleanerAddress.zipCode = zip9.exec(cleanerAddress.zipCode)?.[1] || cleanerAddress.zipCode;

  if (
    cleanerAddress.stateOrCountry &&
    Object.keys(StateSolicitationCodeEnum).includes(cleanerAddress.stateOrCountry)
  ) {
    const parts = parser.parseStreet([cleanerAddress.street1, cleanerAddress.street2].join(","));
    if (parts) {
      const { number, prefix, street, type, suffix, sec_unit_type, sec_unit_num } = parts;
      cleanerAddress.street1 =
        [number, prefix, street, type, suffix]
          .filter((s) => !!s)
          .map((s) => String(s).trim())
          .join(" ") || null;
      cleanerAddress.street2 =
        [sec_unit_type, sec_unit_num]
          .filter((s) => !!s)
          .map((s) => String(s).trim())
          .join(" ") || null;
    }
  }

  const { stateOrCountryDescription, ...smallerAddress } = cleanerAddress;
  const hashable = Object.values(smallerAddress).join("|").toLowerCase();

  if (hashable == "||||") return { hash: null, address: null };
  return { hash: hashable, address: cleanerAddress };
}

export function getCompanyEndings() {
  return "(?<companyending>limited|corporation|development|company|co\\.?|corp\\.?|inc\\.?|(pte,?.? )?ltd\\.?|l[\\., ]{0,2}l[\\., ]{0,2}c\\.?|l\\.?l\\.?p\\.?|l[\\., ]{0,2}p[\\., ]{0,2}|g[\\., ]{0,2}p[\\., ]{0,2}|S[\\., ]{0,2}A[\\., ]{0,2}R[\\., ]{0,2}L[\\., ]{0,2})";
}
const companyEndingsAnywhereRegExp = new RegExp("\\b" + getCompanyEndings() + "\\b", "i");
const companyEndingsRegExp = new RegExp("\\b" + getCompanyEndings() + "$", "i");
const companyEndingsOnlyRegExp = new RegExp("^" + getCompanyEndings + "$", "i");

export function stripCompanyEnding(name: string) {
  if (!hasCompanyEnding(name)) return name;
  name = name.replace(companyEndingsRegExp, "").trim();
  if ([".", ","].includes(name[name.length - 1])) name = name.slice(0, name.length - 1);
  return name;
}

export function hasCompanyEnding(name: string) {
  return companyEndingsRegExp.test(name || "");
}

export function isCompanyEnding(name: string) {
  return companyEndingsOnlyRegExp.test(name || "");
}

export function hasCompanyAnywhere(name: string) {
  return companyEndingsAnywhereRegExp.test(name || "");
}

export interface Person {
  complete_name: string;
  full_name: string;
  first: string | null;
  middle: string | null;
  nickname: string | null;
  last: string | null;
  suffix: string | null;
  prefix: string | null;
  generation: string | null;
  slug: string | null;
}

const prefixRegExp =
  /^(?<prefix>(Ret\.?\s)?(Ambassador|Senator|Admiral|General|President|Congressman|Congresswoman|Professor|Dato’?)(\s\(?Ret\.?\))?|((Sir|Prof|Dr|Mr|Mrs|H\.?R\.?H)\.?\s+)?)/iu;

const suffixRegExp =
  /(?<suffix>([,\s]+(MBA|CPA|ACA|CFA|FRM|Ph\.?D\.?|M\.?D\.?|J\.?D\.?|CPA\/J.?D.?|CAIA|Esq\.?))+)/iu;

const generationRegExp = /(?<generation>,?\s(Junior|Senior|Jr\.?|Sr\.?|I{1,3}|IV|V|VI{1,3})\s*)$/iu;

const nameRegExp =
  /^(?<first>\p{L}\.?\s|\p{L}\.\s?|\p{L}\.?\p{L}\.?\s|[-\p{L}]+\s)(?<nickname>[\(“"][\p{L}\s\.\-]+[\)”"]\s)?(?<middle>((?!(binti|bin|de la|de los|van der|van den|von|di|del|la|le|dela|der|vander|de|el|della)\s)\p{L}+\.?,?\s)*)?(?<last>(?:(binti|bin|de la|de los|van der|van den|von|di|del|la|le|dela|der|vander|de|el|della) )?[-' ’\p{L}]+)$/iu;

const wrongOrdernameRegExp = /^(?<last>[-\p{L}]+), (?<rest>.+)$/iu;

function cleanNamePart(name: string): string {
  name = name.replaceAll(/[\(\)“'"”]/g, "").trim();
  if (name === name.toUpperCase()) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  } else {
    return name;
  }
}

export function cleanName(name: string): Person {
  name = name.trim();
  const prefix = prefixRegExp.exec(name)?.groups?.prefix?.trim() || null;
  if (prefix) {
    name = name.replace(prefixRegExp, "").trim();
  }
  let suffix = suffixRegExp.exec(name)?.groups?.suffix || null;
  if (suffix) {
    name = name.replace(suffixRegExp, "").trim();
    suffix = suffix.replaceAll(/[, ]/g, "");
  }
  const full_name = name;

  let generation = generationRegExp.exec(name)?.groups?.generation || null;
  if (generation) {
    name = name.replace(generationRegExp, "");
    generation = generation.replaceAll(/[, ]/g, "");
  }
  let { last: wronglast, rest } = wrongOrdernameRegExp.exec(name)?.groups || {};
  if (wronglast) {
    name = rest + " " + wronglast;
    name = name.trim();
  }

  let { first, middle, nickname, last } = nameRegExp.exec(name)?.groups || {};
  if (first) first = cleanNamePart(first);
  if (middle) middle = cleanNamePart(middle);
  if (nickname) nickname = cleanNamePart(nickname);
  if (last) last = cleanNamePart(last);

  let complete_name = "";
  if (prefix) complete_name += prefix + " ";
  if (first) complete_name += first + " ";
  if (middle) complete_name += middle + " ";
  if (nickname) complete_name += nickname + " ";
  if (last) complete_name += last;
  if (generation) complete_name += " " + generation;
  if (suffix) complete_name += " " + suffix;

  let slug_name = "";
  if (first) slug_name += first + " ";
  if (middle) slug_name += middle + " ";
  if (nickname) slug_name += nickname + " ";
  if (last) slug_name += last;
  if (generation) slug_name += " " + generation;

  const slug = (slug_name || name)
    .replaceAll(/\. /g, "-")
    .replaceAll(/[\,\(\)\.]/g, "")
    .replaceAll(/-&-/g, "-")
    .replaceAll(/[’&  ']/g, "-")
    .replaceAll(/\//g, "-")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  // console.log({ name, slug_name, slug });

  return {
    prefix,
    suffix,
    first,
    last,
    middle,
    nickname,
    generation,
    full_name,
    complete_name,
    slug,
  };
}

const companyPrefixnameRegExp =
  /^(?<prefix>(\(?Managing Partner|Managing Member|Partner|General Partner\)?)\s+(of the Issuer|of Issuer|of (the )?General Partner)?)\b/i;
const companyPostfixnameRegExp =
  /\b(?<postfix>(\(?Managing Partner|Managing Member|Partner|General Partner\)?)(\s+(of the Issuer|of Issuer|of (the )?General Partner))?)$/i;

export function cleanCompanyName(name: string): Person {
  name = name.trim();
  const prefix = companyPrefixnameRegExp.exec(name)?.groups?.prefix || null;
  if (prefix) {
    name = name.replace(companyPrefixnameRegExp, "").trim();
  }
  const postfix = companyPostfixnameRegExp.exec(name)?.groups?.postfix || null;
  if (postfix) {
    name = name.replace(companyPostfixnameRegExp, "").trim();
  }

  const full_name = name;
  const complete_name = name;
  const slug = name
    .replaceAll(/\. /g, "-")
    .replaceAll(/[\,\(\)\.]/g, "")
    .replaceAll(/-&-/g, "-")
    .replaceAll(/[’&  ]/g, "-")
    .replaceAll(/\//g, "-")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return {
    prefix: null,
    suffix: null,
    first: null,
    last: null,
    middle: null,
    nickname: null,
    generation: null,
    full_name,
    complete_name,
    slug,
  };
}
