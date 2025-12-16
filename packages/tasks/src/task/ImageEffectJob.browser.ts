/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IJobExecuteContext, Job, PermanentJobError } from "@workglow/job-queue";
import { JobQueueTaskConfig } from "@workglow/task-graph";
import type { ImageEffectTaskInput, ImageEffectTaskOutput } from "./ImageEffectTask";

/**
 * Browser implementation of ImageEffectJob using glfx.js
 */
export class ImageEffectJob<
  Input extends ImageEffectTaskInput = ImageEffectTaskInput,
  Output = ImageEffectTaskOutput,
> extends Job<Input, Output> {
  constructor(config: JobQueueTaskConfig & { input: Input } = { input: {} as Input }) {
    super(config);
  }
  static readonly type: string = "ImageEffectJob";

  /**
   * Applies image effects using glfx.js
   */
  async execute(input: Input, context: IJobExecuteContext): Promise<Output> {
    // Check for abort signal
    if (context.signal?.aborted) {
      throw new PermanentJobError("Job was aborted");
    }

    // Validate that we're in a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new PermanentJobError(
        "ImageEffectTask requires a browser environment with WebGL support"
      );
    }

    try {
      // Dynamically import glfx (browser-only)
      const fx = await import("glfx");

      // Create a WebGL canvas
      const canvas = fx.canvas();

      // Load the image
      const img = await this.loadImage(input.image!);

      // Create texture from image
      const texture = canvas.texture(img);

      // Draw the texture to canvas
      canvas.draw(texture);

      // Apply effects in sequence
      const effects = input.effects ?? [];
      for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];

        // Check for abort between effects
        if (context.signal?.aborted) {
          throw new PermanentJobError("Job was aborted");
        }

        this.applyEffect(canvas, effect);

        // Update progress
        await context.updateProgress(((i + 1) / effects.length) * 100);
      }

      // Update the canvas to apply all effects
      canvas.update();

      // Get the output format and quality
      const outputFormat = input.outputFormat ?? "image/png";
      const quality = input.quality ?? 0.95;

      // Convert canvas to base64
      const dataUrl = canvas.toDataURL(outputFormat, quality);

      // Clean up
      texture.destroy();

      return { image: dataUrl } as Output;
    } catch (error) {
      if (error instanceof Error) {
        throw new PermanentJobError(`Failed to process image: ${error.message}`);
      }
      throw new PermanentJobError("Failed to process image with unknown error");
    }
  }

  /**
   * Loads an image from a URL or base64 data URL
   */
  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));

      img.src = src;
    });
  }

  /**
   * Applies a single effect to the canvas
   */
  private applyEffect(canvas: any, effect: any): void {
    switch (effect.effect) {
      case "brightnessContrast":
        canvas.brightnessContrast(effect.brightness, effect.contrast);
        break;
      case "hueSaturation":
        canvas.hueSaturation(effect.hue, effect.saturation);
        break;
      case "sepia":
        canvas.sepia(effect.amount);
        break;
      case "vibrance":
        canvas.vibrance(effect.amount);
        break;
      case "denoise":
        canvas.denoise(effect.exponent);
        break;
      case "unsharpMask":
        canvas.unsharpMask(effect.radius, effect.strength);
        break;
      case "vignette":
        canvas.vignette(effect.size, effect.amount);
        break;
      case "lensBlur":
        canvas.lensBlur(effect.radius, effect.brightness, effect.angle);
        break;
      case "triangleBlur":
        canvas.triangleBlur(effect.radius);
        break;
      case "zoomBlur":
        canvas.zoomBlur(effect.centerX, effect.centerY, effect.strength);
        break;
      default:
        throw new Error(`Unknown effect: ${(effect as any).effect}`);
    }
  }
}
