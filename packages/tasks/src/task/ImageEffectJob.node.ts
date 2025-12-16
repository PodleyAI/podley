/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IJobExecuteContext, Job, PermanentJobError } from "@workglow/job-queue";
import { JobQueueTaskConfig } from "@workglow/task-graph";
import sharp from "sharp";
import type { ImageEffectTaskInput, ImageEffectTaskOutput } from "./ImageEffectTask";

/**
 * Node.js implementation of ImageEffectJob using Sharp
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
   * Applies image effects using Sharp
   */
  async execute(input: Input, context: IJobExecuteContext): Promise<Output> {
    // Check for abort signal
    if (context.signal?.aborted) {
      throw new PermanentJobError("Job was aborted");
    }

    try {
      // Load the image
      let image = await this.loadImage(input.image!);

      // Apply effects in sequence
      const effects = input.effects ?? [];
      for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];

        // Check for abort between effects
        if (context.signal?.aborted) {
          throw new PermanentJobError("Job was aborted");
        }

        image = await this.applyEffect(image, effect);

        // Update progress
        await context.updateProgress(((i + 1) / effects.length) * 100);
      }

      // Get the output format and quality
      const outputFormat = input.outputFormat ?? "image/png";
      const quality = Math.round((input.quality ?? 0.95) * 100);

      // Convert to the desired format
      let outputImage = image;
      if (outputFormat === "image/jpeg") {
        outputImage = image.jpeg({ quality });
      } else if (outputFormat === "image/webp") {
        outputImage = image.webp({ quality });
      } else {
        outputImage = image.png();
      }

      // Convert to base64 data URL
      const buffer = await outputImage.toBuffer();
      const base64 = buffer.toString("base64");
      const mimeType = outputFormat;
      const dataUrl = `data:${mimeType};base64,${base64}`;

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
  private async loadImage(src: string): Promise<sharp.Sharp> {
    try {
      if (src.startsWith("data:")) {
        // Parse data URL
        const matches = src.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error("Invalid data URL format");
        }
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        return sharp(buffer);
      } else if (src.startsWith("http://") || src.startsWith("https://")) {
        // Fetch remote image
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        return sharp(Buffer.from(buffer));
      } else {
        // Assume it's a file path
        return sharp(src);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load image: ${error.message}`);
      }
      throw new Error("Failed to load image with unknown error");
    }
  }

  /**
   * Applies a single effect to the image using Sharp
   * Note: Not all effects from glfx are supported in Sharp
   */
  private async applyEffect(image: sharp.Sharp, effect: any): Promise<sharp.Sharp> {
    switch (effect.effect) {
      case "brightnessContrast":
        return this.applyBrightnessContrast(image, effect.brightness, effect.contrast);

      case "hueSaturation":
        return this.applyHueSaturation(image, effect.hue, effect.saturation);

      case "sepia":
        return this.applySepia(image, effect.amount);

      case "vibrance":
        // Vibrance is approximated as saturation in Sharp
        return this.applyVibrance(image, effect.amount);

      case "denoise":
        // Sharp has median filter which can reduce noise
        return this.applyDenoise(image, effect.exponent);

      case "unsharpMask":
        return this.applyUnsharpMask(image, effect.radius, effect.strength);

      case "vignette":
        return this.applyVignette(image, effect.size, effect.amount);

      case "lensBlur":
        // Approximate with Gaussian blur
        return this.applyBlur(image, effect.radius);

      case "triangleBlur":
        // Approximate with Gaussian blur
        return this.applyBlur(image, effect.radius);

      case "zoomBlur":
        // Not supported in Sharp, skip
        console.warn("zoomBlur is not supported in Sharp (Node.js), skipping effect");
        return image;

      default:
        throw new Error(`Unknown effect: ${(effect as any).effect}`);
    }
  }

  /**
   * Apply brightness and contrast adjustments
   */
  private applyBrightnessContrast(
    image: sharp.Sharp,
    brightness: number,
    contrast: number
  ): sharp.Sharp {
    // Brightness: -1 to 1, map to Sharp's multiplier (0 to 2+)
    // 0 = no change (multiplier 1), -1 = black (multiplier 0), 1 = double brightness (multiplier 2)
    const brightnessMult = 1 + brightness;

    // Contrast: -1 to 1, using linear() method
    // linear applies: a * input + b
    // For contrast: a = 1 + contrast, b needs to center around 0.5
    const contrastMult = 1 + contrast;
    const contrastOffset = (1 - contrastMult) * 0.5 * 255; // Offset to keep midpoint at 128

    let result = image;

    // Apply brightness first
    if (brightness !== 0) {
      result = result.modulate({ brightness: brightnessMult });
    }

    // Apply contrast
    if (contrast !== 0) {
      result = result.linear(contrastMult, contrastOffset);
    }

    return result;
  }

  /**
   * Apply hue and saturation adjustments
   */
  private applyHueSaturation(image: sharp.Sharp, hue: number, saturation: number): sharp.Sharp {
    // Hue: -1 to 1, map to degrees (0 to 360)
    // Map -1 to 1 range to -180 to 180 degrees
    const hueDegrees = hue * 180;

    // Saturation: -1 to 1, map to Sharp's multiplier
    // 0 = no change (multiplier 1), -1 = grayscale (multiplier 0), 1 = double saturation (multiplier 2)
    const saturationMult = 1 + saturation;

    return image.modulate({
      hue: hueDegrees,
      saturation: saturationMult,
    });
  }

  /**
   * Apply sepia tone effect
   */
  private applySepia(image: sharp.Sharp, amount: number): sharp.Sharp {
    // Sepia effect: reduce saturation and apply warm tint
    const sepiaAmount = Math.max(0, Math.min(1, amount));

    // First desaturate based on amount
    const saturation = 1 - sepiaAmount * 0.7;

    // Apply sepia tint (warm brownish tone)
    // Sepia RGB: approximately #704214 or rgb(112, 66, 20)
    const tintR = Math.round(112 * sepiaAmount);
    const tintG = Math.round(66 * sepiaAmount);
    const tintB = Math.round(20 * sepiaAmount);

    let result = image.modulate({ saturation });

    if (sepiaAmount > 0) {
      // Blend sepia tint
      result = result.tint({
        r: tintR + 255 - tintR,
        g: tintG + 255 - tintG,
        b: tintB + 255 - tintB,
      });
    }

    return result;
  }

  /**
   * Apply vibrance adjustment (approximated as saturation)
   */
  private applyVibrance(image: sharp.Sharp, amount: number): sharp.Sharp {
    // Vibrance is more subtle than saturation, affecting desaturated colors more
    // In Sharp, we approximate it with saturation at reduced strength
    const saturationMult = 1 + amount * 0.5; // Half the strength of full saturation
    return image.modulate({ saturation: saturationMult });
  }

  /**
   * Apply denoising (using median filter)
   */
  private applyDenoise(image: sharp.Sharp, exponent: number): sharp.Sharp {
    // Sharp's median() can reduce noise
    // The exponent parameter doesn't directly map, so we use a fixed median size
    if (exponent > 0) {
      return image.median(Math.min(3, Math.max(1, Math.round(exponent / 10))));
    }
    return image;
  }

  /**
   * Apply unsharp mask for sharpening
   */
  private applyUnsharpMask(image: sharp.Sharp, radius: number, strength: number): sharp.Sharp {
    // Sharp's sharpen takes sigma (similar to radius) and optional flat/jagged parameters
    const sigma = radius / 10; // Scale down radius to reasonable sigma range
    const flat = 1;
    const jagged = strength;

    // Use positional parameters instead of object
    return image.sharpen(sigma, flat, jagged);
  }

  /**
   * Apply vignette effect using composite overlay
   */
  private async applyVignette(
    image: sharp.Sharp,
    size: number,
    amount: number
  ): Promise<sharp.Sharp> {
    // Get image metadata to determine dimensions
    const metadata = await image.metadata();
    const width = metadata.width!;
    const height = metadata.height!;

    // Create a radial gradient for vignette
    // This is complex in Sharp, so we'll use a simpler approach with brightness adjustment at edges
    // For now, we'll approximate with a global brightness reduction
    // A full implementation would require creating a custom overlay image

    const darken = 1 - amount * 0.3; // Reduce brightness at edges
    return image.modulate({ brightness: darken });
  }

  /**
   * Apply Gaussian blur
   */
  private applyBlur(image: sharp.Sharp, radius: number): sharp.Sharp {
    // Sharp's blur takes sigma value
    // Map radius to reasonable sigma range (0.3 to 1000)
    const sigma = Math.max(0.3, Math.min(1000, radius / 2));
    return image.blur(sigma);
  }
}
