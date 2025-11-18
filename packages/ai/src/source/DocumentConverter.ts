/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

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
