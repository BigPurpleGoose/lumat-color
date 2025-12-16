# Lumat-Color Documentation

> Professional color scale designer using OKLCH color space with Display P3 gamut support

**Version:** 1.0.0
**Last Updated:** December 14, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features](#features)
3. [Workflow Guide](#workflow-guide)
4. [Onboarding](#onboarding)
5. [Changelog](#changelog)
6. [Troubleshooting](#troubleshooting)
7. [Browser Support](#browser-support)
8. [Resources](#resources)

---

## Quick Start

### What is Lumat-Color?

Lumat-Color is a professional color scale designer that generates perceptually uniform color scales using the OKLCH color space. It features advanced contrast modes, accessibility tools, and multiple export formats optimized for modern design systems.

**Key Benefits:**

- **Perceptually Uniform**: OKLCH ensures consistent visual spacing
- **Wide Gamut**: Display P3 support for vibrant, modern colors
- **Accessibility-First**: Built-in WCAG & APCA validation with auto-fix tools
- **Professional Exports**: CSS, JSON, Markdown, Design Tokens, SVG, HTML, CSV

### Installation

**System Requirements:**

- Node.js 22+ (for development server)
- Node.js 18.16.0+ (for builds)
- Modern browser with P3 gamut support (Chrome 111+, Safari 15+, Firefox 113+)

**Getting Started:**

```bash
# Clone or navigate to the lumat-color directory
cd lumat-color

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will open at `http://localhost:5173` (default Vite port).

---

## Features

### Color Generation

| Feature                | Status | Description                                                                         |
| ---------------------- | ------ | ----------------------------------------------------------------------------------- |
| **OKLCH Color Space**  | ✅     | Perceptually uniform color generation                                               |
| **Display P3 Gamut**   | ✅     | Wide color gamut for modern displays                                                |
| **15-Step Scales**     | ✅     | Default lightness steps: 98, 96, 93, 90, 85, 80, 70, 60, 48, 40, 32, 26, 20, 17, 14 |
| **Custom Steps**       | ✅     | Per-scale override option                                                           |
| **Lightness Presets**  | ✅     | Standard, High Contrast, Subtle, Extreme                                            |
| **Grayscale Profiles** | ✅     | True Gray, Warm Gray, Cool Gray, Blue Gray, Plum Gray                               |

**Lightness Presets:**

- **Standard (15 steps)**: 98, 96, 93, 90, 85, 80, 70, 60, 48, 40, 32, 26, 20, 17, 14
- **High Contrast (13 steps)**: 98, 94, 88, 82, 75, 68, 60, 48, 36, 28, 22, 16, 12
- **Subtle (11 steps)**: 97, 94, 90, 85, 78, 70, 62, 54, 46, 38, 30
- **Extreme (19 steps)**: 99, 98, 96, 93, 90, 85, 80, 70, 60, 50, 40, 32, 26, 20, 17, 14, 11, 8, 5

### Contrast Modes

| Mode                  | Purpose                        | Best For                             |
| --------------------- | ------------------------------ | ------------------------------------ |
| **Standard**          | ✅ Direct OKLCH generation     | Vibrant UI colors, brand accents     |
| **APCA Fixed**        | ✅ Target APCA Lc values       | Consistent text contrast across hues |
| **Luminance Matched** | ✅ Grayscale-consistent colors | Neutral palettes, subtle tints       |
| **APCA Target**       | ✨ Single-color generation     | Specific contrast requirements       |
| **WCAG Target**       | ✨ Single-color generation     | WCAG AA/AAA compliance               |

**Contrast Mode Details:**

- **Standard**: Pure OKLCH generation based on hue, chroma, and lightness curves. Ideal for vibrant accent colors and brand palettes.

- **APCA Fixed**: Uses binary search to find exact lightness values that produce target APCA Lc values. Ensures consistent perceived contrast across different hues. Target Lc values: 105, 100, 95, 90, 85, 80, 75, 70, 60, 50, 40, 30, 20, 15, 10.

- **Luminance Matched**: Matches luminance to grayscale equivalents while maintaining hue/chroma. Perfect for neutral color scales with subtle color temperature.

- **APCA Target**: Generates a single color matching a specific APCA Lc value against a background. Useful for one-off accessibility fixes.

- **WCAG Target**: Generates a single color matching a specific WCAG contrast ratio against a background. Traditional accessibility approach.

### Fine-Tuning Controls

| Control                 | Range          | Purpose                                           |
| ----------------------- | -------------- | ------------------------------------------------- |
| **Hue Shift**           | -180° to +180° | Adjust hue progression across lightness scale     |
| **Hue Power**           | 0.5 to 2.0     | Control curve shape (linear vs. exponential)      |
| **Chroma Shift**        | -0.2 to +0.2   | Adjust saturation progression                     |
| **Chroma Power**        | 0.5 to 2.0     | Control saturation curve shape                    |
| **Chroma Compensation** | ✅ On/Off      | Auto-adjust chroma to maintain visual consistency |

**Curve Controls:**

- **Shift**: Moves the curve up/down (or left/right for hue rotation)
- **Power**: Changes curve shape
  - Power < 1.0: More change in light colors
  - Power = 1.0: Linear progression
  - Power > 1.0: More change in dark colors

**Access Curve Controls:**

- Click the "Curve Controls" button in the Fine-Tuning accordion
- Adjustments show "Active" badge when non-default values are applied
- Reset button returns to default values (shift: 0, power: 1.0)

### Visualization Views

#### 1. Swatch View ✅

- **Layout**: Responsive grid (auto-fill, 120px minimum)
- **Display**: Hex codes, OKLCH values, lightness labels
- **Actions**: Copy hex/OKLCH/P3 formats
- **Contrast**: Visual indicators when threshold enabled
- **Best For**: Reviewing individual colors, copying values

#### 2. Gradient View ✨

- **Modes**: Linear (172°), Animated (132° with 15s animation)
- **Aspect Ratio**: 7:5 for consistent display
- **Purpose**: Detect color banding (Bezold–Brücke artifacts)
- **Accessibility**: Respects `prefers-reduced-motion` system setting
- **Best For**: Quality control, visual smoothness verification

#### 3. Matrix View ✅

- **Grid**: 15 lightness × 16 opacity steps
- **Cell Size**: Dynamic (40-120px) based on viewport
- **Background**: Selectable (6 presets)
- **Features**:
  - Match Mode: Highlight cells closest to target lightness
  - Heatmap: Visualize WCAG/APCA contrast levels
  - Fullscreen: Expand to fill screen
  - Zoom: 0.5x to 2x
- **Contrast Insights**: WCAG/APCA breakdown panel
- **Best For**: Opacity systems, alpha compositing, background variations

**Matrix View Cell Sizing:**

- Label column and cells use consistent sizing (40-120px range)
- Automatically calculates optimal size based on viewport dimensions
- Maintains aspect ratio for professional presentation
- Responsive to window resizing and fullscreen toggle

#### 4. Analysis View ✅

- **Delta Metrics**: ΔL*, ΔC*, ΔE\* (perceptual difference)
- **Accuracy Cards**: Average and maximum delta values
- **Detailed Table**: Step-by-step breakdown with:
  - Target vs. Actual lightness
  - Chroma and hue values
  - Contrast ratios (APCA & WCAG)
  - Gamut modification indicators
  - Click-to-copy hex values
- **Best For**: Quality assurance, technical review, documentation

### Accessibility Tools

| Tool                    | Purpose | Targets                          |
| ----------------------- | ------- | -------------------------------- |
| **Auto-Fix WCAG AA**    | ✅      | 4.5:1 normal, 3:1 large text     |
| **Auto-Fix WCAG AAA**   | ✅      | 7:1 normal, 4.5:1 large text     |
| **Auto-Fix APCA**       | ✅      | 75 Lc minimum                    |
| **Contrast Validation** | ✅      | Real-time pass/fail indicators   |
| **Threshold Presets**   | ✅      | Quick access to common standards |

**Auto-Fix Workflow:**

1. Select a scale with contrast issues
2. Choose target background (white/black/gray)
3. Click desired auto-fix button (WCAG AA/AAA/APCA)
4. Review improvements in Analysis view
5. Adjust chroma/curves if needed

**Validation Badges:**

- ✅ Green: Passes target threshold
- ⚠️ Yellow: Close to threshold
- ❌ Red: Fails threshold

### Export Formats

#### CSS Variables ✅

```css
--blue-98: oklch(98% 0.05 250); /* L: 98 | #f0f4ff */
--blue-96: oklch(96% 0.08 250); /* L: 96 | #e0e9ff */
/* ... */
```

- **Use Case**: Direct integration into stylesheets
- **Format**: Custom properties with OKLCH + hex fallbacks
- **Notes**: Includes actual lightness after P3 gamut mapping

#### JSON ✅

```json
{
  "blue-98": {
    "hex": "#f0f4ff",
    "oklch": "oklch(98% 0.05 250)",
    "p3": "color(display-p3 0.94 0.96 1)",
    "lightness": 98,
    "chroma": 0.05,
    "hue": 250
  }
}
```

- **Use Case**: Build tools, token transformers, databases
- **Format**: Complete color data with all formats
- **Includes**: Hex, OKLCH, P3, numeric values

#### Markdown ✅

```markdown
# Blue Scale

## blue-98

- **Hex**: #f0f4ff
- **OKLCH**: oklch(98% 0.05 250)
- **P3**: color(display-p3 0.94 0.96 1)
- **Lightness**: 98
```

- **Use Case**: Documentation, wikis, GitHub
- **Format**: Formatted text with headers and lists
- **Best For**: Team communication, design handoffs

#### W3C Design Tokens (DTCG) ✅

```json
{
  "blue.98": {
    "$type": "color",
    "$value": "#f0f4ff",
    "$description": "Blue 98"
  }
}
```

- **Use Case**: Design system tools, Figma Tokens Studio
- **Format**: W3C DTCG specification
- **Compatibility**: Style Dictionary, Theo, Tokens Studio

#### SVG Matrix ✨

- **Format**: Scalable vector graphic
- **Content**: Lightness × Opacity grid
- **Use Case**: Presentations, design reviews, print
- **Quality**: Resolution-independent

#### HTML Documentation ✨

- **Format**: Self-contained HTML file
- **Content**:
  - Complete color matrix
  - Contrast analysis
  - Usage guidelines
  - Interactive background toggle
- **Use Case**: Client presentations, team reviews

#### CSV ✨

- **Format**: Comma-separated values
- **Columns**: Step, Lightness, Hex, OKLCH, P3, Chroma, Hue, WCAG, APCA, Notes
- **Use Case**: Spreadsheets, data analysis, automation
- **Includes**: Precise WCAG ratios with rounding indicators

---

## Workflow Guide

### Creating Your First Scale

**Basic Workflow (5 minutes):**

1. **Create Project**

   - Open application
   - Default "My Project" is created automatically
   - Rename: Click project name → Edit

2. **Add Color Scale**

   - Click "+ Add Scale" in sidebar
   - Default scale "New Scale" appears
   - Rename: Click scale name in sidebar

3. **Configure Color**

   - **Hue**: Use rainbow slider (0-360°)
   - **Chroma**: Adjust saturation (0-0.4 typical range)
   - **Contrast Mode**: Choose based on use case
   - **Background**: Select target background color

4. **Review Results**

   - **Swatch View**: Check individual colors
   - **Gradient View**: Verify smooth transitions
   - **Analysis View**: Review metrics

5. **Export**
   - Click "Export" button
   - Choose format (CSS, JSON, Tokens, etc.)
   - Copy or download

### Advanced Workflows

#### Multi-Scale Design System

**Goal**: Create cohesive brand palette with primary, secondary, and neutral scales.

1. **Primary Accent**

   - Hue: Brand color (e.g., 220° for blue)
   - Chroma: 0.15-0.25 (vibrant but not overwhelming)
   - Mode: Standard (for vibrant UI colors)

2. **Secondary Accent**

   - Hue: Complementary or analogous (e.g., 280° for purple)
   - Chroma: 0.12-0.20 (slightly less vibrant)
   - Mode: Standard

3. **Neutral Scale**

   - Grayscale Profile: Cool Gray or Blue Gray
   - Chroma: 0.008-0.012 (subtle tint)
   - Mode: Luminance Matched

4. **Validation**

   - Use Matrix View to test on different backgrounds
   - Enable contrast thresholds (WCAG AA minimum)
   - Auto-fix any failing colors

5. **Export All**
   - Export → JSON → Include all scales
   - Export → CSS → Combine into single stylesheet

#### Achieving Specific Contrast Ratios

**Goal**: Create color that meets exact WCAG 4.5:1 on white background.

1. **Use WCAG Target Mode**

   - Select scale
   - Set Contrast Mode: "WCAG Target"
   - Set Target WCAG: 4.5
   - Set Background: white

2. **Adjust Hue/Chroma**

   - Fine-tune for brand alignment
   - WCAG ratio is maintained automatically

3. **Verify**
   - Check Analysis View for actual ratio
   - Test on Matrix View for opacity variations

#### Detecting and Fixing Banding

**Goal**: Ensure smooth color transitions without visual artifacts.

1. **Use Gradient View**

   - Switch to Gradient tab
   - Select "Linear" mode (172° angle)
   - Look for abrupt color shifts or visible bands

2. **Adjust Curves**

   - Open Curve Controls
   - Adjust Hue Power (try 0.8-1.2)
   - Adjust Chroma Power (try 1.2-1.5)

3. **Re-check**

   - Observe gradient smoothness
   - Compare with standard curves

4. **Advanced: Use Animated Mode**
   - Switch to "Animated" gradient
   - Observe how colors flow across the viewport
   - Smooth animation = good perceptual spacing

#### Dark Mode Color Systems

**Goal**: Create scales optimized for dark interfaces.

1. **Set Dark Background**

   - Select Background: "canvas-bg (E)" (black, L14)

2. **Adjust Lightness Preset**

   - Consider reversing scale order
   - Use High Contrast preset for better differentiation

3. **Increase Chroma for Dark Colors**

   - Dark colors (L20-40) benefit from higher chroma
   - Use Chroma Curve: Shift +0.05, Power 1.2

4. **Test Contrast**

   - Enable APCA threshold (60+ Lc)
   - Use Matrix View with dark background
   - Verify readability at low opacity

5. **Export Dark Mode Tokens**
   - Add `-dark` suffix to scale names
   - Export separately or combine with light mode

---

## Onboarding

### For Designers

#### 5-Minute Primer

**What You Need to Know:**

1. **OKLCH vs. HSL**

   - OKLCH is perceptually uniform (HSL is not)
   - Equal lightness steps look equally spaced
   - Consistent chroma across hues

2. **Lightness (L)**: 0-100 scale

   - L98: Near white
   - L50: Medium
   - L14: Near black

3. **Chroma (C)**: 0-0.4 typical range

   - C0: Gray
   - C0.05: Subtle color
   - C0.15: Moderate saturation
   - C0.25+: Highly saturated

4. **Hue (H)**: 0-360° color wheel
   - 0°: Red
   - 120°: Green
   - 240°: Blue

**Quick Win:**

- Create scale with Hue 220, Chroma 0.15
- Switch between contrast modes
- Export CSS and use in Figma

#### 30-Minute Deep Dive

**Learning Path:**

1. **Explore Presets** (5 min)

   - Try each lightness preset
   - Observe how step distribution changes
   - Note which preset feels most natural for your use case

2. **Contrast Modes** (10 min)

   - Create identical scale in each mode
   - Compare results in Analysis View
   - Notice how APCA Fixed maintains consistency

3. **Curve Controls** (10 min)

   - Adjust Hue Shift (-30 to +30)
   - Observe color temperature changes
   - Try Chroma Power (0.8 vs. 1.5)
   - See how saturation distribution changes

4. **Matrix View** (5 min)
   - Enable Match Mode
   - Set target to 60
   - See which opacity/lightness combos hit target
   - Perfect for opacity-based UI systems

#### Key Concepts for Designers

**Perceptual Uniformity**

- Equal numeric spacing = equal visual spacing
- Critical for predictable color systems
- OKLCH achieves this, HSL does not

**Gamut Mapping**

- Display P3 is wider than sRGB
- High-lightness + high-chroma may exceed P3
- Colors are automatically adjusted (clamped)
- Actual lightness shown in exports

**Contrast Thresholds**

- WCAG: Ratio-based (3:1, 4.5:1, 7:1)
- APCA: Perceptual contrast (Lc values 15-105)
- APCA is newer and more accurate

**Accessibility First**

- Always test contrast on target backgrounds
- Use auto-fix buttons for quick compliance
- Consider users with low vision

### For Developers

#### Integration Guide

**Installing Generated Tokens:**

```bash
# 1. Export CSS from Lumat-Color
# 2. Save to your project: src/styles/colors.css

/* colors.css */
:root {
  --blue-98: oklch(98% 0.05 250);
  --blue-96: oklch(96% 0.08 250);
  /* ... */
}

/* Use in components */
.primary-button {
  background: var(--blue-60);
  color: var(--blue-98);
}
```

**Using JSON Tokens:**

```typescript
// Import generated JSON
import colors from "./tokens/colors.json";

// Access programmatically
const primaryColor = colors["blue-60"].hex;
const oklchValue = colors["blue-60"].oklch;

// Use in styled-components
const Button = styled.button`
  background: ${colors["blue-60"].hex};
  color: ${colors["blue-98"].hex};
`;
```

**W3C Design Tokens + Style Dictionary:**

```bash
npm install style-dictionary
```

```javascript
// build-tokens.js
const StyleDictionary = require("style-dictionary");

const sd = StyleDictionary.extend({
  source: ["tokens/*.json"], // Lumat-Color exports
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "dist/",
      files: [
        {
          destination: "variables.css",
          format: "css/variables",
        },
      ],
    },
    js: {
      transformGroup: "js",
      buildPath: "dist/",
      files: [
        {
          destination: "tokens.js",
          format: "javascript/es6",
        },
      ],
    },
  },
});

sd.buildAllPlatforms();
```

#### API Reference

**Color Result Object:**

```typescript
interface ColorResult {
  oklch: string; // "oklch(98% 0.05 250)"
  cssP3: string; // "color(display-p3 0.94 0.96 1)"
  hex: string; // "#f0f4ff"
  rgba: string; // "rgba(240, 244, 255, 1)"
  hsla: string; // "hsla(225, 100%, 97%, 1)"
  L: number; // 0.98 (0-1 scale)
  C: number; // 0.05
  H: number; // 250
  contrast?: {
    apca: { onBlack: number; onWhite: number; onGray: number };
    wcag: { onBlack: number; onWhite: number; onGray: number };
    meetsAA: boolean;
    meetsAAA: boolean;
  };
  gamutInfo?: {
    chromaReduction: number;
    lightnessShift: number;
    wasModified: boolean;
  };
}
```

**Lightness Steps:**

```typescript
// Default 15-step scale
const DEFAULT_LIGHTNESS_STEPS = [
  98, 96, 93, 90, 85, 80, 70, 60, 48, 40, 32, 26, 20, 17, 14,
];

// Access in exports
const step98 = colors["blue-98"];
```

**Opacity Steps (Matrix View):**

```typescript
// Default 16-step opacity scale
const DEFAULT_OPACITY_STEPS = [
  100, 90, 80, 70, 60, 50, 40, 30, 20, 15, 12, 10, 7, 5, 3, 0,
];
```

#### Build Integration

**Automated Export:**

```bash
# Use CLI tools or scripts to automate token generation
# Lumat-Color is currently UI-based, but exports can be scripted

# Example: Export from project JSON
node scripts/export-tokens.js
```

**CI/CD Pipeline:**

```yaml
# .github/workflows/tokens.yml
name: Update Design Tokens

on:
  push:
    paths:
      - "design/colors/**"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build:tokens
      - run: npm run test:contrast
```

### For Design System Leads

#### Decision Framework

**When to Use Each Contrast Mode:**

| Use Case                  | Recommended Mode  | Reason                             |
| ------------------------- | ----------------- | ---------------------------------- |
| Brand accent colors       | Standard          | Maximum vibrancy, natural OKLCH    |
| Text on backgrounds       | APCA Fixed        | Consistent readability across hues |
| Neutral/gray scales       | Luminance Matched | Predictable brightness             |
| Specific WCAG requirement | WCAG Target       | Precise ratio control              |
| One-off accessible color  | APCA Target       | Quick accessibility fix            |

**Chroma Guidelines:**

| Color Purpose        | Chroma Range | Example                         |
| -------------------- | ------------ | ------------------------------- |
| Neutrals             | 0.005-0.015  | Subtle gray tints               |
| UI backgrounds       | 0.02-0.08    | Soft, non-distracting           |
| Interactive elements | 0.10-0.20    | Noticeable but not overwhelming |
| Brand accents        | 0.15-0.25    | Vibrant, attention-grabbing     |
| Status indicators    | 0.12-0.22    | Clear communication             |

**Lightness Preset Selection:**

- **Standard**: General-purpose, balanced distribution
- **High Contrast**: Accessibility-first, larger light/dark extremes
- **Subtle**: Minimal visual hierarchy, elegant
- **Extreme**: Maximum range, technical use cases

**Global Settings Strategy:**

1. **Enforce Global Lightness Scale**: ✅ Recommended

   - Ensures consistency across all color scales
   - Predictable token naming (blue-60, red-60 have same lightness)
   - Easier cross-scale contrast calculations

2. **Allow Per-Scale Override**: Use sparingly
   - Only for special cases (e.g., yellow requiring different distribution)
   - Document exceptions clearly
   - Consider impact on cross-scale relationships

#### Token Naming Conventions

**Recommended Patterns:**

```css
/* Semantic naming */
--color-primary-98
--color-primary-60
--color-primary-20

--color-neutral-98
--color-neutral-14

/* Role-based naming */
--color-brand-lightest
--color-brand-base
--color-brand-darkest

/* Context-based naming */
--color-background-primary
--color-text-primary
--color-border-subtle
```

**Avoid:**

- Hardcoded hex in names (--color-blue-f0f4ff)
- Vague qualifiers (--color-blue-light)
- Platform-specific names (--color-ios-blue)

#### Documentation Templates

**Color Scale Documentation:**

```markdown
# [Scale Name] Color Scale

**Purpose**: [Brief description]
**Contrast Mode**: [Mode name]
**Target Background**: [Background color]

## Specifications

- **Hue**: [0-360]°
- **Chroma**: [0-0.4]
- **Lightness Steps**: [15] steps from L[98] to L[14]

## Accessibility

- **WCAG AA**: [✅/❌] [X/15] colors pass on [background]
- **APCA Bronze (60 Lc)**: [✅/❌] [X/15] colors pass

## Use Cases

- **[Use Case 1]**: Use [scale-XX] for [purpose]
- **[Use Case 2]**: Use [scale-YY] for [purpose]

## Export

Generated: [Date]
Export Format: [CSS/JSON/Tokens]
```

---

## Changelog

### Version 1.0.0 (December 14, 2025)

**Initial Release** 🎉

#### Core Features Added

- ✅ OKLCH color space with Display P3 gamut support
- ✅ 15-step default lightness scale (customizable)
- ✅ 5 contrast modes (Standard, APCA Fixed, Luminance Matched, APCA Target, WCAG Target)
- ✅ Hue and chroma power curves with fine-tuning controls
- ✅ Grayscale profiles (True Gray, Warm Gray, Cool Gray, Blue Gray, Plum)
- ✅ 4 lightness presets (Standard, High Contrast, Subtle, Extreme)

#### Visualization Views

- ✅ Swatch View: Responsive grid with copy actions
- ✅ Gradient View: Linear (172°) and Animated (132°) modes with 7:5 aspect ratio
- ✅ Matrix View: 15×16 opacity grid with dynamic cell sizing (40-120px)
- ✅ Analysis View: Delta metrics, accuracy cards, detailed contrast table

#### Accessibility Tools

- ✅ Auto-fix buttons (WCAG AA, WCAG AAA, APCA)
- ✅ Real-time contrast validation
- ✅ Pass/fail indicators
- ✅ Threshold presets

#### Export Formats

- ✅ CSS Variables (OKLCH + hex comments)
- ✅ JSON (complete color data)
- ✅ Markdown (formatted documentation)
- ✅ W3C Design Tokens (DTCG format)
- ✅ SVG (matrix visualization)
- ✅ HTML (interactive documentation)
- ✅ CSV (spreadsheet-ready)

#### Project Management

- ✅ Multi-project support
- ✅ Project import/export (JSON)
- ✅ Scale CRUD operations
- ✅ Inline rename functionality
- ✅ LocalStorage persistence

#### UI/UX

- ✅ Radix UI Themes (complete rebuild)
- ✅ Dark mode optimized
- ✅ Three-column layout (Sidebar, ScaleView, ControlPanel)
- ✅ Responsive design
- ✅ Accessible components

#### Recent Updates (December 14, 2025)

**Matrix View Label Sizing Fix** 🔧

- Fixed: Label column now uses consistent sizing with matrix cells
- Improvement: Dynamic cell size calculation (40-120px range) based on viewport
- Enhancement: Better space utilization in fullscreen mode

**Gradient Mode Simplification** ✨

- Changed: Reduced from 4 modes to 2 modes (Linear, Animated)
- Rationale: Simplified UI for core use case (banding detection)
- Improvement: 7:5 aspect ratio for consistent display
- Feature: Respects `prefers-reduced-motion` system setting

---

## Troubleshooting

### Common Issues

#### Colors Look Different in Figma

**Problem**: Exported colors don't match Lumat-Color display
**Cause**: Color space mismatch (sRGB vs P3)
**Solution**:

- Use P3 export format
- Enable P3 color management in Figma (Settings → Color Space → Display P3)
- Note: Figma's default is sRGB

#### High Lightness Colors Are Darker Than Expected

**Problem**: L98 exports as L96 after gamut mapping
**Cause**: P3 gamut limits for high-lightness + high-chroma combinations
**Solution**:

- This is expected behavior for wide gamut
- Reduce chroma for lighter colors
- Check Analysis View for actual lightness values
- Exports include both intended and actual lightness

#### Auto-Fix Button Does Nothing

**Problem**: Clicking auto-fix doesn't change colors
**Cause**: Scale may already meet threshold
**Solution**:

- Check Analysis View for current contrast ratios
- Ensure target background is set correctly
- Try different threshold (AA vs AAA)
- Some scales may be at optimal settings

#### Gradient Shows Banding

**Problem**: Visible color bands in Gradient View
**Cause**: Insufficient steps or non-optimal curves
**Solution**:

- Increase lightness steps (use Extreme preset)
- Adjust Hue/Chroma curves (try Power 1.2)
- Reduce chroma slightly
- Note: Some banding is unavoidable with limited steps

#### Matrix View Cells Too Small/Large

**Problem**: Matrix cells not at comfortable size
**Cause**: Automatic sizing based on viewport
**Solution**:

- Use Zoom controls (0.5x to 2x)
- Toggle fullscreen mode
- Resize browser window
- Cells dynamically adjust between 40-120px

#### Export Button Disabled

**Problem**: Cannot export scale
**Cause**: No scale selected or scale has errors
**Solution**:

- Ensure a scale is selected in sidebar
- Check for error messages in UI
- Verify scale has valid hue/chroma values

### Browser-Specific Issues

#### Safari: Colors Look Washed Out

**Cause**: P3 color profile handling
**Solution**: Enable "Color LCD" in Display preferences

#### Firefox: OKLCH Syntax Error in DevTools

**Cause**: Firefox OKLCH support varies by version
**Solution**:

- Update to Firefox 113+
- Use hex fallbacks in production CSS

#### Chrome: Copy to Clipboard Fails

**Cause**: Browser security restrictions
**Solution**:

- Ensure HTTPS (or localhost)
- Check browser permissions

---

## Browser Support

### Recommended Browsers

| Browser     | Minimum Version | P3 Support | OKLCH Support | Notes                                         |
| ----------- | --------------- | ---------- | ------------- | --------------------------------------------- |
| **Chrome**  | 111+            | ✅         | ✅            | Full support                                  |
| **Safari**  | 15+             | ✅         | ✅            | Native P3, requires macOS/iOS with P3 display |
| **Firefox** | 113+            | ✅         | ✅            | Full support                                  |
| **Edge**    | 111+            | ✅         | ✅            | Chromium-based                                |

### Feature Availability

| Feature           | Chrome | Safari | Firefox | Edge |
| ----------------- | ------ | ------ | ------- | ---- |
| OKLCH Color Space | 111+   | 15+    | 113+    | 111+ |
| Display P3 Gamut  | 79+    | 10+    | 101+    | 79+  |
| CSS Variables     | ✅     | ✅     | ✅      | ✅   |
| Clipboard API     | ✅     | 13.1+  | 63+     | ✅   |
| Local Storage     | ✅     | ✅     | ✅      | ✅   |

### Fallback Strategy

**For older browsers:**

```css
/* Hex fallback */
.element {
  background: #f0f4ff; /* Fallback */
  background: oklch(98% 0.05 250); /* Modern browsers */
}

/* sRGB fallback */
.element {
  background: rgb(240, 244, 255); /* Fallback */
  background: color(display-p3 0.94 0.96 1); /* P3 browsers */
}
```

---

## Resources

### Color Science

- [OKLCH Color Space Explained](https://oklch.com/)
- [Display P3 vs sRGB](https://webkit.org/blog/10042/wide-gamut-color-in-css-with-display-p3/)
- [Perceptual Uniformity](https://programmingdesignsystems.com/color/perceptually-uniform-color-spaces/)

### Accessibility

- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [APCA (Accessible Perceptual Contrast Algorithm)](https://github.com/Myndex/SAPC-APCA)
- [APCA Documentation](https://git.apcacontrast.com/documentation)

### Design Tokens

- [W3C Design Tokens Community Group](https://design-tokens.github.io/community-group/)
- [DTCG Specification](https://tr.designtokens.org/format/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Figma Tokens Studio](https://tokens.studio/)

### Tools & Libraries

- [Culori](https://culorijs.org/) - Color manipulation library
- [Radix UI Themes](https://www.radix-ui.com/themes) - UI component library
- [Vite](https://vitejs.dev/) - Build tool
- [Zustand](https://zustand-demo.pmnd.rs/) - State management

### Related Projects

- **Ink Alchemist**: Token-based color system manager
- **LOMAT**: Matrix-focused opacity tool
- **Luma**: Original Lumat prototype

---

## Support

For issues, feature requests, or questions:

1. Check Troubleshooting section
2. Review Browser Support
3. Contact: cody.fitzgerald@[domain]

---

**Last Updated**: December 14, 2025
**Version**: 1.0.0
**Author**: Cody Fitzgerald
