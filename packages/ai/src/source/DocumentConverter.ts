//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Document, DocumentMetadata } from "./Document";

/**
 * Abstract class for converting different types of content into a Document.
 */
export abstract class DocumentConverter {
  public metadata: DocumentMetadata;
  constructor(metadata: DocumentMetadata) {
    this.metadata = metadata;
  }
  public abstract convert(): Document;
}
