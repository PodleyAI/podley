// /*
//  *    *******************************************************************************
//  *    *   Podley.AI: Embedding Large Language Model Experiential Retrieval Service    *
//  *    *   OpenAI Provider Implementation                                            *
//  *    *                                                                             *
//  *    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//  *    *******************************************************************************
//  */

// import type {
//   DownloadModelTaskInput,
//   TextGenerationTaskInput,
//   TextGenerationTaskOutput,
//   AiJob,
// } from "@podley/ai";

// export async function OpenAI_DownloadRun(
//   job: AiJob,
//   runInputData: DownloadModelTaskInput,
//   signal?: AbortSignal
// ) {
//   if (!process.env.OPENAI_API_KEY) {
//     throw new Error(
//       "Missing OpenAI API Key: ensure OPENAI_API_KEY is set in environment variables"
//     );
//   }
//   job.updateProgress(100, "OpenAI provider ready");
//   return {
//     model: runInputData.model,
//     dimensions: 0,
//     normalize: false,
//   };
// }

// export async function OpenAI_TextGenerationRun(
//   job: AiJob,
//   runInputData: TextGenerationTaskInput,
//   signal?: AbortSignal
// ): Promise<TextGenerationTaskOutput> {
//   const prompt = runInputData.prompt;
//   const max_tokens = (runInputData as any).max_tokens ?? 100;
//   const temperature = (runInputData as any).temperature ?? 0.7;
//   job.updateProgress(10, "Starting OpenAI text generation");
//   const response = await fetch("https://api.openai.com/v1/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: runInputData.model,
//       prompt,
//       max_tokens,
//       temperature,
//     }),
//   });
//   const data = await response.json();
//   job.updateProgress(100, "Completed OpenAI text generation");
//   return {
//     text: data.choices?.[0]?.text?.trim() || "",
//   };
// }
