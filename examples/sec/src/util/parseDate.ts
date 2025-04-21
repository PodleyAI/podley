//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

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
