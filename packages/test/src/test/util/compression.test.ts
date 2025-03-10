//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it } from "bun:test";
import { compress, decompress } from "@ellmers/util";

describe("Compression", () => {
  it("should compress and decompress a JSON object", async () => {
    const sampleObject = {
      name: "Alice",
      age: 30,
      hobbies: ["reading", "gaming", "hiking"],
      active: true,
    };
    const jsonString = JSON.stringify(sampleObject);
    const compressedData = await compress(jsonString, "br");
    const decompressedString = await decompress(compressedData, "br");
    const decompressedObject = JSON.parse(decompressedString);
    expect(JSON.stringify(sampleObject)).toBe(JSON.stringify(decompressedObject));
  });
});
