/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CreateWorkflow,
  JobQueueTask,
  JobQueueTaskConfig,
  TaskRegistry,
  Workflow,
} from "@workglow/task-graph";
import { DataPortSchema, FromSchema } from "@workglow/util";

/**
 * Individual effect definitions
 */
const brightnessContrastEffect = {
  type: "object",
  properties: {
    effect: { const: "brightnessContrast" as const },
    brightness: {
      type: "number",
      minimum: -1,
      maximum: 1,
      default: 0,
      title: "Brightness",
      description: "Additive brightness adjustment (-1 = black, 0 = no change, 1 = white)",
    },
    contrast: {
      type: "number",
      minimum: -1,
      maximum: 1,
      default: 0,
      title: "Contrast",
      description:
        "Multiplicative contrast adjustment (-1 = gray, 0 = no change, 1 = max contrast)",
    },
  },
  required: ["effect", "brightness", "contrast"],
  additionalProperties: false,
} as const;

const hueSaturationEffect = {
  type: "object",
  properties: {
    effect: { const: "hueSaturation" as const },
    hue: {
      type: "number",
      minimum: -1,
      maximum: 1,
      default: 0,
      title: "Hue",
      description: "Rotational hue adjustment (-1 to 1)",
    },
    saturation: {
      type: "number",
      minimum: -1,
      maximum: 1,
      default: 0,
      title: "Saturation",
      description: "Multiplicative saturation adjustment (-1 to 1)",
    },
  },
  required: ["effect", "hue", "saturation"],
  additionalProperties: false,
} as const;

const sepiaEffect = {
  type: "object",
  properties: {
    effect: { const: "sepia" as const },
    amount: {
      type: "number",
      minimum: 0,
      maximum: 1,
      default: 1,
      title: "Amount",
      description: "Sepia effect intensity (0 = no effect, 1 = full sepia)",
    },
  },
  required: ["effect", "amount"],
  additionalProperties: false,
} as const;

const vibranceEffect = {
  type: "object",
  properties: {
    effect: { const: "vibrance" as const },
    amount: {
      type: "number",
      minimum: -1,
      maximum: 1,
      default: 0.5,
      title: "Amount",
      description: "Vibrance adjustment (-1 = min, 0 = no change, 1 = max)",
    },
  },
  required: ["effect", "amount"],
  additionalProperties: false,
} as const;

const denoiseEffect = {
  type: "object",
  properties: {
    effect: { const: "denoise" as const },
    exponent: {
      type: "number",
      minimum: 0,
      maximum: 50,
      default: 20,
      title: "Exponent",
      description: "Denoising strength (higher = more denoising)",
    },
  },
  required: ["effect", "exponent"],
  additionalProperties: false,
} as const;

const unsharpMaskEffect = {
  type: "object",
  properties: {
    effect: { const: "unsharpMask" as const },
    radius: {
      type: "number",
      minimum: 0,
      maximum: 200,
      default: 20,
      title: "Radius",
      description: "Blur radius for calculating neighboring pixels",
    },
    strength: {
      type: "number",
      minimum: 0,
      maximum: 5,
      default: 2,
      title: "Strength",
      description: "Sharpening strength (0 = no effect, higher = stronger)",
    },
  },
  required: ["effect", "radius", "strength"],
  additionalProperties: false,
} as const;

const vignetteEffect = {
  type: "object",
  properties: {
    effect: { const: "vignette" as const },
    size: {
      type: "number",
      minimum: 0,
      maximum: 1,
      default: 0.5,
      title: "Size",
      description: "Vignette size (0 = center, 1 = edges)",
    },
    amount: {
      type: "number",
      minimum: 0,
      maximum: 1,
      default: 0.5,
      title: "Amount",
      description: "Vignette darkness (0 = no effect, 1 = maximum)",
    },
  },
  required: ["effect", "size", "amount"],
  additionalProperties: false,
} as const;

const lensBlurEffect = {
  type: "object",
  properties: {
    effect: { const: "lensBlur" as const },
    radius: {
      type: "number",
      minimum: 0,
      maximum: 50,
      default: 10,
      title: "Radius",
      description: "Blur radius for bokeh effect",
    },
    brightness: {
      type: "number",
      minimum: -1,
      maximum: 1,
      default: 0.75,
      title: "Brightness",
      description: "Bokeh brightness (-1 = dark, 1 = bright)",
    },
    angle: {
      type: "number",
      minimum: 0,
      maximum: 6.283185,
      default: 0,
      title: "Angle",
      description: "Bokeh rotation in radians (0 to 2π)",
    },
  },
  required: ["effect", "radius", "brightness", "angle"],
  additionalProperties: false,
} as const;

const triangleBlurEffect = {
  type: "object",
  properties: {
    effect: { const: "triangleBlur" as const },
    radius: {
      type: "number",
      minimum: 0,
      maximum: 200,
      default: 20,
      title: "Radius",
      description: "Blur radius",
    },
  },
  required: ["effect", "radius"],
  additionalProperties: false,
} as const;

const zoomBlurEffect = {
  type: "object",
  properties: {
    effect: { const: "zoomBlur" as const },
    centerX: {
      type: "number",
      minimum: 0,
      maximum: 1,
      default: 0.5,
      title: "Center X",
      description: "Horizontal center point (0 to 1)",
    },
    centerY: {
      type: "number",
      minimum: 0,
      maximum: 1,
      default: 0.5,
      title: "Center Y",
      description: "Vertical center point (0 to 1)",
    },
    strength: {
      type: "number",
      minimum: 0,
      maximum: 1,
      default: 0.3,
      title: "Strength",
      description: "Blur strength",
    },
  },
  required: ["effect", "centerX", "centerY", "strength"],
  additionalProperties: false,
} as const;

const inputSchema = {
  type: "object",
  properties: {
    image: {
      type: "string",
      title: "Image",
      description: "Base64-encoded image or image URL",
      contentEncoding: "base64",
    },
    effects: {
      type: "array",
      title: "Effects",
      description: "Array of effects to apply in sequence",
      items: {
        oneOf: [
          brightnessContrastEffect,
          hueSaturationEffect,
          sepiaEffect,
          vibranceEffect,
          denoiseEffect,
          unsharpMaskEffect,
          vignetteEffect,
          lensBlurEffect,
          triangleBlurEffect,
          zoomBlurEffect,
        ],
      },
      default: [],
    },
    outputFormat: {
      enum: ["image/png", "image/jpeg", "image/webp"],
      title: "Output Format",
      description: "Output image format",
      default: "image/png",
    },
    quality: {
      type: "number",
      minimum: 0,
      maximum: 1,
      default: 0.95,
      title: "Quality",
      description: "Output image quality (for JPEG/WebP, 0-1)",
    },
    queue: {
      oneOf: [{ type: "boolean" }, { type: "string" }],
      description: "Queue handling: false=run inline, true=use default, string=explicit queue name",
      default: false,
      "x-ui-hidden": true,
    },
  },
  required: ["image", "effects"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

const outputSchema = {
  type: "object",
  properties: {
    image: {
      type: "string",
      title: "Image",
      description: "Base64-encoded processed image",
      contentEncoding: "base64",
    },
  },
  required: ["image"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type ImageEffectTaskInput = FromSchema<typeof inputSchema>;
export type ImageEffectTaskOutput = FromSchema<typeof outputSchema>;

export type ImageEffectTaskConfig = JobQueueTaskConfig;

/**
 * ImageEffectTask provides image effects using platform-specific implementations
 *
 * - Browser: Uses glfx.js with WebGL for GPU-accelerated effects
 * - Node.js: Uses Sharp for server-side image processing
 *
 * This task allows applying various image effects such as brightness/contrast,
 * blur, sepia, vibrance, and more.
 *
 * Note: Some effects may have different implementations or availability depending on the platform.
 */
export class ImageEffectTask<
  Input extends ImageEffectTaskInput = ImageEffectTaskInput,
  Output extends ImageEffectTaskOutput = ImageEffectTaskOutput,
  Config extends ImageEffectTaskConfig = ImageEffectTaskConfig,
> extends JobQueueTask<Input, Output, Config> {
  public static type = "ImageEffectTask";
  public static category = "Image";
  public static title = "Image Effects";
  public static description =
    "Apply image effects (brightness, contrast, blur, sepia, etc.) using platform-optimized libraries";

  public static inputSchema(): DataPortSchema {
    return inputSchema;
  }

  public static outputSchema(): DataPortSchema {
    return outputSchema;
  }

  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    config.queue = input?.queue ?? config.queue;
    if (config.queue === undefined) {
      config.queue = false; // Run directly by default
    }
    super(input, config);

    // Dynamically set the job class based on the environment
    this.initializeJobClass();
  }

  /**
   * Initialize the appropriate job class based on the runtime environment
   */
  private async initializeJobClass(): Promise<void> {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Browser environment - use glfx
      const { ImageEffectJob: BrowserImageEffectJob } = await import("./ImageEffectJob.browser");
      this.jobClass = BrowserImageEffectJob as any;
    } else {
      // Node.js environment - use Sharp
      const { ImageEffectJob: NodeImageEffectJob } = await import("./ImageEffectJob.node");
      this.jobClass = NodeImageEffectJob as any;
    }
  }

  protected override async getDefaultQueueName(input: Input): Promise<string | undefined> {
    return "image:effects";
  }
}

TaskRegistry.registerTask(ImageEffectTask);

/**
 * Convenience function to apply image effects
 */
export const ImageEffect = async (
  input: ImageEffectTaskInput,
  config: ImageEffectTaskConfig = {}
): Promise<ImageEffectTaskOutput> => {
  const result = await new ImageEffectTask(input, config).run();
  return result as ImageEffectTaskOutput;
};

declare module "@workglow/task-graph" {
  interface Workflow {
    ImageEffect: CreateWorkflow<ImageEffectTaskInput, ImageEffectTaskOutput, ImageEffectTaskConfig>;
  }
}

Workflow.prototype.ImageEffect = CreateWorkflow(ImageEffectTask);
