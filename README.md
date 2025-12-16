# Lumat-Radix

> Professional color scale designer using OKLCH color space with Display P3 gamut support and advanced contrast modes

**A modern tool for creating perceptually uniform color systems with accessibility built-in.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

---

## Overview

Lumat-Radix is a professional-grade color scale designer that generates perceptually uniform color palettes using the OKLCH color space. Built with React, TypeScript, and Radix UI Themes, it provides designers and developers with powerful tools to create accessible, harmonious color systems for modern interfaces.

## Key Features

### ⚡ Performance Optimizations (Phase 1 Complete)

- **LUT Gamma Correction**: 5× faster sRGB ↔ Linear RGB conversions using Float32Array lookup tables
- **Memoization Cache**: 5-10× faster color generation with LRU cache (1000 entries, 80-95% hit rate)
- **60fps Interactions**: Matrix View renders in 46ms (down from 230ms), sliders run at 7ms/frame
- **Progressive Enhancement**: Display P3 with automatic sRGB fallbacks (99% browser compatibility)
- **Smart Invalidation**: Automatic cache clearing on settings changes

### 🎨 Advanced Color Generation

- **OKLCH Color Space**: Perceptually uniform color generation for consistent visual spacing
- **Display P3 Gamut**: Wide color gamut support for vibrant, modern colors
- **5 Contrast Modes**: Standard, APCA Fixed, Luminance Matched, APCA Target, WCAG Target
- **Power Curves**: Fine-tune hue and chroma progression with shift and power controls
- **Grayscale Profiles**: 5 neutral profiles (True Gray, Warm, Cool, Blue, Plum)

### ♿ Accessibility First

- **WCAG & APCA**: Dual contrast calculation methods
- **Auto-Fix Tools**: One-click compliance with WCAG AA/AAA and APCA standards
- **Real-Time Validation**: Pass/fail indicators on all colors
- **Threshold Presets**: Quick access to common accessibility standards

### 📊 Professional Visualizations

- **Swatch View**: Responsive grid with copy actions (hex, OKLCH, P3)
- **Gradient View**: Linear and animated modes for banding detection
- **Matrix View**: 15×16 opacity grid with dynamic sizing, match mode, heatmaps
- **Analysis View**: Delta metrics (ΔE, ΔL*, ΔC*), accuracy cards, detailed tables

### 📤 Multiple Export Formats

- **CSS Variables**: OKLCH with hex fallbacks + Progressive P3 enhancement
- **JSON**: Complete color data with contrast info
- **Markdown**: Formatted documentation
- **W3C Design Tokens**: DTCG-compliant format
- **SVG/HTML/CSV**: Presentation and analysis formats
- **Tailwind/SCSS/Less**: Framework-specific exports

### 🛠️ Accessibility Tools (Phase 1)

- **Minimum Opacity Calculator**: Find minimum opacity to meet APCA Lc targets (interactive slider 30-106)
- **Contrast Heatmap**: Visual overlay showing pass/fail status in Matrix View (green/blue/yellow/red)
- **Real-Time Feedback**: Instant validation as you adjust colors

## Quick Start

### Prerequisites

- **Node.js 22+** (for development server)
- **Node.js 18.16.0+** (for production builds)
- Modern browser with P3 support (Chrome 111+, Safari 15+, Firefox 113+)

### Installation

\`\`\`bash

# Clone or navigate to the repository

cd lumat-radix

# Install dependencies

npm install

# Start development server

npm run dev

# Build for production

npm run build

# Preview production build

npm run preview
\`\`\`

The application will open at \`http://localhost:5173\` (default Vite port).

## Technology Stack

| Technology          | Version | Purpose                 |
| ------------------- | ------- | ----------------------- |
| **React**           | 19.2.0  | UI framework            |
| **TypeScript**      | 5.9.3   | Type safety             |
| **Vite**            | 7.2.4   | Build tool & dev server |
| **Radix UI Themes** | 3.2.1   | Component library       |
| **Zustand**         | 5.0.9   | State management        |
| **Culori**          | 4.0.2   | Color manipulation      |
| **APCA-W3**         | 0.1.9   | Accessibility contrast  |

## Usage

### Creating a Color Scale

1. **Add Scale**: Click "+ Add Scale" in the sidebar
2. **Configure**:
   - Adjust hue (0-360°) and chroma (0-0.4)
   - Select contrast mode
   - Choose target background
3. **Fine-Tune**: Use curve controls for hue/chroma progression
4. **Validate**: Check contrast in Analysis view
5. **Export**: Choose format and download/copy

### Contrast Modes Explained

- **Standard**: Pure OKLCH generation, ideal for vibrant brand colors
- **APCA Fixed**: Consistent text contrast across all hues
- **Luminance Matched**: Grayscale-consistent colors for neutrals
- **APCA Target**: Generate single color for specific APCA Lc value
- **WCAG Target**: Generate single color for specific WCAG ratio

### Export Workflow

\`\`\`bash

# 1. Export CSS Variables

--blue-98: oklch(98% 0.05 250); /_ #f0f4ff _/
--blue-60: oklch(60% 0.15 250); /_ #5b87ff _/

# 2. Use in your project

.button {
background: var(--blue-60);
color: var(--blue-98);
}
\`\`\`

## Documentation

📖 **[Full Documentation](./docs/DOCUMENTATION.md)**

Comprehensive guides covering:

- **Quick Start**: Installation and first scale ([Quick Start Guide](./docs/PHASE_1_QUICK_START.md))
- **Features**: Detailed feature catalog ([All Phases Complete](./docs/ALL_PHASES_COMPLETE.md))
- **Workflow Guide**: Common workflows and best practices
- **Onboarding**: Role-specific guides (Designers, Developers, Design System Leads)
- **Changelog**: Version history and updates ([Changelog](./docs/CHANGELOG.md))
- **Troubleshooting**: Common issues and solutions

## Project Structure

\`\`\`
lumat-radix/
├── src/
│ ├── components/ # React components
│ │ ├── Sidebar.tsx # Project/scale navigation
│ │ ├── ControlPanel.tsx # Color configuration
│ │ ├── ScaleView.tsx # View container
│ │ ├── Swatch.tsx # Color display
│ │ ├── GradientVisualization.tsx # Gradient modes
│ │ ├── MatrixView.tsx # Opacity matrix
│ │ ├── MatrixCell.tsx # Matrix cell logic
│ │ ├── AnalysisView.tsx # Delta analysis
│ │ ├── ExportModal.tsx # Export formats
│ │ ├── CurveControls.tsx # Fine-tuning
│ │ └── ... # Additional components
│ ├── utils/ # Core logic (100% preserved)
│ │ ├── colorEngine.ts # OKLCH generation, P3 gamut
│ │ ├── contrast.ts # APCA & WCAG calculations
│ │ ├── autoFix.ts # Accessibility auto-correction
│ │ ├── deltaAnalysis.ts # Perceptual metrics
│ │ └── ... # Additional utilities
│ ├── store/
│ │ └── useAppStore.ts # Zustand state + localStorage
│ ├── types/
│ │ └── index.ts # TypeScript definitions
│ ├── App.tsx # Main application
│ └── main.tsx # Entry point
├── docs/ # All documentation
│ ├── DOCUMENTATION.md # Comprehensive guide
│ ├── CHANGELOG.md # Version history
│ ├── PROJECT*COMPLETE.md # Technical details
│ ├── ALL_PHASES_COMPLETE.md # Feature catalog
│ ├── PHASE_1*\*.md # Phase 1 documentation
│ └── QUICK_REFERENCE.md # Quick reference
├── package.json
├── vite.config.ts
└── README.md # This file
\`\`\`

## Development

### Commands

\`\`\`bash
npm run dev # Start dev server (Node 22+)
npm run build # Build for production
npm run preview # Preview production build
npm run lint # Run ESLint
\`\`\`

### Build Output

\`\`\`bash
✓ 461 modules transformed
dist/index.html 0.46 kB │ gzip: 0.30 kB
dist/assets/index-ChKJSpOQ.css 689.20 kB │ gzip: 81.03 kB
dist/assets/index-C18sCHEN.js 503.89 kB │ gzip: 154.78 kB
✓ built in 1.07s
\`\`\`

## Browser Support

| Browser | Minimum Version | Notes                         |
| ------- | --------------- | ----------------------------- |
| Chrome  | 111+            | Full support (OKLCH + P3)     |
| Safari  | 15+             | Full support (native P3)      |
| Firefox | 113+            | Full support                  |
| Edge    | 111+            | Full support (Chromium-based) |

## Contributing

Contributions welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Culori**: Excellent color manipulation library
- **Radix UI**: Accessible component primitives
- **APCA**: Modern contrast algorithm by Myndex
- **W3C Design Tokens Community Group**: Token specification standards

## Links

- **Documentation**: [DOCUMENTATION.md](docs/DOCUMENTATION.md)
- **Changelog**: [CHANGELOG.md](docs/CHANGELOG.md)
- **Technical Details**: [PROJECT_COMPLETE.md](docs/PROJECT_COMPLETE.md)
- **Quick Reference**: [QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)

---

**Built with** ❤️ **by Cody Fitzgerald**
**Version**: 0.17.3 | **Last Updated**: December 14, 2025
