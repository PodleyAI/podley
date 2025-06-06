//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

// Node.js environment
import { createHash } from "node:crypto";
import { serialize } from "../utilities/Misc";

export async function sha256(data: string) {
  return createHash("sha256").update(data).digest("hex");
}

export async function makeFingerprint(input: any): Promise<string> {
  const serializedObj = serialize(input);
  const hash = await sha256(serializedObj);
  return hash;
}

export function uuid4() {
  return crypto.randomUUID();
}
