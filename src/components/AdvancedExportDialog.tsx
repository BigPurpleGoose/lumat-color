import React, { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Dialog,
  Switch,
  Tabs,
  Code,
  ScrollArea,
  Badge,
  Table,
  Card,
  Grid,
  Slider,
} from "@radix-ui/themes";
import {
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  Cross2Icon,
  OpenInNewWindowIcon,
} from "@radix-ui/react-icons";
import { converter } from "culori";
import type { ColorScale } from "../types";
import type { ColorResult } from "../utils/colorEngine";
import { useAppStore } from "../store/useAppStore";
import {
  generateColorMatrix,
  generateHTMLDocumentation,
  generateContrastMatrix,
  generateUsageGuidelines,
} from "../utils/documentationExport";
import { calculateAPCA, calculateWCAG } from "../utils/contrast";
import { generateCSSWithFallbacks } from "../utils/cssExport";
import { BACKGROUND_PRESETS, WCAG_THRESHOLDS } from "../utils/constants";

const toOklch = converter("oklch");

type ExportFormat =
  | "css"
  | "scss"
  | "tailwind"
  | "json"
  | "markdown"
  | "tokens"
  | "svg"
  | "html"
  | "csv"
  | "swiftui"
  | "figma";

type PreviewMode =
  | "swatches"
  | "guidelines"
  | "contrast"
  | "matrix"
  | "report"
  | "code";

interface AdvancedExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scale: ColorScale;
  colors: ColorResult[];
}

/**
 * Advanced Export Dialog
 *
 * Comprehensive export options for multiple formats and frameworks
 */
export const AdvancedExportDialog: React.FC<AdvancedExportDialogProps> = ({
  isOpen,
  onClose,
  scale,
  colors,
}) => {
  const { globalSettings } = useAppStore();
  const backgroundPresets =
    globalSettings.backgroundPresets || BACKGROUND_PRESETS;

  // Helper function to get background preset with legacy value mapping
  const getBackgroundPreset = (targetBgName?: string) => {
    if (!targetBgName) return backgroundPresets[0]; // Default to first preset

    // Try direct match first
    let preset = backgroundPresets.find((p) => p.name === targetBgName);

    // Fallback mapping for legacy targetBackground values
    if (!preset) {
      const legacyMap: Record<string, string> = {
        "canvas-bg": "white",
        "canvas-bg-lv1": "light1",
        "canvas-bg-lv2": "light2",
        "canvas-bg (E2)": "dark1",
        "canvas-bg (E)": "contrast",
      };
      const mappedName = legacyMap[targetBgName as keyof typeof legacyMap];
      if (mappedName) {
        preset = backgroundPresets.find((p) => p.name === mappedName);
      }
    }

    return preset || backgroundPresets[0]; // Fallback to first preset
  };

  const [activeFormat, setActiveFormat] = useState<ExportFormat>("html");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("swatches");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeP3, setIncludeP3] = useState(true);
  const [copied, setCopied] = useState(false);

  // Contrast filtering state
  const [useAPCAFilter, setUseAPCAFilter] = useState(true);
  const [minAPCA, setMinAPCA] = useState(30);
  const [maxAPCA, setMaxAPCA] = useState(120);
  const [minWCAG, setMinWCAG] = useState(1);
  const [maxWCAG, setMaxWCAG] = useState(21);
  const [showAllPairs, setShowAllPairs] = useState(true);

  const { getLightnessSteps } = useAppStore();
  const lightnessSteps = getLightnessSteps(scale);

  // Get valid export formats for current preview mode
  const getValidFormats = (): ExportFormat[] => {
    switch (previewMode) {
      case "swatches":
        return ["html", "svg", "markdown"];
      case "guidelines":
        return ["html", "markdown"];
      case "contrast":
        return ["html", "csv", "markdown"];
      case "matrix":
        return ["html", "svg", "markdown"];
      case "report":
        return ["html", "markdown"];
      case "code":
        return [
          "css",
          "scss",
          "tailwind",
          "json",
          "tokens",
          "swiftui",
          "figma",
          "markdown",
        ];
      default:
        return ["html", "markdown"];
    }
  };

  const validFormats = getValidFormats();

  // Auto-select valid format when preview mode changes
  React.useEffect(() => {
    if (!validFormats.includes(activeFormat)) {
      setActiveFormat(validFormats[0]);
    }
  }, [previewMode, validFormats, activeFormat]);

  // Get background based on scale's targetBackground
  const bg = useMemo(() => {
    const preset = getBackgroundPreset(scale.targetBackground);
    return preset;
  }, [scale.targetBackground]);

  // Convert background to OKLCH using preset lightness for accuracy
  const bgColor = useMemo(() => {
    const bgOklch = toOklch(bg.color as any);
    if (!bgOklch) {
      // Fallback: use preset lightness directly
      return { mode: "oklch" as const, l: bg.lightness / 100, c: 0, h: 0 };
    }
    return {
      mode: "oklch" as const,
      l: bgOklch.l,
      c: bgOklch.c || 0,
      h: bgOklch.h || 0,
    };
  }, [bg]);

  const generateCSS = () => {
    if (includeMetadata) {
      return generateCSSWithFallbacks(scale, colors, lightnessSteps, {
        includeP3Fallbacks: includeP3,
        includeComments: true,
        includeLightnessNotes: true,
      });
    }

    // Simple version without metadata
    const scaleName = scale.name.toLowerCase().replace(/\s+/g, "-");
    let css = ":root {\n";
    colors.forEach((color, index) => {
      const step = lightnessSteps[index];
      css += `  --${scaleName}-${step}: ${color.hex};\n`;
      if (includeP3 && color.cssP3) {
        css += `  --${scaleName}-${step}-p3: ${color.cssP3};\n`;
      }
    });
    css += "}\n";
    return css;
  };

  const generateSCSS = () => {
    const scaleName = scale.name.toLowerCase().replace(/\s+/g, "-");
    let scss = includeMetadata
      ? `// ${scale.name} - Generated by Lumat Radix\n` +
        `// Hue: ${scale.hue}° | Chroma: ${(scale.manualChroma || 0).toFixed(
          2
        )} | Mode: ${scale.contrastMode}\n\n`
      : "";

    colors.forEach((color, index) => {
      const step = lightnessSteps[index];
      scss += `$${scaleName}-${step}: ${color.hex};\n`;

      if (includeP3 && color.cssP3) {
        scss += `$${scaleName}-${step}-p3: ${color.cssP3};\n`;
      }
    });

    return scss;
  };

  const generateTailwind = () => {
    const scaleName = scale.name.toLowerCase().replace(/\s+/g, "-");
    let config = includeMetadata
      ? `// ${scale.name} - Generated by Lumat Radix\n` +
        `// Add to tailwind.config.js\n\n`
      : "";

    config += `module.exports = {\n`;
    config += `  theme: {\n`;
    config += `    extend: {\n`;
    config += `      colors: {\n`;
    config += `        ${scaleName}: {\n`;

    colors.forEach((color, index) => {
      const step = lightnessSteps[index];
      config += `          ${step}: '${color.hex}',\n`;
    });

    config += `        },\n`;
    config += `      },\n`;
    config += `    },\n`;
    config += `  },\n`;
    config += `}\n`;

    return config;
  };

  const generateJSON = () => {
    const scaleName = scale.name.toLowerCase().replace(/\s+/g, "-");
    const data = {
      name: scale.name,
      ...(includeMetadata && {
        metadata: {
          hue: scale.hue,
          chroma: scale.manualChroma,
          contrastMode: scale.contrastMode,
          targetBackground: scale.targetBackground,
          hueCurve: scale.hueCurve,
          chromaCurve: scale.chromaCurve,
        },
      }),
      colors: colors.reduce<Record<string, any>>((acc, color, index) => {
        const step = lightnessSteps[index];
        acc[`${scaleName}-${step}`] = {
          hex: color.hex,
          oklch: color.oklch,
          p3: includeP3 ? color.cssP3 : undefined,
          lightness: Math.round(color.L * 100),
          chroma: parseFloat(color.C.toFixed(4)),
          hue: parseFloat(color.H.toFixed(1)),
        };
        return acc;
      }, {}),
    };

    return JSON.stringify(data, null, 2);
  };

  const generateDesignTokens = () => {
    const scaleName = scale.name.toLowerCase().replace(/\s+/g, "-");
    return JSON.stringify(
      colors.reduce<Record<string, any>>((acc, c, i) => {
        const step = lightnessSteps[i];
        acc[`${scaleName}.${step}`] = {
          $type: "color",
          $value: c.hex,
          $description: `${scale.name} ${step}`,
        };
        return acc;
      }, {}),
      null,
      2
    );
  };

  const generateCSV = () => {
    const headers = [
      "Step",
      "Lightness",
      "Hex",
      "OKLCH",
      "P3",
      "Chroma",
      "Hue",
      "WCAG (vs bg)",
      "WCAG Precise",
      "APCA (vs bg)",
      "Rounding Note",
    ].join(",");

    const bgOklch = toOklch(bg.color as any);
    if (!bgOklch) return "Error converting background color";

    const formatWCAGWithIndicator = (
      value: number
    ): { display: string; precise: string; note: string } => {
      const rounded1 = Number(value.toFixed(1));
      const rounded2 = Number(value.toFixed(2));
      const rounded3 = Number(value.toFixed(3));

      const roundedAt2 = rounded3 !== rounded2;
      const roundedAt1 = rounded2 !== rounded1;

      let display: string;
      let note: string;

      if (roundedAt2 && roundedAt1) {
        display = `${rounded1.toFixed(1)}†:1`;
        note = "Double rounded (3+ decimals → 1 decimal)";
      } else if (roundedAt1) {
        display = `${rounded1.toFixed(1)}*:1`;
        note = "Single rounded (2 decimals → 1 decimal)";
      } else {
        display = `${rounded1.toFixed(1)}:1`;
        note = "No significant rounding";
      }

      return {
        display,
        precise: `${value.toFixed(3)}:1`,
        note,
      };
    };

    const rows = colors.map((c, i) => {
      const step = lightnessSteps[i];
      const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
      const bgColorOklch = {
        mode: "oklch" as const,
        l: bgOklch.l,
        c: bgOklch.c || 0,
        h: bgOklch.h || 0,
      };

      const wcag = calculateWCAG(colorOklch, bgColorOklch);
      const apca = calculateAPCA(colorOklch, bgColorOklch);
      const wcagFormatted = formatWCAGWithIndicator(wcag);

      return [
        step,
        Math.round(c.L * 100),
        c.hex,
        c.oklch,
        c.cssP3,
        c.C.toFixed(4),
        c.H.toFixed(1),
        wcagFormatted.display,
        wcagFormatted.precise,
        `Lc ${Math.abs(apca).toFixed(0)}`,
        wcagFormatted.note,
      ].join(",");
    });

    return [headers, ...rows].join("\n");
  };

  const generateSwiftUI = () => {
    const scaleName = scale.name.replace(/\s+/g, "");
    let swift = includeMetadata
      ? `// ${scale.name} - Generated by Lumat Radix\n` +
        `// Hue: ${scale.hue}° | Chroma: ${(scale.manualChroma || 0).toFixed(
          2
        )}\n\n`
      : "";

    swift += `extension Color {\n`;

    colors.forEach((color, index) => {
      const step = lightnessSteps[index];
      const hex = color.hex.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      swift += `    static let ${scaleName.toLowerCase()}${step} = Color(red: ${r.toFixed(
        3
      )}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)})\n`;
    });

    swift += `}\n`;

    return swift;
  };

  const generateFigmaTokens = () => {
    const scaleName = scale.name.toLowerCase().replace(/\s+/g, "-");
    const tokens = {
      [scaleName]: {
        ...(includeMetadata && {
          $description: `${scale.name} color scale`,
          $metadata: {
            hue: scale.hue,
            chroma: scale.manualChroma,
            contrastMode: scale.contrastMode,
          },
        }),
        ...Object.fromEntries(
          colors.map((color, index) => {
            const step = lightnessSteps[index];
            return [
              step.toString(),
              {
                $value: color.hex,
                $type: "color",
                ...(includeP3 && color.cssP3 && { $p3: color.cssP3 }),
              },
            ];
          })
        ),
      },
    };

    return JSON.stringify(tokens, null, 2);
  };

  const generateSwatchInfographic = () => {
    const preset = getBackgroundPreset(scale.targetBackground);
    const bgColor = preset.color;
    const bgOklch = toOklch(bgColor as any);
    const bgColorOklch = bgOklch
      ? {
          mode: "oklch" as const,
          l: bgOklch.l,
          c: bgOklch.c || 0,
          h: bgOklch.h || 0,
        }
      : { mode: "oklch" as const, l: 1, c: 0, h: 0 };

    // Calculate all contrast pairs
    const allPairs = colors.flatMap((color, idx) =>
      colors.slice(idx + 1).map((otherColor, otherIdx) => {
        const step1 = lightnessSteps[idx];
        const step2 = lightnessSteps[idx + otherIdx + 1];
        const color1Oklch = {
          mode: "oklch" as const,
          l: color.L,
          c: color.C,
          h: color.H,
        };
        const color2Oklch = {
          mode: "oklch" as const,
          l: otherColor.L,
          c: otherColor.C,
          h: otherColor.H,
        };

        const wcag = calculateWCAG(color1Oklch, color2Oklch);
        const apca = Math.abs(calculateAPCA(color1Oklch, color2Oklch));

        return {
          step1,
          step2,
          color1: color.hex,
          color2: otherColor.hex,
          wcag,
          apca,
          isAccessible: wcag >= WCAG_THRESHOLDS.AA_NORMAL && apca >= 60,
        };
      })
    );

    // Get top 5 unique accessible pairs for WCAG
    const topWCAGPairs = allPairs
      .filter((p) => p.wcag >= WCAG_THRESHOLDS.AA_NORMAL)
      .sort((a, b) => a.wcag - b.wcag)
      .slice(0, 5);

    // Get top 5 unique accessible pairs for APCA
    const topAPCAPairs = allPairs
      .filter((p) => p.apca >= 60)
      .sort((a, b) => a.apca - b.apca)
      .slice(0, 5);

    // Calculate statistics
    const totalColors = colors.length;
    const accessibleWCAG = colors.filter((c) => {
      const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
      return (
        calculateWCAG(colorOklch, bgColorOklch) >= WCAG_THRESHOLDS.AA_NORMAL
      );
    }).length;
    const accessibleAPCA = colors.filter((c) => {
      const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
      return Math.abs(calculateAPCA(colorOklch, bgColorOklch)) >= 60;
    }).length;
    const avgChroma = colors.reduce((sum, c) => sum + c.C, 0) / colors.length;
    const avgLightness =
      colors.reduce((sum, c) => sum + c.L, 0) / colors.length;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${scale.name} - Color Scale Infographic</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f4f4f5;
      padding: 3rem;
      line-height: 1.6;
    }

    .infographic {
      max-width: 1400px;
      margin: 0 auto;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 20px;
      padding: 3rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #27272a;
    }

    .header h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      letter-spacing: -0.025em;
    }

    .header .subtitle {
      font-size: 1.25rem;
      color: #a1a1aa;
    }

    .gradient-strip {
      height: 120px;
      margin: 2rem 0;
      border-radius: 12px;
      background: linear-gradient(to right, ${colors
        .map((c) => c.hex)
        .join(", ")});
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin: 3rem 0;
    }

    .stat-card {
      background: #27272a;
      padding: 2rem;
      border-radius: 12px;
      border: 1px solid #3f3f46;
      text-align: center;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #fafafa;
    }

    .swatches-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }

    .swatch-mini {
      aspect-ratio: 1;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 3rem 0 1.5rem;
      color: #fafafa;
    }

    .pairs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }

    .pair-card {
      background: #27272a;
      border: 1px solid #3f3f46;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .pair-swatches {
      display: flex;
      gap: 0.5rem;
    }

    .pair-swatch {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .pair-info {
      flex: 1;
    }

    .pair-steps {
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .pair-ratio {
      font-family: monospace;
      font-size: 0.875rem;
      color: #a1a1aa;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .badge-wcag { background: #22c55e; color: white; }
    .badge-apca { background: #3b82f6; color: white; }
  </style>
</head>
<body>
  <div class="infographic">
    <div class="header">
      <h1>${scale.name}</h1>
      <p class="subtitle">Color Scale Infographic • Generated with Luma</p>
    </div>

    <div class="gradient-strip"></div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Colors</div>
        <div class="stat-value">${totalColors}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">WCAG AA (${WCAG_THRESHOLDS.AA_NORMAL}:1)</div>
        <div class="stat-value">${accessibleWCAG} <span style="font-size: 1.25rem; color: #a1a1aa;">/ ${totalColors}</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">APCA (Lc 60+)</div>
        <div class="stat-value">${accessibleAPCA} <span style="font-size: 1.25rem; color: #a1a1aa;">/ ${totalColors}</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Chroma</div>
        <div class="stat-value">${avgChroma.toFixed(3)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Lightness</div>
        <div class="stat-value">${(avgLightness * 100).toFixed(0)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Hue</div>
        <div class="stat-value">${Math.round(scale.hue)}°</div>
      </div>
    </div>

    <h2 class="section-title">Color Swatches</h2>
    <div class="swatches-row">
      ${colors
        .map((color, idx) => {
          const step = lightnessSteps[idx];
          const textColor = step > 50 ? "#000" : "#fff";
          return `<div class="swatch-mini" style="background: ${color.hex}; color: ${textColor};">${step}</div>`;
        })
        .join("")}
    </div>

    <h2 class="section-title">Top 5 Accessible WCAG Pairs <span class="badge badge-wcag">AA</span></h2>
    <div class="pairs-grid">
      ${topWCAGPairs
        .map(
          (pair) => `
        <div class="pair-card">
          <div class="pair-swatches">
            <div class="pair-swatch" style="background: ${pair.color1};"></div>
            <div class="pair-swatch" style="background: ${pair.color2};"></div>
          </div>
          <div class="pair-info">
            <div class="pair-steps">${pair.step1} × ${pair.step2}</div>
            <div class="pair-ratio">WCAG: ${pair.wcag.toFixed(
              2
            )}:1 | APCA: Lc ${pair.apca.toFixed(0)}</div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>

    <h2 class="section-title">Top 5 Accessible APCA Pairs <span class="badge badge-apca">Lc 60+</span></h2>
    <div class="pairs-grid">
      ${topAPCAPairs
        .map(
          (pair) => `
        <div class="pair-card">
          <div class="pair-swatches">
            <div class="pair-swatch" style="background: ${pair.color1};"></div>
            <div class="pair-swatch" style="background: ${pair.color2};"></div>
          </div>
          <div class="pair-info">
            <div class="pair-steps">${pair.step1} × ${pair.step2}</div>
            <div class="pair-ratio">WCAG: ${pair.wcag.toFixed(
              2
            )}:1 | APCA: Lc ${pair.apca.toFixed(0)}</div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>

    <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 0.875rem;">
      Generated on ${new Date().toLocaleDateString()} with Luma Color Scale Generator
    </div>
  </div>
</body>
</html>`;
  };

  const generateMarkdown = (): string => {
    switch (previewMode) {
      case "swatches":
        return generateSwatchMarkdown();
      case "guidelines":
        return generateGuidelinesMarkdown();
      case "contrast":
        return generateContrastMarkdown();
      case "matrix":
        return generateMatrixMarkdown();
      case "report":
        return generateReportMarkdown();
      case "code":
        return `# ${
          scale.name
        } - Code Export\n\n\`\`\`${activeFormat}\n${(() => {
          switch (activeFormat) {
            case "css":
              return generateCSS();
            case "scss":
              return generateSCSS();
            case "tailwind":
              return generateTailwind();
            case "json":
              return generateJSON();
            case "tokens":
              return generateDesignTokens();
            case "swiftui":
              return generateSwiftUI();
            case "figma":
              return generateFigmaTokens();
            default:
              return generateCSS();
          }
        })()}\n\`\`\``;
      default:
        return generateSwatchMarkdown();
    }
  };

  const generateSwatchMarkdown = () => `# ${scale.name} Color Scale

## Swatches

${colors
  .map((color, idx) => {
    const step = lightnessSteps[idx];
    return `### ${step}\n- **Hex:** ${color.hex}\n- **OKLCH:** L ${Math.round(
      color.L * 100
    )} C ${color.C.toFixed(2)} H ${Math.round(color.H)}°\n`;
  })
  .join("\n")}

---
*Generated with Luma on ${new Date().toLocaleDateString()}*
`;

  const generateGuidelinesMarkdown = () => {
    const guidelines = generateUsageGuidelines(colors, scale, lightnessSteps);
    return `# ${scale.name} - Usage Guidelines

${guidelines
  .map(
    (guide) => `## Step ${guide.step}

**Recommendations:**
${guide.recommendations.map((rec: string) => `- ${rec}`).join("\n")}

${
  guide.warnings.length > 0
    ? `**⚠️ Warnings:**
${guide.warnings.map((warn: string) => `- ${warn}`).join("\n")}`
    : ""
}

**Best Pairings:** ${guide.bestPairings.join(", ")}

---
`
  )
  .join("\n")}

*Generated with Luma on ${new Date().toLocaleDateString()}*
`;
  };

  const generateContrastMarkdown = () => {
    const preset = getBackgroundPreset(scale.targetBackground);
    const bgColor = preset.color;
    const bgOklch = toOklch(bgColor as any);
    const bgColorOklch = bgOklch
      ? {
          mode: "oklch" as const,
          l: bgOklch.l,
          c: bgOklch.c || 0,
          h: bgOklch.h || 0,
        }
      : { mode: "oklch" as const, l: 1, c: 0, h: 0 };

    return `# ${scale.name} - Contrast Analysis

| Step | Hex | WCAG | APCA | Level |
|------|-----|------|------|-------|
${colors
  .map((color, idx) => {
    const step = lightnessSteps[idx];
    const colorOklch = {
      mode: "oklch" as const,
      l: color.L,
      c: color.C,
      h: color.H,
    };
    const wcag = calculateWCAG(colorOklch, bgColorOklch);
    const apca = Math.abs(calculateAPCA(colorOklch, bgColorOklch));
    const level =
      wcag >= WCAG_THRESHOLDS.AAA_NORMAL
        ? "AAA"
        : wcag >= WCAG_THRESHOLDS.AA_NORMAL
        ? "AA"
        : wcag >= WCAG_THRESHOLDS.AA_LARGE
        ? "AA Large"
        : "Fail";
    return `| ${step} | ${color.hex} | ${wcag.toFixed(2)}:1 | Lc ${apca.toFixed(
      0
    )} | ${level} |`;
  })
  .join("\n")}

---
*Generated with Luma on ${new Date().toLocaleDateString()}*
`;
  };

  const generateMatrixMarkdown = () => `# ${scale.name} - Contrast Matrix

Matrix visualization is best viewed in HTML or SVG format.

---
*Generated with Luma on ${new Date().toLocaleDateString()}*
`;

  const generateReportMarkdown = () => {
    const preset = getBackgroundPreset(scale.targetBackground);
    const bgColor = preset.color;
    const bgOklch = toOklch(bgColor as any);
    const bgColorOklch = bgOklch
      ? {
          mode: "oklch" as const,
          l: bgOklch.l,
          c: bgOklch.c || 0,
          h: bgOklch.h || 0,
        }
      : { mode: "oklch" as const, l: 1, c: 0, h: 0 };

    const totalColors = colors.length;
    const accessibleColors = colors.filter((c) => {
      const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
      return (
        calculateWCAG(colorOklch, bgColorOklch) >= WCAG_THRESHOLDS.AA_NORMAL
      );
    }).length;
    const apcaCompliant = colors.filter((c) => {
      const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
      return Math.abs(calculateAPCA(colorOklch, bgColorOklch)) >= 60;
    }).length;
    const avgChroma = colors.reduce((sum, c) => sum + c.C, 0) / colors.length;

    return `# ${scale.name} - Accessibility Report

## Statistics

- **Total Colors:** ${totalColors}
- **WCAG AA+ Compliant:** ${accessibleColors} (${Math.round(
      (accessibleColors / totalColors) * 100
    )}%)
- **APCA Compliant (Lc 60+):** ${apcaCompliant} (${Math.round(
      (apcaCompliant / totalColors) * 100
    )}%)
- **Average Chroma:** ${avgChroma.toFixed(3)}
- **Hue:** ${Math.round(scale.hue)}°

## Summary

${accessibleColors} of ${totalColors} colors meet WCAG AA standards (${
      WCAG_THRESHOLDS.AA_NORMAL
    }:1) for normal text. For large text (AA Large at ${
      WCAG_THRESHOLDS.AA_LARGE
    }:1), additional steps may be suitable.

---
*Generated with Luma on ${new Date().toLocaleDateString()}*
`;
  };

  const generateFocusedHTML = (
    mode: PreviewMode,
    scale: ColorScale,
    colors: ColorResult[],
    guidelines: any[],
    contrastMatrix: any[]
  ) => {
    let bodyContent = "";
    let title = `${scale.name} - `;

    switch (mode) {
      case "swatches":
        title += "Color Swatches";
        bodyContent = `
          <div class="swatches-grid">
            ${colors
              .map((color, index) => {
                const step = lightnessSteps[index];
                const textColor = step > 50 ? "#000" : "#fff";
                return `
                <div class="swatch-item" style="background-color: ${
                  color.hex
                }; color: ${textColor};">
                  <div class="swatch-step">${step}</div>
                  <div class="swatch-hex">${color.hex}</div>
                  <div class="swatch-values">L${Math.round(
                    color.L * 100
                  )} C${color.C.toFixed(2)} H${Math.round(color.H)}°</div>
                </div>
              `;
              })
              .join("")}
          </div>
        `;
        break;

      case "guidelines":
        title += "Usage Guidelines";
        bodyContent = `
          <div class="guidelines-container">
            ${guidelines
              .map(
                (guide) => `
              <div class="guideline-card">
                <div class="guideline-header">
                  <div class="guideline-swatch" style="background-color: ${
                    guide.color
                  };"></div>
                  <h3>${scale.name} ${guide.step}</h3>
                </div>
                <div class="guideline-body">
                  <h4>Recommendations:</h4>
                  <ul>
                    ${guide.recommendations
                      .map((rec: string) => `<li>${rec}</li>`)
                      .join("")}
                  </ul>
                  ${
                    guide.warnings.length > 0
                      ? `
                    <h4 class="warnings">⚠️ Warnings:</h4>
                    <ul class="warning-list">
                      ${guide.warnings
                        .map((warn: string) => `<li>${warn}</li>`)
                        .join("")}
                    </ul>
                  `
                      : ""
                  }
                  <div class="best-pairings">
                    <strong>Best pairings:</strong> ${guide.bestPairings.join(
                      ", "
                    )}
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `;
        break;

      case "contrast":
        title += "Contrast Analysis";
        const preset = getBackgroundPreset(scale.targetBackground);
        const bgColorHex = preset.color;
        const bgOklch = toOklch(bgColorHex as any);
        const bgColorOklch = bgOklch
          ? {
              mode: "oklch" as const,
              l: bgOklch.l,
              c: bgOklch.c || 0,
              h: bgOklch.h || 0,
            }
          : { mode: "oklch" as const, l: 1, c: 0, h: 0 };

        bodyContent = `
          <table class="contrast-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Color</th>
                <th>WCAG 2.1</th>
                <th>APCA</th>
                <th>Level</th>
                <th>Sample</th>
              </tr>
            </thead>
            <tbody>
              ${colors
                .map((color, idx) => {
                  const step = lightnessSteps[idx];
                  const colorOklch = {
                    mode: "oklch" as const,
                    l: color.L,
                    c: color.C,
                    h: color.H,
                  };
                  const wcag = calculateWCAG(colorOklch, bgColorOklch);
                  const apca = Math.abs(
                    calculateAPCA(colorOklch, bgColorOklch)
                  );
                  const level =
                    wcag >= 7
                      ? "AAA"
                      : wcag >= 4.5
                      ? "AA"
                      : wcag >= 3
                      ? "AA Large"
                      : "Fail";
                  const levelColor =
                    level === "AAA"
                      ? "#22c55e"
                      : level === "AA"
                      ? "#3b82f6"
                      : level === "AA Large"
                      ? "#eab308"
                      : "#ef4444";

                  return `
                  <tr>
                    <td><strong>${step}</strong></td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 32px; height: 32px; background: ${
                          color.hex
                        }; border-radius: 4px; border: 1px solid #3f3f46;"></div>
                        <code>${color.hex}</code>
                      </div>
                    </td>
                    <td><strong>${wcag.toFixed(2)}:1</strong></td>
                    <td><strong>Lc ${apca.toFixed(0)}</strong></td>
                    <td><span class="badge" style="background: ${levelColor};">${level}</span></td>
                    <td>
                      <div style="background: ${bg}; color: ${
                    color.hex
                  }; padding: 8px 16px; border-radius: 4px; font-weight: 600;">
                        Sample Text
                      </div>
                    </td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        `;
        break;

      case "matrix":
        title += "Contrast Matrix";
        bodyContent = generateColorMatrix(
          scale,
          colors,
          undefined,
          lightnessSteps
        );
        break;

      case "code":
        title += "Code Export";
        // Get the actual code export based on current format
        const codeContent = (() => {
          switch (activeFormat) {
            case "css":
              return generateCSS();
            case "scss":
              return generateSCSS();
            case "tailwind":
              return generateTailwind();
            case "json":
              return generateJSON();
            default:
              return generateCSS();
          }
        })();
        bodyContent = `<pre class="code-block">${codeContent
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre>`;
        break;

      default:
        return generateHTMLDocumentation(
          scale,
          colors,
          guidelines,
          contrastMatrix,
          lightnessSteps
        );
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      line-height: 1.6;
      color: #f4f4f5;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 2rem;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: #18181b;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      border: 1px solid #27272a;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 2rem;
      color: #fafafa;
      font-weight: 700;
    }

    .swatches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }

    .swatch-item {
      padding: 1.5rem;
      border-radius: 12px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .swatch-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
    }

    .swatch-step {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .swatch-hex {
      font-family: monospace;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .swatch-values {
      font-family: monospace;
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .guidelines-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .guideline-card {
      background: #27272a;
      border: 1px solid #3f3f46;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .guideline-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .guideline-swatch {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    .guideline-body h4 {
      color: #d4d4d8;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }

    .guideline-body ul {
      padding-left: 1.5rem;
      color: #a1a1aa;
    }

    .warnings {
      color: #fbbf24 !important;
    }

    .warning-list {
      color: #fbbf24 !important;
    }

    .best-pairings {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #3f3f46;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .contrast-table {
      width: 100%;
      border-collapse: collapse;
      margin: 2rem 0;
    }

    .contrast-table th,
    .contrast-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #3f3f46;
    }

    .contrast-table th {
      background: #27272a;
      font-weight: 600;
      color: #d4d4d8;
    }

    .contrast-table tr:hover {
      background: #27272a;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    code {
      font-family: 'SF Mono', Monaco, Menlo, monospace;
      font-size: 0.875rem;
      color: #a1a1aa;
    }

    .code-block {
      background: #09090b;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 1.5rem;
      overflow-x: auto;
      font-family: 'SF Mono', Monaco, Menlo, monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      color: #fafafa;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    ${bodyContent}
  </div>
</body>
</html>`;
  };

  const getExportContent = () => {
    // Markdown export - available for all modes
    if (activeFormat === "markdown") {
      return generateMarkdown();
    }

    // SVG export - only valid for Matrix and Swatches
    if (activeFormat === "svg") {
      if (previewMode === "matrix") {
        return generateColorMatrix(scale, colors, undefined, lightnessSteps);
      }
      if (previewMode === "swatches") {
        // Create SVG version of swatch gradient
        return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="200">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      ${colors
        .map((color, idx) => {
          const offset = (idx / (colors.length - 1)) * 100;
          return `<stop offset="${offset}%" style="stop-color:${color.hex};stop-opacity:1" />`;
        })
        .join("")}
    </linearGradient>
  </defs>
  <rect width="1200" height="200" fill="url(#gradient)" rx="10"/>
  ${colors
    .map((color, idx) => {
      const x = (idx / colors.length) * 1200 + 10;
      const step = lightnessSteps[idx];
      const textColor = step > 50 ? "#000" : "#fff";
      return `<text x="${x}" y="100" fill="${textColor}" font-family="Arial" font-size="24" font-weight="bold">${step}</text>`;
    })
    .join("")}
</svg>`;
      }
      return `<!-- SVG export only supported for Matrix and Swatches modes -->`;
    }

    // HTML export with preview-specific content
    if (activeFormat === "html") {
      // Swatches mode gets the comprehensive infographic
      if (previewMode === "swatches") {
        return generateSwatchInfographic();
      }

      const contrastMatrix = generateContrastMatrix(colors, lightnessSteps);
      const guidelines = generateUsageGuidelines(colors, scale, lightnessSteps);

      // Report mode gets full documentation
      if (previewMode === "report") {
        return generateHTMLDocumentation(
          scale,
          colors,
          guidelines,
          contrastMatrix,
          lightnessSteps
        );
      }

      // Other modes get focused HTML
      return generateFocusedHTML(
        previewMode,
        scale,
        colors,
        guidelines,
        contrastMatrix
      );
    }

    // Standard code exports (only available in code mode)
    switch (activeFormat) {
      case "css":
        return generateCSS();
      case "scss":
        return generateSCSS();
      case "tailwind":
        return generateTailwind();
      case "json":
        return generateJSON();
      case "tokens":
        return generateDesignTokens();
      case "csv":
        return generateCSV();
      case "swiftui":
        return generateSwiftUI();
      case "figma":
        return generateFigmaTokens();
      default:
        return generateCSS();
    }
  };

  const handleCopy = async () => {
    const content = getExportContent();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getExportContent();
    const extensions: Record<ExportFormat, string> = {
      css: "css",
      scss: "scss",
      tailwind: "js",
      json: "json",
      markdown: "md",
      tokens: "json",
      svg: "svg",
      html: "html",
      csv: "csv",
      swiftui: "swift",
      figma: "json",
    };

    const mimeTypes: Record<ExportFormat, string> = {
      css: "text/css",
      scss: "text/plain",
      tailwind: "text/javascript",
      json: "application/json",
      markdown: "text/markdown",
      tokens: "application/json",
      svg: "image/svg+xml",
      html: "text/html",
      csv: "text/csv",
      swiftui: "text/plain",
      figma: "application/json",
    };

    const blob = new Blob([content], { type: mimeTypes[activeFormat] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scale.name.toLowerCase().replace(/\s+/g, "-")}.${
      extensions[activeFormat] || "txt"
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    if (activeFormat === "html" || activeFormat === "svg") {
      const blob = new Blob([getExportContent()], {
        type: activeFormat === "html" ? "text/html" : "image/svg+xml",
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  const renderPreview = () => {
    switch (previewMode) {
      case "swatches":
        return (
          <Grid columns="3" gap="3" p="3">
            {colors.map((color, idx) => {
              const step = lightnessSteps[idx];
              const colorOklch = {
                mode: "oklch" as const,
                l: color.L,
                c: color.C,
                h: color.H,
              };
              const wcag = calculateWCAG(colorOklch, bgColor);
              const apca = calculateAPCA(colorOklch, bgColor);

              return (
                <Card key={idx} style={{ padding: "16px" }}>
                  <Flex direction="column" gap="3">
                    <Box
                      style={{
                        width: "100%",
                        height: "100px",
                        backgroundColor: color.hex,
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Flex justify="between" align="center">
                      <Badge size="2" color="indigo">
                        {step}
                      </Badge>
                      <Text
                        size="2"
                        weight="medium"
                        style={{ fontFamily: "monospace", color: "#a1a1aa" }}
                      >
                        L {Math.round(color.L * 100)}
                      </Text>
                    </Flex>
                    <Text
                      size="2"
                      weight="medium"
                      style={{ fontFamily: "monospace" }}
                    >
                      {color.hex}
                    </Text>
                    <Flex gap="2">
                      <Badge
                        color={
                          wcag >= 4.5 ? "green" : wcag >= 3 ? "yellow" : "gray"
                        }
                        variant="soft"
                        size="2"
                      >
                        {wcag.toFixed(1)}:1
                      </Badge>
                      <Badge
                        color={
                          Math.abs(apca) >= 60
                            ? "green"
                            : Math.abs(apca) >= 45
                            ? "yellow"
                            : "gray"
                        }
                        variant="soft"
                        size="2"
                      >
                        Lc {Math.abs(apca).toFixed(0)}
                      </Badge>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Grid>
        );

      case "guidelines":
        const guidelines = generateUsageGuidelines(
          colors,
          scale,
          lightnessSteps
        );
        return (
          <Flex direction="column" gap="3" p="3">
            {guidelines.map((guide, idx) => (
              <Card key={idx} style={{ padding: "20px" }}>
                <Flex direction="column" gap="3">
                  <Flex align="center" gap="3">
                    <Box
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: guide.color,
                        borderRadius: "6px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Text size="3" weight="bold">
                      Step {guide.step}
                    </Text>
                  </Flex>
                  <Box>
                    <Text
                      size="2"
                      weight="bold"
                      mb="2"
                      style={{ color: "#d4d4d8" }}
                    >
                      Recommendations:
                    </Text>
                    {guide.recommendations.map((rec, i) => (
                      <Text
                        key={i}
                        size="2"
                        color="gray"
                        style={{ display: "block", marginBottom: "4px" }}
                      >
                        • {rec}
                      </Text>
                    ))}
                  </Box>
                  {guide.warnings.length > 0 && (
                    <Box>
                      <Text size="2" weight="bold" mb="2" color="red">
                        Warnings:
                      </Text>
                      {guide.warnings.map((warn, i) => (
                        <Text
                          key={i}
                          size="2"
                          color="red"
                          style={{ display: "block" }}
                        >
                          ⚠️ {warn}
                        </Text>
                      ))}
                    </Box>
                  )}
                  <Flex gap="2">
                    <Text size="1" color="gray">
                      Best pairings:
                    </Text>
                    {guide.bestPairings.map((pair, i) => (
                      <Badge key={i} variant="soft" color="blue">
                        {pair}
                      </Badge>
                    ))}
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        );

      case "contrast":
        const contrastData = colors.map((color, idx) => {
          const step = lightnessSteps[idx];
          const colorOklch = {
            mode: "oklch" as const,
            l: color.L,
            c: color.C,
            h: color.H,
          };
          const wcag = calculateWCAG(colorOklch, bgColor);
          const apca = Math.abs(calculateAPCA(colorOklch, bgColor));
          const level =
            wcag >= 7
              ? "AAA"
              : wcag >= 4.5
              ? "AA"
              : wcag >= 3
              ? "AA Large"
              : "Fail";

          return { color, step, colorOklch, wcag, apca, level, idx };
        });

        const filteredData = showAllPairs
          ? contrastData
          : contrastData.filter((item) => {
              if (useAPCAFilter) {
                return item.apca >= minAPCA && item.apca <= maxAPCA;
              } else {
                return item.wcag >= minWCAG && item.wcag <= maxWCAG;
              }
            });

        return (
          <Box p="3">
            <Card style={{ padding: "16px", marginBottom: "16px" }}>
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Text size="2" weight="bold">
                    Contrast Filters
                  </Text>
                  <Flex align="center" gap="2">
                    <Text size="2">Show All</Text>
                    <Switch
                      checked={showAllPairs}
                      onCheckedChange={setShowAllPairs}
                    />
                  </Flex>
                </Flex>

                {!showAllPairs && (
                  <>
                    <Flex gap="3" align="center">
                      <Button
                        variant={useAPCAFilter ? "solid" : "soft"}
                        size="1"
                        onClick={() => setUseAPCAFilter(true)}
                      >
                        APCA
                      </Button>
                      <Button
                        variant={!useAPCAFilter ? "solid" : "soft"}
                        size="1"
                        onClick={() => setUseAPCAFilter(false)}
                      >
                        WCAG
                      </Button>
                    </Flex>

                    {useAPCAFilter ? (
                      <>
                        <Box>
                          <Flex justify="between" mb="2">
                            <Text size="2">Min APCA: Lc {minAPCA}</Text>
                            <Text size="2">Max APCA: Lc {maxAPCA}</Text>
                          </Flex>
                          <Flex gap="3">
                            <Box style={{ flex: 1 }}>
                              <Slider
                                value={[minAPCA]}
                                onValueChange={(v) => setMinAPCA(v[0])}
                                min={0}
                                max={120}
                                step={5}
                              />
                            </Box>
                            <Box style={{ flex: 1 }}>
                              <Slider
                                value={[maxAPCA]}
                                onValueChange={(v) => setMaxAPCA(v[0])}
                                min={0}
                                max={120}
                                step={5}
                              />
                            </Box>
                          </Flex>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box>
                          <Flex justify="between" mb="2">
                            <Text size="2">
                              Min WCAG: {minWCAG.toFixed(1)}:1
                            </Text>
                            <Text size="2">
                              Max WCAG: {maxWCAG.toFixed(1)}:1
                            </Text>
                          </Flex>
                          <Flex gap="3">
                            <Box style={{ flex: 1 }}>
                              <Slider
                                value={[minWCAG]}
                                onValueChange={(v) => setMinWCAG(v[0])}
                                min={1}
                                max={21}
                                step={0.5}
                              />
                            </Box>
                            <Box style={{ flex: 1 }}>
                              <Slider
                                value={[maxWCAG]}
                                onValueChange={(v) => setMaxWCAG(v[0])}
                                min={1}
                                max={21}
                                step={0.5}
                              />
                            </Box>
                          </Flex>
                        </Box>
                      </>
                    )}

                    <Text size="2" color="gray">
                      Showing {filteredData.length} of {contrastData.length}{" "}
                      colors
                    </Text>
                  </>
                )}
              </Flex>
            </Card>

            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Pair</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Colors</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>WCAG</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>APCA</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Level</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredData.map((item) => (
                  <Table.Row key={item.idx}>
                    <Table.Cell>
                      <Text style={{ fontFamily: "monospace" }}>
                        {item.step} × BG
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2" align="center">
                        <Box
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: item.color.hex,
                            borderRadius: "4px",
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                        <Box
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: bg.color,
                            borderRadius: "4px",
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text style={{ fontFamily: "monospace" }}>
                        {item.wcag.toFixed(2)}:1
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text style={{ fontFamily: "monospace" }}>
                        Lc {item.apca.toFixed(0)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={
                          item.level === "AAA"
                            ? "green"
                            : item.level === "AA"
                            ? "blue"
                            : item.level === "AA Large"
                            ? "yellow"
                            : "red"
                        }
                      >
                        {item.level}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        );

      case "matrix":
        return (
          <Box p="3">
            <div
              dangerouslySetInnerHTML={{
                __html: generateColorMatrix(
                  scale,
                  colors,
                  undefined,
                  lightnessSteps
                ),
              }}
            />
          </Box>
        );

      case "report":
        const totalColors = colors.length;
        const accessibleColors = colors.filter((c) => {
          const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
          return calculateWCAG(colorOklch, bgColor) >= 4.5;
        }).length;
        const apcaCompliant = colors.filter((c) => {
          const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
          return Math.abs(calculateAPCA(colorOklch, bgColor)) >= 60;
        }).length;
        const avgChroma =
          colors.reduce((sum, c) => sum + c.C, 0) / colors.length;

        return (
          <Flex direction="column" gap="4" p="4">
            <Box>
              <Text size="5" weight="bold" mb="2">
                Accessibility Report
              </Text>
              <Text size="2" color="gray">
                Analysis of {scale.name} color scale against WCAG and APCA
                standards
              </Text>
            </Box>

            <Grid columns="2" gap="3">
              <Card style={{ padding: "16px" }}>
                <Text size="2" color="gray" mb="1">
                  Total Colors
                </Text>
                <Text size="6" weight="bold">
                  {totalColors}
                </Text>
              </Card>
              <Card style={{ padding: "16px" }}>
                <Text size="2" color="gray" mb="1">
                  WCAG AA+ Compliant
                </Text>
                <Text
                  size="6"
                  weight="bold"
                  style={{
                    color:
                      accessibleColors / totalColors > 0.5
                        ? "#22c55e"
                        : "#facc15",
                  }}
                >
                  {accessibleColors} (
                  {Math.round((accessibleColors / totalColors) * 100)}%)
                </Text>
              </Card>
              <Card style={{ padding: "16px" }}>
                <Text size="2" color="gray" mb="1">
                  APCA Compliant
                </Text>
                <Text
                  size="6"
                  weight="bold"
                  style={{
                    color:
                      apcaCompliant / totalColors > 0.5 ? "#22c55e" : "#facc15",
                  }}
                >
                  {apcaCompliant} (
                  {Math.round((apcaCompliant / totalColors) * 100)}%)
                </Text>
              </Card>
              <Card style={{ padding: "16px" }}>
                <Text size="2" color="gray" mb="1">
                  Avg Chroma
                </Text>
                <Text size="6" weight="bold">
                  {avgChroma.toFixed(3)}
                </Text>
              </Card>
            </Grid>

            <Card style={{ padding: "16px", backgroundColor: "#fef3c7" }}>
              <Text size="2" weight="bold" mb="2">
                📊 Contrast Summary
              </Text>
              <Text size="2">
                {accessibleColors} of {totalColors} colors meet WCAG AA
                standards (4.5:1) for normal text. For large text (AA Large at
                3:1), consider using additional steps.
              </Text>
            </Card>
          </Flex>
        );

      case "code":
      default:
        return (
          <Box p="3">
            <pre
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: "1.5",
                color: "#fafafa",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {getExportContent()}
            </pre>
          </Box>
        );
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: "800px", maxHeight: "90vh" }}>
        <Dialog.Title>Export {scale.name}</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Export color scales in multiple formats for design tools, frameworks,
          and documentation
        </Dialog.Description>

        {/* Preview Mode Selection (Primary) */}
        <Box mb="4">
          <Text
            size="2"
            weight="bold"
            mb="2"
            style={{ color: "var(--gray-12)" }}
          >
            Preview Mode
          </Text>
          <Flex gap="2" wrap="wrap">
            <Button
              variant={previewMode === "swatches" ? "solid" : "soft"}
              size="2"
              onClick={() => setPreviewMode("swatches")}
            >
              Swatches
            </Button>
            <Button
              variant={previewMode === "guidelines" ? "solid" : "soft"}
              size="2"
              onClick={() => setPreviewMode("guidelines")}
            >
              Guidelines
            </Button>
            <Button
              variant={previewMode === "contrast" ? "solid" : "soft"}
              size="2"
              onClick={() => setPreviewMode("contrast")}
            >
              Contrast
            </Button>
            <Button
              variant={previewMode === "matrix" ? "solid" : "soft"}
              size="2"
              onClick={() => setPreviewMode("matrix")}
            >
              Matrix
            </Button>
            <Button
              variant={previewMode === "report" ? "solid" : "soft"}
              size="2"
              onClick={() => setPreviewMode("report")}
            >
              Report
            </Button>
            <Button
              variant={previewMode === "code" ? "solid" : "soft"}
              size="2"
              onClick={() => setPreviewMode("code")}
            >
              Code
            </Button>
          </Flex>
        </Box>

        {/* Export Format Selection (Secondary) */}
        <Box mb="4">
          <Text
            size="2"
            weight="bold"
            mb="2"
            style={{ color: "var(--gray-12)" }}
          >
            Export Format
          </Text>
          <Tabs.Root
            value={activeFormat}
            onValueChange={(v) => setActiveFormat(v as ExportFormat)}
          >
            <Tabs.List>
              {validFormats.includes("css") && (
                <Tabs.Trigger value="css">CSS</Tabs.Trigger>
              )}
              {validFormats.includes("scss") && (
                <Tabs.Trigger value="scss">SCSS</Tabs.Trigger>
              )}
              {validFormats.includes("tailwind") && (
                <Tabs.Trigger value="tailwind">Tailwind</Tabs.Trigger>
              )}
              {validFormats.includes("json") && (
                <Tabs.Trigger value="json">JSON</Tabs.Trigger>
              )}
              {validFormats.includes("markdown") && (
                <Tabs.Trigger value="markdown">Markdown</Tabs.Trigger>
              )}
              {validFormats.includes("tokens") && (
                <Tabs.Trigger value="tokens">Tokens</Tabs.Trigger>
              )}
              {validFormats.includes("svg") && (
                <Tabs.Trigger value="svg">SVG</Tabs.Trigger>
              )}
              {validFormats.includes("html") && (
                <Tabs.Trigger value="html">HTML</Tabs.Trigger>
              )}
              {validFormats.includes("csv") && (
                <Tabs.Trigger value="csv">CSV</Tabs.Trigger>
              )}
              {validFormats.includes("swiftui") && (
                <Tabs.Trigger value="swiftui">SwiftUI</Tabs.Trigger>
              )}
              {validFormats.includes("figma") && (
                <Tabs.Trigger value="figma">Figma</Tabs.Trigger>
              )}
            </Tabs.List>
          </Tabs.Root>
        </Box>

        {/* Export Options */}
        <Flex direction="column" gap="2" mb="4">
          <Flex align="center" gap="2">
            <Switch
              checked={includeMetadata}
              onCheckedChange={setIncludeMetadata}
            />
            <Text size="2">Include metadata (comments, hue, chroma)</Text>
          </Flex>
          <Flex align="center" gap="2">
            <Switch checked={includeP3} onCheckedChange={setIncludeP3} />
            <Text size="2">Include P3 color space values</Text>
          </Flex>
        </Flex>

        <Box
          mt="3"
          style={{
            backgroundColor: "#09090b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <ScrollArea style={{ height: "400px" }}>{renderPreview()}</ScrollArea>
        </Box>

        {/* Actions */}
        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" color="gray" onClick={onClose}>
            Close
          </Button>
          {(activeFormat === "html" || activeFormat === "svg") && (
            <Button variant="soft" onClick={handleOpenInNewTab}>
              <OpenInNewWindowIcon /> Open in New Tab
            </Button>
          )}
          <Button variant="soft" onClick={handleDownload}>
            <DownloadIcon /> Download
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <CheckIcon /> Copied!
              </>
            ) : (
              <>
                <CopyIcon /> Copy
              </>
            )}
          </Button>
        </Flex>

        <Dialog.Close>
          <button
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a1a1aa",
            }}
            aria-label="Close"
          >
            <Cross2Icon width="20" height="20" />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};
