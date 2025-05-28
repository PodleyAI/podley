//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

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
