# ImageEffectTask

A cross-platform image effects task that provides GPU-accelerated effects in the browser and server-side processing in Node.js.

## Features

- **Cross-Platform**: Automatically uses the appropriate implementation based on the runtime environment
  - **Browser**: Uses glfx.js with WebGL for GPU-accelerated effects
  - **Node.js**: Uses Sharp for server-side image processing
- **Multiple Effects**: Support for 10 different effect types (brightness, contrast, blur, sepia, etc.)
- **Effect Chaining**: Apply multiple effects in sequence
- **Progress Tracking**: Get progress updates during processing
- **Multiple Output Formats**: PNG, JPEG, and WebP support

## Installation

The task is part of the `@workglow/tasks` package:

```bash
bun add @workglow/tasks
```

For Node.js usage, Sharp will be installed as a dependency automatically.

## Quick Start

### Basic Usage

```typescript
import { ImageEffect } from "@workglow/tasks";

const result = await ImageEffect({
  image: "data:image/png;base64,...",
  effects: [
    {
      effect: "brightnessContrast",
      brightness: 0.2,
      contrast: 0.3,
    },
  ],
  outputFormat: "image/png",
  quality: 0.95,
});

console.log(result.image); // Base64-encoded processed image
```

### Using with Workflow

```typescript
import { Workflow } from "@workglow/task-graph";

const workflow = new Workflow();
const result = await workflow
  .ImageEffect({
    image: imageUrl,
    effects: [{ effect: "sepia", amount: 0.7 }],
  })
  .run();
```

## Supported Effects

### All Platforms

The following effects are supported on both browser and Node.js:

1. **brightnessContrast** - Adjust image brightness and contrast
2. **hueSaturation** - Modify hue and saturation
3. **sepia** - Apply sepia tone effect
4. **vibrance** - Adjust color vibrance
5. **denoise** - Reduce image noise
6. **unsharpMask** - Sharpen the image
7. **vignette** - Add darkening effect at edges
8. **lensBlur** - Apply blur effect
9. **triangleBlur** - Apply triangle blur (Gaussian on Node.js)

### Browser Only

- **zoomBlur** - Radial zoom blur effect (not supported on Node.js)

## Platform-Specific Differences

While both implementations aim to provide similar results, there are some differences:

- **Browser (glfx.js)**: All effects fully supported with native implementations
- **Node.js (Sharp)**: Some effects are approximated:
  - Sepia: Uses tint and saturation adjustments
  - Vibrance: Approximated as reduced saturation adjustment
  - Denoise: Uses median filter
  - Vignette: Simplified implementation
  - Blur effects: Use Gaussian blur approximation
  - ZoomBlur: Not supported (effect is skipped)

## Implementation Details

### Architecture

The task uses a factory pattern to load the appropriate implementation:

```
ImageEffectTask (main entry point)
    ├── ImageEffectJob.browser.ts (glfx.js implementation)
    └── ImageEffectJob.node.ts (Sharp implementation)
```

The environment is detected at runtime, and the appropriate job class is loaded dynamically.

### Type Safety

Full TypeScript support with strict typing for:

- Effect parameters
- Input/output schemas
- Platform-specific capabilities

### Performance

- **Browser**: GPU-accelerated via WebGL, suitable for real-time effects
- **Node.js**: CPU-based but highly optimized via Sharp's native bindings

## API Reference

See [ImageEffectTask.example.md](./ImageEffectTask.example.md) for detailed API documentation and examples.

## Testing

The task has been tested with:

- TypeScript compilation
- ESLint validation
- Runtime environment detection

For production use, test your specific effects and parameters in your target environment(s).

## License

Apache-2.0

## Author

Steven Roussey <sroussey@gmail.com>
