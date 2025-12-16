# Lumat-Color Architecture

> Technical documentation for maintainers and contributors

**Last Updated:** December 14, 2025

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Constants Management](#constants-management)
3. [Color Engine Architecture](#color-engine-architecture)
4. [Contrast Calculation](#contrast-calculation)
5. [State Management](#state-management)
6. [Performance Optimizations](#performance-optimizations)

---

## Project Structure

```
lumat-color/
├── src/
│   ├── components/        # React components (Radix UI)
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Core business logic
│   │   ├── constants.ts         # 📍 Single source of truth for all constants
│   │   ├── colorEngine.ts       # OKLCH color generation
│   │   ├── contrast.ts          # APCA & WCAG calculations
│   │   ├── contrastUnified.ts   # Unified contrast API
│   │   ├── chromaLimits.ts      # P3 gamut handling
│   │   └── ...
│   └── ...
├── docs/                 # Documentation
└── public/              # Static assets
```

---

## Constants Management

### Philosophy: Single Source of Truth

All constants, thresholds, and algorithm parameters are centralized in `src/utils/constants.ts` to:

- **Prevent Algorithm Drift**: Ensures consistency across multiple implementations
- **Simplify Maintenance**: Update once, apply everywhere
- **Improve Documentation**: Named constants are self-documenting
- **Enable Type Safety**: Centralized exports provide better IntelliSense

### APCA Algorithm Constants

All APCA (Accessible Perceptual Contrast Algorithm) calculation parameters are defined in `APCA_ALGORITHM_CONSTANTS`:

```typescript
export const APCA_ALGORITHM_CONSTANTS = {
  // Exponents for perceived lightness
  normBG: 0.56, // Normal polarity background (dark text on light bg)
  normTXT: 0.57, // Normal polarity text
  revTXT: 0.62, // Reverse polarity text (light text on dark bg)
  revBG: 0.65, // Reverse polarity background

  // Black level handling
  blkThrs: 0.022, // Black threshold for very dark colors
  blkClmp: 1.414, // Black clamp multiplier

  // Scaling factors
  scaleBoW: 1.14, // Scale factor for black-on-white
  scaleWoB: 1.14, // Scale factor for white-on-black

  // Low contrast adjustments
  loConThresh: 0.1, // Low contrast threshold
  loConOffset: 0.027, // Low contrast offset

  // Minimum perceptible difference
  deltaYmin: 0.0005, // Minimum Y difference to register contrast
};
```

### APCA Target Thresholds

Minimum APCA Lc (Lightness contrast) values for different use cases:

```typescript
export const APCA_TARGETS = {
  bodyText: 75, // Bronze standard for body text (15-18px)
  largeText: 60, // For larger text (24px+)
  UI: 45, // For UI components (icons, borders)
  incidental: 30, // For disabled/placeholder text
};
```

### WCAG Contrast Thresholds

WCAG 2.1 contrast ratio requirements:

```typescript
export const WCAG_THRESHOLDS = {
  AAA_NORMAL: 7.0, // AAA for normal text (< 24px or < 18.5px bold)
  AA_NORMAL: 4.5, // AA for normal text
  AAA_LARGE: 4.5, // AAA for large text (≥ 24px or ≥ 18.5px bold)
  AA_LARGE: 3.0, // AA for large text
};
```

### Usage Example

**Before (hardcoded magic numbers):**

```typescript
// ❌ Scattered across multiple files
if (wcagValue >= 4.5) {
  return "AA compliant";
}
```

**After (centralized constants):**

```typescript
// ✅ Import from single source
import { WCAG_THRESHOLDS } from "./constants";

if (wcagValue >= WCAG_THRESHOLDS.AA_NORMAL) {
  return "AA compliant";
}
```

### Migration Pattern

When adding new constants:

1. **Define in `constants.ts`** with JSDoc comments
2. **Export with descriptive names**
3. **Update all consumers** to import from constants
4. **Deprecate old exports** with comments
5. **Document in CHANGELOG.md**

---

## Color Engine Architecture

### OKLCH Color Space

Lumat-Color uses OKLCH (Oklab Lightness, Chroma, Hue) for perceptually uniform color generation.

**Key Benefits:**

- **Perceptual Uniformity**: Equal numeric changes = equal visual changes
- **Wide Gamut**: Supports Display P3 color space (25% more colors than sRGB)
- **Predictable Behavior**: Consistent lightness across hues

**Color Format:**

```typescript
interface OKLCHColor {
  mode: "oklch";
  l: number; // Lightness: 0 (black) to 1 (white)
  c: number; // Chroma: 0 (gray) to ~0.4 (vibrant)
  h: number; // Hue: 0-360 degrees
  alpha?: number; // Optional opacity: 0-1
}
```

### Lightness Steps

Default 15-step scale provides optimal granularity for UI design:

```typescript
export const DEFAULT_LIGHTNESS_STEPS = [
  98, 96, 93, 90, 85, 80, 70, 60, 48, 40, 32, 26, 20, 17, 14,
];
```

**Rationale:**

- **Steps 98-93**: Subtle backgrounds, hover states
- **Steps 90-70**: Borders, disabled states
- **Steps 60-40**: Interactive elements (buttons, links)
- **Steps 32-14**: Text, high-emphasis content

### Gamut Mapping

Colors are clamped to Display P3 gamut using binary search algorithm:

1. Start with target OKLCH values
2. Use `culori.clampChroma()` to find closest in-gamut color
3. Track modifications (chroma reduction, lightness shift)
4. Report `wasModified` flag for user awareness

---

## Contrast Calculation

### Dual Algorithm Support

Lumat-Color supports both WCAG 2.1 and APCA contrast algorithms:

| Algorithm | Range        | Purpose                                     |
| --------- | ------------ | ------------------------------------------- |
| **WCAG**  | 1:1 to 21:1  | Legal compliance, widely recognized         |
| **APCA**  | -108 to +106 | Perceptually accurate, modern accessibility |

### Implementation

**WCAG 2.1 (Relative Luminance):**

```typescript
// From contrast.ts
export function calculateWCAG(
  foreground: OKLCHColor,
  background: OKLCHColor
): number {
  const fgLum = relativeLuminance(foreground);
  const bgLum = relativeLuminance(background);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}
```

**APCA (Perceptual Lightness Contrast):**

```typescript
// From contrast.ts - uses APCA_ALGORITHM_CONSTANTS
export function calculateAPCA(
  foreground: OKLCHColor,
  background: OKLCHColor
): number {
  // Implementation uses constants from constants.ts
  const { normBG, normTXT, revTXT, revBG, ... } = APCA_ALGORITHM_CONSTANTS;
  // ... calculation logic
}
```

### Contrast Validation

```typescript
// From contrast.ts
export function validateContrast(
  contrast: number,
  isAPCA: boolean,
  level: "AA" | "AAA" | "body" | "large" | "UI"
): boolean {
  if (isAPCA) {
    const threshold =
      level === "body"
        ? APCA_TARGETS.bodyText
        : level === "large"
        ? APCA_TARGETS.largeText
        : level === "UI"
        ? APCA_TARGETS.UI
        : 60;
    return Math.abs(contrast) >= threshold;
  } else {
    const threshold =
      level === "AAA"
        ? WCAG_THRESHOLDS.AAA_NORMAL
        : level === "AA"
        ? WCAG_THRESHOLDS.AA_NORMAL
        : level === "large"
        ? WCAG_THRESHOLDS.AA_LARGE
        : 4.5;
    return contrast >= threshold;
  }
}
```

---

## State Management

### Zustand Store

Global state managed with Zustand (`src/store/useAppStore.ts`):

```typescript
interface AppState {
  // Color scales
  scales: ColorScale[];
  selectedScaleId: string | null;

  // Accessibility settings
  accessibilitySettings: {
    contrastMode: "wcag" | "apca";
    targetBackground: "black" | "white" | "gray";
    minimumContrast: number;
  };

  // UI state
  view: "swatch" | "gradient" | "matrix" | "analysis";
  showGamutWarnings: boolean;

  // Actions
  addScale: (scale: ColorScale) => void;
  updateScale: (id: string, updates: Partial<ColorScale>) => void;
  // ...
}
```

**Persistence:** State automatically saved to `localStorage` using Zustand's `persist` middleware.

---

## Performance Optimizations

### Color Caching

Expensive color calculations are cached:

```typescript
// From performanceOptimizations.ts
export class ColorCache {
  private cache = new Map<string, ColorResult>();

  get(key: string): ColorResult | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: ColorResult): void {
    if (this.cache.size > 1000) {
      this.cache.clear(); // LRU-style eviction
    }
    this.cache.set(key, value);
  }
}
```

### Performance Flags

Control expensive operations:

```typescript
export const PERFORMANCE_FLAGS = {
  enableColorCache: true,
  enableContrastCache: true,
  enableWebWorkers: false, // Future: offload calculations
  maxCacheSize: 1000,
};
```

### Memoization

React hooks use `useMemo` for derived state:

```typescript
// From ScaleView.tsx
const colors = useMemo(() => {
  return generateColors(scale, accessibilitySettings);
}, [
  scale.hue,
  scale.chroma,
  scale.lightness,
  accessibilitySettings.targetBackground,
]);
```

---

## Best Practices

### Adding New Features

1. **Constants First**: Define thresholds in `constants.ts`
2. **Type Safety**: Add TypeScript interfaces in `types/index.ts`
3. **Core Logic**: Implement in `utils/` (pure functions, no React)
4. **React Integration**: Create hooks in `hooks/` or components in `components/`
5. **State Management**: Update Zustand store if persistent state needed
6. **Documentation**: Update relevant docs in `docs/`
7. **Changelog**: Document changes in `CHANGELOG.md`

### Testing Checklist

Before committing:

- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Test in Chrome, Safari, Firefox
- [ ] Verify accessibility with screen reader
- [ ] Check `prefers-reduced-motion` support
- [ ] Test on mobile viewport
- [ ] Verify P3 gamut colors on wide-gamut display

---

## References

- [OKLCH Color Space](https://bottosson.github.io/posts/oklab/)
- [APCA Algorithm](https://github.com/Myndex/apca-w3)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Radix UI Themes](https://www.radix-ui.com/themes)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Culori Color Library](https://culorijs.org/)
