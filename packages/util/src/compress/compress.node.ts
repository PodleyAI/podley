//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
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
  const compressAsyncTyped = compressAsync as unknown as (
    source: Buffer | Uint8Array | DataView
  ) => Promise<Buffer>;
  const sourceBuffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const result: Buffer = await compressAsyncTyped(sourceBuffer);
  // Create a Uint8Array view over the Buffer without copying
  return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
}

export async function decompress(
  input: Uint8Array,
  algorithm: "gzip" | "br" = "gzip"
): Promise<string> {
  const decompressFn = algorithm === "br" ? zlib.brotliDecompress : zlib.gunzip;
  const decompressAsync = promisify(decompressFn);
  const decompressAsyncTyped = decompressAsync as unknown as (
    source: Buffer | Uint8Array | DataView
  ) => Promise<Buffer>;
  const sourceBuffer = Buffer.isBuffer(input) ? (input as unknown as Buffer) : Buffer.from(input);
  const resultBuffer: Buffer = await decompressAsyncTyped(sourceBuffer);
  return resultBuffer.toString();
}
