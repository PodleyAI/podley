//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

// Bun environment

import { serialize } from "../utilities/Misc";

export async function sha256(data: string) {
  return new Bun.CryptoHasher("sha256").update(data).digest("hex");
}

export async function makeFingerprint(input: any): Promise<string> {
  const serializedObj = serialize(input);
  const hash = await sha256(serializedObj);
  return hash;
}

export function uuid4() {
  return crypto.randomUUID();
}
