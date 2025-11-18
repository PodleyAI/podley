/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

// Browser environment

export async function compress(
  input: string | Uint8Array,
  algorithm: "gzip" | "br" = "gzip"
): Promise<Uint8Array> {
  const sourceBlob = new Blob([typeof input === "string" ? input : new Uint8Array(input)]);
  const compressedStream = sourceBlob
    .stream()
    .pipeThrough(new CompressionStream(algorithm as CompressionFormat));
  const compressedBuffer = await new Response(compressedStream).arrayBuffer();
  return new Uint8Array(compressedBuffer);
}

export async function decompress(
  input: Uint8Array,
  algorithm: "gzip" | "br" = "gzip"
): Promise<string> {
  const sourceBlob = new Blob([new Uint8Array(input)]);
  const decompressedStream = sourceBlob
    .stream()
    .pipeThrough(new DecompressionStream(algorithm as CompressionFormat));
  return await new Response(decompressedStream).text();
}
