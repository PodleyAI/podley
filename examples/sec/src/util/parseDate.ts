//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { FormatRegistry, Static, Type } from "@sinclair/typebox";

/**
 * Parses a date string into a year, month, and day.
 *
 * @param dateStr - The date string to parse.
 * @returns The parsed date, separated into year, month, and day.
 */
export function parseDate(dateStr: string): { year: number; month: string; day: string } {
  const regexes = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // yyyy-MM-dd
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/dd/yyyy
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // dd-MM-yyyy
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // yyyy/MM/dd
    /^(\d{4})(\d{1,2})(\d{1,2})$/, // yyyyMMdd
  ];

  for (const regex of regexes) {
    const match = dateStr.match(regex);
    if (match) {
      let year: number, month: number, day: number;

      if (regex === regexes[0] || regex === regexes[3]) {
        // yyyy-MM-dd or yyyy/MM/dd
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
      } else {
        // MM/dd/yyyy or dd-MM-yyyy
        year = parseInt(match[3], 10);
        month = parseInt(match[1], 10);
        day = parseInt(match[2], 10);
      }

      return {
        year,
        month: month.toString().padStart(2, "0"),
        day: day.toString().padStart(2, "0"),
      };
    }
  }

  throw new Error("Invalid date format");
}

/**
 * Converts a date to a SEC date format.
 *
 * @param date - The date to convert.
 * @returns The SEC date format YYYY-MM-DD
 */
export function secDate(date: Date): string;
export function secDate(date: string): string;
export function secDate(date: Date | string): string {
  if (date instanceof Date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  }
  const { year, month, day } = parseDate(date);
  return `${year}-${month}-${day}`;
}

// export const TypeDateTime = (annotations: Record<string, unknown> = {}) =>
//   Type.String({ format: "sec-date-time", ...annotations });

FormatRegistry.Set("sec-date", (value: string): boolean => {
  return /^(\d{4})-(\d{2})-(\d{2})$/.test(value);
});
export const TypeSecDate = (annotations: Record<string, unknown> = {}) =>
  Type.String({ format: "sec-date", ...annotations });

export const TypeOptionalSecDate = (annotations: Record<string, unknown> = {}) =>
  Type.Optional(TypeSecDate({ default: "", ...annotations }));

export type YYYYdMMdDD = Static<ReturnType<typeof TypeSecDate>>;
export type OptionalFullDateString = YYYYdMMdDD | "";
