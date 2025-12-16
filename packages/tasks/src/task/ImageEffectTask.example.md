# ImageEffectTask Example Usage

The `ImageEffectTask` provides image effects using platform-optimized libraries:

- **Browser**: GPU-accelerated effects using glfx.js and WebGL
- **Node.js**: Server-side image processing using Sharp

## Basic Usage

```typescript
import { ImageEffect } from "@workglow/tasks";

// Apply a single sepia effect
const result = await ImageEffect({
  image: "data:image/png;base64,...", // or image URL
  effects: [
    {
      effect: "sepia",
      amount: 0.8,
    },
  ],
  outputFormat: "image/png",
  quality: 0.95,
});

console.log(result.image); // Base64-encoded processed image
```

## Available Effects

### Brightness & Contrast

```typescript
{
  effect: "brightnessContrast",
  brightness: 0.2,  // -1 to 1
  contrast: 0.3     // -1 to 1
}
```

### Hue & Saturation

```typescript
{
  effect: "hueSaturation",
  hue: 0.1,        // -1 to 1
  saturation: 0.5  // -1 to 1
}
```

### Sepia Tone

```typescript
{
  effect: "sepia",
  amount: 0.8  // 0 to 1
}
```

### Vibrance

```typescript
{
  effect: "vibrance",
  amount: 0.5  // -1 to 1
}
```

### Denoise

```typescript
{
  effect: "denoise",
  exponent: 20  // 0 to 50
}
```

### Unsharp Mask (Sharpening)

```typescript
{
  effect: "unsharpMask",
  radius: 20,    // 0 to 200
  strength: 2    // 0 to 5
}
```

### Vignette

```typescript
{
  effect: "vignette",
  size: 0.5,    // 0 to 1
  amount: 0.5   // 0 to 1
}
```

### Lens Blur (Bokeh)

```typescript
{
  effect: "lensBlur",
  radius: 10,       // 0 to 50
  brightness: 0.75, // -1 to 1
  angle: 0          // 0 to 2π radians
}
```

### Triangle Blur

```typescript
{
  effect: "triangleBlur",
  radius: 20  // 0 to 200
}
```

### Zoom Blur

```typescript
{
  effect: "zoomBlur",
  centerX: 0.5,   // 0 to 1
  centerY: 0.5,   // 0 to 1
  strength: 0.3   // 0 to 1
}
```

## Chaining Multiple Effects

Effects are applied in sequence:

```typescript
const result = await ImageEffect({
  image: "data:image/png;base64,...",
  effects: [
    {
      effect: "brightnessContrast",
      brightness: 0.1,
      contrast: 0.2,
    },
    {
      effect: "vibrance",
      amount: 0.3,
    },
    {
      effect: "vignette",
      size: 0.6,
      amount: 0.4,
    },
    {
      effect: "unsharpMask",
      radius: 20,
      strength: 1.5,
    },
  ],
  outputFormat: "image/jpeg",
  quality: 0.9,
});
```

## Using with Workflow

```typescript
import { Workflow } from "@workglow/task-graph";

const workflow = new Workflow();

const result = await workflow
  .ImageEffect({
    image: "https://example.com/image.jpg",
    effects: [
      { effect: "sepia", amount: 0.7 },
      { effect: "vignette", size: 0.5, amount: 0.3 },
    ],
  })
  .run();
```

## Output Formats

Supported output formats:

- `image/png` (default) - Lossless format
- `image/jpeg` - Lossy format with quality control
- `image/webp` - Modern format with quality control

## Platform Support

### Browser (glfx.js + WebGL)

All effects are fully supported:

- ✅ brightnessContrast
- ✅ hueSaturation
- ✅ sepia
- ✅ vibrance
- ✅ denoise
- ✅ unsharpMask
- ✅ vignette
- ✅ lensBlur
- ✅ triangleBlur
- ✅ zoomBlur

**Requirements:**

- WebGL support in the browser
- For loading images from URLs, ensure proper CORS headers are set

### Node.js (Sharp)

Most effects are supported with approximations where needed:

- ✅ brightnessContrast - Full support
- ✅ hueSaturation - Full support
- ✅ sepia - Approximated with tint and saturation
- ✅ vibrance - Approximated as reduced saturation adjustment
- ✅ denoise - Approximated with median filter
- ✅ unsharpMask - Full support (sharpen)
- ⚠️ vignette - Simplified implementation (global darkening)
- ⚠️ lensBlur - Approximated with Gaussian blur
- ⚠️ triangleBlur - Approximated with Gaussian blur
- ❌ zoomBlur - Not supported (effect is skipped)

**Requirements:**

- Sharp library installed
- Node.js environment

## Output Formats

Supported output formats on both platforms:

- `image/png` (default) - Lossless format
- `image/jpeg` - Lossy format with quality control
- `image/webp` - Modern format with quality control

## Notes

- Effects are applied sequentially in the order specified
- Progress updates are provided between effect applications
- The task automatically detects the environment and uses the appropriate implementation
- The task runs inline by default (queue: false) for immediate processing
- Some effects may have different visual results between browser and Node.js implementations
