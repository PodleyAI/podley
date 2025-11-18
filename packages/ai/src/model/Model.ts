/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

export type ModelPrimaryKey = {
  name: string;
};

export type ModelDetail = {
  url: string;
  provider: string;
  availableOnBrowser: boolean;
  availableOnServer: boolean;
  quantization?: string;
  pipeline?: string;
  normalize?: boolean;
  nativeDimensions?: number;
  usingDimensions?: number;
  contextWindow?: number;
  numParameters?: number;
  languageStyle?: string;
  device?: string;
  use_external_data_format?: boolean;
};

export type Model = ModelPrimaryKey & ModelDetail;
