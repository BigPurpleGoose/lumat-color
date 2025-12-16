# Changelog

All notable changes to the Lumat-Radix project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-12-14

### 🎉 Initial Release

**Lumat-Radix v1.0.0** - Complete rebuild of the Lumat color scale designer using Radix UI Themes. This release marks the transition from Tailwind CSS to a fully Radix-based component architecture while preserving 100% of the original color generation logic.

### Added

#### Core Color Engine

- **OKLCH Color Space**: Perceptually uniform color generation with Display P3 gamut support
- **Power Curves**: Hue and chroma curve controls with shift (-180° to +180°, -0.2 to +0.2) and power (0.5 to 2.0) adjustments
- **Binary Search Gamut Mapping**: Maintains exact target lightness while finding closest in-gamut color
- **Gamut Tracking**: Detailed gamut modification info (chroma reduction, lightness shift, wasModified flag)

#### Contrast Modes

- **Standard Mode**: Direct OKLCH generation for vibrant UI colors
- **APCA Fixed Mode**: Target APCA Lc values (105, 100, 95, 90, 85, 80, 75, 70, 60, 50, 40, 30, 20, 15, 10) with binary search
- **Luminance Matched Mode**: Grayscale-consistent colors with maintained hue/chroma
- **APCA Target Mode**: Single-color generation for specific APCA Lc against background
- **WCAG Target Mode**: Single-color generation for specific WCAG ratio against background

#### Lightness Presets

- **Standard** (15 steps): 98, 96, 93, 90, 85, 80, 70, 60, 48, 40, 32, 26, 20, 17, 14
- **High Contrast** (13 steps): 98, 94, 88, 82, 75, 68, 60, 48, 36, 28, 22, 16, 12
- **Subtle** (11 steps): 97, 94, 90, 85, 78, 70, 62, 54, 46, 38, 30
- **Extreme** (19 steps): 99, 98, 96, 93, 90, 85, 80, 70, 60, 50, 40, 32, 26, 20, 17, 14, 11, 8, 5

#### Grayscale Profiles

- **True Gray**: Pure achromatic (H0, C0)
- **Warm Gray**: Yellow-orange tint (H40, C0.008)
- **Cool Gray**: Blue tint (H220, C0.008)
- **Blue Gray**: Pronounced blue for slate (H240, C0.012)
- **Plum Gray**: Purple tint for sophistication (H280, C0.015)

#### Visualization Views

**Swatch View**

- Responsive grid layout (auto-fill, 120px minimum columns)
- Display: Hex codes, OKLCH values, lightness labels
- Copy actions: Hex, OKLCH, P3 CSS formats
- Contrast indicators when threshold enabled
- Hover overlay with detailed color information

**Gradient View**

- **Linear Mode**: 172° angled gradient for banding detection
- **Animated Mode**: 132° animated gradient with smooth position transitions
- 7:5 aspect ratio for consistent display across viewports
- Respects `prefers-reduced-motion` system setting
- Purpose: Detect color banding (Bezold–Brücke artifacts)

**Matrix View**

- 15 lightness × 16 opacity grid (default scales)
- Dynamic cell sizing: 40-120px range based on viewport dimensions
- Opacity blending with OKLCH alpha compositing
- Match Mode: Highlight cells closest to target lightness
- Heatmap overlay: Visualize WCAG/APCA contrast levels
- Fullscreen mode with responsive calculations
- Zoom controls: 0.5x to 2x
- Tooltips with hex, contrast data, lightness, opacity
- Click-to-copy functionality on all cells
- Contrast Insights panel: WCAG/APCA breakdown by compliance level

**Analysis View**

- Delta metrics: ΔL* (lightness), ΔC* (chroma), ΔE\* (perceptual difference)
- Accuracy cards: Average and maximum delta values
- Color ramp pills: Visual preview of scale progression
- Detailed table with columns:
  - Step number
  - Target vs. Actual lightness
  - ΔL*, ΔC*, ΔE\* values
  - Contrast data (APCA & WCAG vs. backgrounds)
  - Gamut indicators (wasModified badges, chroma reduction, lightness shift)
  - Click-to-copy hex values

#### Accessibility Tools

- **Auto-Fix WCAG AA**: Target 4.5:1 normal text, 3:1 large text
- **Auto-Fix WCAG AAA**: Target 7:1 normal text, 4.5:1 large text
- **Auto-Fix APCA**: Target 75 Lc minimum (Bronze standard)
- **Contrast Validation**: Real-time pass/fail indicators
- **Threshold Presets**: Quick access to WCAG AA/AAA, APCA Bronze/Silver/Gold
- **Preset Selector**: Apply accessibility profiles to entire scale

#### Export Formats

**CSS Variables**

- Custom properties with OKLCH values
- Hex fallback in comments
- Includes intended vs. actual lightness notes
- Contrast ratios in comments (when available)

**JSON**

- Complete color data structure
- Fields: hex, oklch, p3, lightness, chroma, hue
- Contrast ratios (APCA & WCAG on black/white/gray)
- Gamut modification tracking
- Curve parameters

**Markdown**

- Formatted documentation with headers
- Color swatches with bullet lists
- Technical specifications
- Usage guidelines

**W3C Design Tokens (DTCG)**

- `$type: "color"` format
- `$value`: hex color
- `$description`: human-readable label
- Compatible with Figma Tokens Studio, Style Dictionary, Theo

**SVG Matrix**

- Scalable vector graphic
- Lightness × Opacity grid
- Resolution-independent for presentations
- Rounded corners, proper gaps, labels

**HTML Documentation**

- Self-contained HTML file
- Embedded styles
- Interactive background toggle
- Contrast matrix
- Usage guidelines
- Accessibility analysis

**CSV**

- Spreadsheet-ready format
- Columns: Step, Lightness, Hex, OKLCH, P3, Chroma, Hue, WCAG, WCAG Precise, APCA, Rounding Note
- Precise WCAG ratios with rounding indicators (\* for 2-decimal, † for 3-decimal)

#### Project Management

- **Multi-Project Support**: Create, rename, delete, switch between projects
- **Project Import/Export**: JSON backup/restore with timestamps
- **Scale CRUD Operations**: Add, rename, delete color scales
- **Inline Rename**: Click scale name to edit directly
- **Active Project Indicator**: Badge showing current project
- **Formatted Dates**: MMM DD, YYYY HH:MM format
- **Minimum Protection**: Cannot delete last project
- **LocalStorage Persistence**: Auto-save all changes

#### Global Settings

- **Enforce Global Lightness Scale**: Checkbox to apply same steps to all scales
- **Allow Per-Scale Override**: Conditional checkbox for exceptions
- **Lightness Steps**: Dynamic array with add/remove buttons, auto-sorts descending
- **Opacity Steps**: Same structure for matrix view opacity scale
- **Reset to Defaults**: One-click restore factory settings
- **Current Range Display**: Shows min-max lightness/opacity values

#### UI/UX

- **Radix UI Themes**: Complete component library (Dialog, Tabs, Table, Card, Badge, ScrollArea, Accordion, Button, TextField, Slider, Select, Switch)
- **Radix UI React Icons**: Consistent icon set
- **Dark Mode**: Optimized for dark theme (Indigo accent, Slate gray base, 95% scaling)
- **Three-Column Layout**: Sidebar (256px), ScaleView (flex: 1), ControlPanel (400px)
- **Responsive Borders**: Subtle separators between columns
- **Overflow Handling**: ScrollArea for long content
- **Professional Aesthetic**: Consistent spacing, typography, colors
- **Accessible Components**: ARIA labels, keyboard navigation, focus management

### Changed

#### December 14, 2025 Updates

**Matrix View Label Sizing Fix**

- **Fixed**: Label column width now matches matrix cell size (40-120px)
- **Improvement**: Label column uses same dynamic sizing calculation as cells
- **Enhancement**: Better visual alignment and consistency
- **Impact**: More professional appearance, especially in fullscreen mode

**Gradient Mode Simplification**

- **Changed**: Reduced from 4 gradient modes to 2 modes
- **Modes**: Linear (172°), Animated (132° with animation)
- **Rationale**: Core use case is banding detection; 2 modes cover this effectively
- **Removed**: Horizontal and Radial modes (rarely used)
- **Improvement**: Simpler UI, clearer purpose
- **Aspect Ratio**: Fixed at 7:5 for consistent display

### Technical Details

#### Build System

- **Vite**: 7.2.4 (fast dev server, optimized builds)
- **TypeScript**: 5.9.3 (strict mode, full type coverage)
- **ESLint**: 9.39.1 (code quality enforcement)
- **Bundle Size**: 503KB JS (154KB gzipped), 689KB CSS (81KB gzipped)
- **Build Time**: ~1 second (461 modules)

#### Dependencies

- **React**: 19.2.0
- **React DOM**: 19.2.0
- **Radix UI Themes**: 3.2.1
- **Radix UI React Icons**: 1.3.2
- **Zustand**: 5.0.9 (state management)
- **Culori**: 4.0.2 (color manipulation)
- **APCA-W3**: 0.1.9 (accessibility contrast)

#### Logic Layer (100% Preserved)

- `colorEngine.ts` (20KB): OKLCH generation, power curves, gamut mapping
- `contrast.ts`: APCA & WCAG calculations
- `opacityBlending.ts`: Alpha compositing in OKLCH
- `contrastValidator.ts`: Threshold validation
- `autoFix.ts`: Automated contrast fixes
- `deltaAnalysis.ts`: ΔE, ΔL*, ΔC* metrics
- `documentationExport.ts`: Matrix generation, usage guidelines
- `constants.ts`: Presets, backgrounds, profiles
- `types/index.ts`: Complete TypeScript definitions
- `store/useAppStore.ts` (10KB): Zustand with localStorage persistence
- `hooks/useContrastAnalysis.ts`: Memoized contrast analysis

### Fixed

- Matrix view label column sizing now consistent with cell size
- Gradient view simplified for clearer user intent
- Component integrity verified across all views
- TypeScript compilation errors resolved
- Export functionality tested and validated
- Persistence/storage migration functions implemented

### Notes

**Node Version Requirements:**

- Development server requires Node 20.19+ (Vite dev server)
- Production builds work with Node 18.16.0+

**Browser Compatibility:**

- Chrome 111+: Full OKLCH and P3 support
- Safari 15+: Full OKLCH and P3 support (native P3 on macOS/iOS)
- Firefox 113+: Full OKLCH and P3 support
- Edge 111+: Full OKLCH and P3 support (Chromium-based)

**Migration from Original Lumat:**

- 100% backward compatible logic layer
- Same Zustand store structure with localStorage
- Identical TypeScript interfaces
- All features preserved (curves, contrast modes, auto-fix, export, etc.)
- UI library changed: Radix UI Themes replaces Tailwind CSS
- Icons changed: @radix-ui/react-icons replaces Lucide
- Components rebuilt with Radix primitives
- Styling uses inline styles + Radix theme tokens (no Tailwind classes)

---

## [Unreleased]

### Planned Features

- **Batch Export**: Export multiple scales to single file with organized structure
- **Custom Preset Creator**: Save custom lightness distributions with name/description
- **Figma Variables Import**: Direct import from Figma Variables JSON format
- **Color Blindness Simulation**: Preview scales with deuteranopia, protanopia, tritanopia filters
- **Scale Comparison View**: Side-by-side comparison of multiple scales
- **Historical Tracking**: Project-level undo/redo with timeline view
- **Token Naming Templates**: Customizable export naming patterns (BEM, SUIT, custom)
- **Tailwind Config Export**: Direct export to tailwind.config.js format
- **SCSS Variables Export**: Export as SCSS/Sass variables with nesting
- **CLI Tool**: Headless token generation for build pipelines
- **REST API**: HTTP API for programmatic color generation

### Under Consideration

- **Multi-Scale Harmony Checker**: Validate color relationships across multiple scales
- **Multi-Stop Gradients**: Generate CSS gradients with custom stop positions
- **Palette Extraction**: Extract color scales from uploaded images
- **Real-Time Collaboration**: Multiplayer editing with WebSocket sync
- **Cloud Sync**: Cross-device project synchronization
- **Plugin System**: Custom exporters and transformation hooks
- **Analytics Dashboard**: Usage statistics, popular presets, accessibility trends
- **Design Tool Plugins**: Official Figma plugin, Sketch plugin integration
- **Contrast Matrix Heatmap Export**: Export heatmap visualization as PNG/SVG
- **A11y Report Generator**: PDF accessibility compliance reports
- **Variable Fonts Support**: Color scales for variable font weight/width axes
- **Animation Curve Generator**: Export color animation keyframes for CSS/JS

### Known Limitations

- No CLI tool yet (UI-only workflow)
- Project export requires manual download (no auto-sync)
- Matrix view limited to 15×16 grid (performance constraint)
- Gradient view shows banding with <10 steps (mathematical limitation)
- No undo/redo within single scale editing session
- Export naming not customizable (follows standard pattern)

---

## Version Format

**MAJOR.MINOR.PATCH**

- **MAJOR**: Incompatible API changes, breaking changes
- **MINOR**: New features, backward-compatible
- **PATCH**: Bug fixes, backward-compatible

### Examples

- `1.0.0` → `1.0.1`: Bug fix (patch)
- `1.0.1` → `1.1.0`: New export format added (minor)
- `1.1.0` → `2.0.0`: Color engine API changed (major, breaking)

---

**Maintained by**: Cody Fitzgerald
**Repository**: lumat-radix
**License**: MIT
