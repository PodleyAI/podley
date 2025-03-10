//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

// Node environment

import zlib from "zlib";
import { promisify } from "util";

export async function compress(
  input: string | Buffer,
  algorithm: "gzip" | "br" = "gzip"
): Promise<Uint8Array> {
  const compressFn = algorithm === "br" ? zlib.brotliCompress : zlib.gzip;
  const compressAsync = promisify(compressFn);
  return compressAsync(Buffer.isBuffer(input) ? input : Buffer.from(input));
}

export async function decompress(
  input: Uint8Array,
  algorithm: "gzip" | "br" = "gzip"
): Promise<string> {
  const decompressFn = algorithm === "br" ? zlib.brotliDecompress : zlib.gunzip;
  const decompressAsync = promisify(decompressFn);
  const result = await decompressAsync(Buffer.from(input));
  return result.toString();
}
