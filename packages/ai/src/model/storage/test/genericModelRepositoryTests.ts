//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { getGlobalModelRepository } from "../../ModelRegistry";
import { ModelRepository } from "../../ModelRepository";
import { setGlobalModelRepository } from "../../ModelRegistry";

const ONNX_TRANSFORMERJS = "ONNX_TRANSFORMERJS";

export const runGenericModelRepositoryTests = (
  createRepository: () => Promise<ModelRepository>
) => {
  let repository: ModelRepository;

  beforeEach(async () => {
    repository = await createRepository();
    setGlobalModelRepository(repository);
  });

  afterEach(async () => {
    await repository.clear();
  });

  it("store and find model by name", async () => {
    await getGlobalModelRepository().addModel({
      name: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      url: "Xenova/LaMini-Flan-T5-783M",
      availableOnBrowser: true,
      availableOnServer: true,
      provider: ONNX_TRANSFORMERJS,
      pipeline: "text2text-generation",
    });

    const model = await getGlobalModelRepository().findByName("onnx:Xenova/LaMini-Flan-T5-783M:q8");
    expect(model).toBeDefined();
    expect(model?.name).toEqual("onnx:Xenova/LaMini-Flan-T5-783M:q8");

    const nonExistentModel = await getGlobalModelRepository().findByName("onnx:Xenova/no-exist");
    expect(nonExistentModel).toBeUndefined();
  });

  it("store and find tasks by model", async () => {
    await getGlobalModelRepository().addModel({
      name: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      url: "Xenova/LaMini-Flan-T5-783M",
      availableOnBrowser: true,
      availableOnServer: true,
      provider: ONNX_TRANSFORMERJS,
      pipeline: "text2text-generation",
    });
    await getGlobalModelRepository().connectTaskToModel(
      "TextGenerationTask",
      "onnx:Xenova/LaMini-Flan-T5-783M:q8"
    );
    await getGlobalModelRepository().connectTaskToModel(
      "TextRewriterTask",
      "onnx:Xenova/LaMini-Flan-T5-783M:q8"
    );
    const tasks = await getGlobalModelRepository().findTasksByModel(
      "onnx:Xenova/LaMini-Flan-T5-783M:q8"
    );
    expect(tasks).toBeDefined();
    expect(tasks?.length).toEqual(2);
  });
  it("store and find model by task", async () => {
    const repo = getGlobalModelRepository();

    // Add the model and wait for it to complete
    await repo.addModel({
      name: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      url: "Xenova/LaMini-Flan-T5-783M",
      availableOnBrowser: true,
      availableOnServer: true,
      provider: ONNX_TRANSFORMERJS,
      pipeline: "text2text-generation",
    });

    // Connect task to model and wait for it to complete
    await repo.connectTaskToModel("TextGenerationTask", "onnx:Xenova/LaMini-Flan-T5-783M:q8");
    await repo.connectTaskToModel("TextRewriterTask", "onnx:Xenova/LaMini-Flan-T5-783M:q8");

    // Search for models by task
    const models = await repo.findModelsByTask("TextGenerationTask");
    expect(models).toBeDefined();
    expect(models?.length).toEqual(1);
    expect(models?.[0].name).toEqual("onnx:Xenova/LaMini-Flan-T5-783M:q8");
    expect(models?.[0].provider).toEqual(ONNX_TRANSFORMERJS);
    expect(models?.[0].pipeline).toEqual("text2text-generation");
  });
};
