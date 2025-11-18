/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Document, DocumentMetadata } from "./Document";
import { DocumentConverter } from "./DocumentConverter";

export class DocumentConverterText extends DocumentConverter {
  constructor(
    metadata: DocumentMetadata,
    public text: string
  ) {
    super(metadata);
  }
  public convert(): Document {
    return new Document(this.text, this.metadata);
  }
}
