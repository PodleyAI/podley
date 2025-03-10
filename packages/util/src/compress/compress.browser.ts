//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

// Browser environment

export async function compress(
  input: string | Buffer,
  algorithm: "gzip" | "br" = "br"
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const stream = new CompressionStream(algorithm as CompressionFormat);
  const writer = stream.writable.getWriter();
  writer.write(typeof input === "string" ? encoder.encode(input) : input);
  writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  let totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  let result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

export async function decompress(
  input: Uint8Array,
  algorithm: "gzip" | "br" = "br"
): Promise<string> {
  const stream = new DecompressionStream(algorithm as CompressionFormat);
  const writer = stream.writable.getWriter();
  writer.write(input);
  writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  let totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  let result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  // Decode the final Uint8Array into a string
  const decoder = new TextDecoder();
  return decoder.decode(result);
}
