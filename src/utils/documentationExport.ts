import { ColorResult, LIGHTNESS_STEPS } from './colorEngine';
import { ColorScale } from '../types';
import { calculateAPCA, calculateWCAG } from './contrast';
import { converter } from 'culori';
import { WCAG_THRESHOLDS } from './constants';

export interface ContrastPair {
  foreground: string;
  background: string;
  fgStep: number;
  bgStep: number;
  apca: number;
  wcag: number;
  apcaPasses: boolean;
  wcagLevel: 'AAA' | 'AA' | 'A' | 'Fail';
}

export interface ContrastFilterOptions {
  minAPCA?: number;  // Minimum APCA Lc value
  maxAPCA?: number;  // Maximum APCA Lc value
  minWCAG?: number;  // Minimum WCAG ratio
  maxWCAG?: number;  // Maximum WCAG ratio
  useAPCA?: boolean; // If true, filter by APCA; if false, filter by WCAG
}

export interface UsageGuideline {
  step: number;
  color: string;
  recommendations: string[];
  warnings: string[];
  bestPairings: number[];
}

/**
 * Generate a contrast matrix showing all color pair combinations
 * Calculates actual contrast between each foreground/background pair
 */
export function generateContrastMatrix(colors: ColorResult[]): ContrastPair[] {
  const pairs: ContrastPair[] = [];

  for (let i = 0; i < colors.length; i++) {
    for (let j = 0; j < colors.length; j++) {
      if (i === j) continue; // Skip same color pairs

      const fg = colors[i];
      const bg = colors[j];

      // Convert to OKLCH format for contrast calculation
      const fgColor = { mode: 'oklch' as const, l: fg.L, c: fg.C, h: fg.H };
      const bgColor = { mode: 'oklch' as const, l: bg.L, c: bg.C, h: bg.H };

      // Calculate actual contrast between this specific pair
      const apcaValue = calculateAPCA(fgColor, bgColor);
      const wcagValue = calculateWCAG(fgColor, bgColor);

      // Determine WCAG level
      let wcagLevel: 'AAA' | 'AA' | 'A' | 'Fail' = 'Fail';
      if (wcagValue >= WCAG_THRESHOLDS.AAA_NORMAL) wcagLevel = 'AAA';
      else if (wcagValue >= WCAG_THRESHOLDS.AA_NORMAL) wcagLevel = 'AA';
      else if (wcagValue >= WCAG_THRESHOLDS.AA_LARGE) wcagLevel = 'A';

      pairs.push({
        foreground: fg.hex,
        background: bg.hex,
        fgStep: LIGHTNESS_STEPS[i],
        bgStep: LIGHTNESS_STEPS[j],
        apca: Math.abs(apcaValue),
        wcag: wcagValue,
        apcaPasses: Math.abs(apcaValue) >= 60, // Common body text threshold
        wcagLevel
      });
    }
  }

  return pairs;
}

/**
 * Filter contrast pairs based on contrast range requirements
 * @param pairs - All contrast pairs
 * @param options - Filter options (minAPCA, maxAPCA, minWCAG, maxWCAG, useAPCA)
 * @returns Filtered pairs that fall within the specified contrast range
 */
export function filterContrastPairs(
  pairs: ContrastPair[],
  options: ContrastFilterOptions
): ContrastPair[] {
  if (!options.minAPCA && !options.maxAPCA && !options.minWCAG && !options.maxWCAG) {
    // No filter specified, return all pairs
    return pairs;
  }

  return pairs.filter(pair => {
    if (options.useAPCA) {
      // Filter by APCA range
      const meetsMin = options.minAPCA === undefined || pair.apca >= options.minAPCA;
      const meetsMax = options.maxAPCA === undefined || pair.apca <= options.maxAPCA;
      return meetsMin && meetsMax;
    } else {
      // Filter by WCAG range
      const meetsMin = options.minWCAG === undefined || pair.wcag >= options.minWCAG;
      const meetsMax = options.maxWCAG === undefined || pair.wcag <= options.maxWCAG;
      return meetsMin && meetsMax;
    }
  });
}

/**
 * Generate usage guidelines for each color step
 * Uses the scale's target background to provide relevant contrast recommendations
 */
export function generateUsageGuidelines(
  colors: ColorResult[],
  scale: ColorScale
): UsageGuideline[] {
  return colors.map((color, index) => {
    const step = LIGHTNESS_STEPS[index];
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const bestPairings: number[] = [];

    // Get contrast values for the scale's target background
    const targetBg = color.targetBackground || scale.targetBackground || 'black';
    const apcaValue = targetBg === 'white'
      ? color.contrast?.apca.onWhite
      : targetBg === 'gray'
      ? color.contrast?.apca.onGray
      : color.contrast?.apca.onBlack;
    const wcagValue = targetBg === 'white'
      ? color.contrast?.wcag.onWhite
      : targetBg === 'gray'
      ? color.contrast?.wcag.onGray
      : color.contrast?.wcag.onBlack;

    // Analyze lightness and contrast
    if (step >= 90) {
      recommendations.push('Excellent for backgrounds and subtle UI elements');
      recommendations.push('Use for card backgrounds, hover states');
      if (targetBg === 'white' || targetBg === 'gray') {
        warnings.push(`Low contrast with ${targetBg} backgrounds`);
      }
    } else if (step >= 70) {
      recommendations.push('Good for disabled states and borders');
      recommendations.push('Suitable for secondary UI elements');
      if (wcagValue && wcagValue >= WCAG_THRESHOLDS.AA_LARGE) {
        recommendations.push(`Meets WCAG ${wcagValue >= WCAG_THRESHOLDS.AA_NORMAL ? 'AA' : 'A'} for large text on ${targetBg}`);
      }
    } else if (step >= 40) {
      recommendations.push('Ideal for interactive elements and icons');
      recommendations.push('Works well for primary buttons and links');
      if (wcagValue && wcagValue >= WCAG_THRESHOLDS.AA_NORMAL) {
        recommendations.push(`AA compliant for text on ${targetBg} (${wcagValue.toFixed(1)}:1)`);
      }
      if (apcaValue && Math.abs(apcaValue) >= 60) {
        recommendations.push(`APCA Lc ${Math.abs(apcaValue).toFixed(0)} - suitable for body text`);
      }
    } else if (step >= 20) {
      recommendations.push('Strong contrast for primary text');
      recommendations.push('Excellent for headings and emphasis');
      if (wcagValue && wcagValue >= WCAG_THRESHOLDS.AAA_NORMAL) {
        recommendations.push(`AAA compliant for body text on ${targetBg} (${wcagValue.toFixed(1)}:1)`);
      }
      if (apcaValue && Math.abs(apcaValue) >= 75) {
        recommendations.push(`APCA Lc ${Math.abs(apcaValue).toFixed(0)} - excellent readability`);
      }
    } else {
      recommendations.push('Maximum contrast for critical elements');
      recommendations.push('Use sparingly for high emphasis');
      warnings.push('May be too harsh for large text blocks');
      if (wcagValue && wcagValue >= WCAG_THRESHOLDS.AAA_NORMAL) {
        recommendations.push(`Exceeds AAA standards (${wcagValue.toFixed(1)}:1)`);
      }
    }

    // Find best pairings (high contrast combinations)
    colors.forEach((_otherColor, otherIndex) => {
      if (index === otherIndex) return;

      const lightnessDiff = Math.abs(step - LIGHTNESS_STEPS[otherIndex]);

      // Good pairing if lightness difference is substantial
      if (lightnessDiff >= 60) {
        bestPairings.push(LIGHTNESS_STEPS[otherIndex]);
      }
    });

    return {
      step,
      color: color.hex,
      recommendations,
      warnings,
      bestPairings: bestPairings.sort((a, b) => b - a).slice(0, 5)
    };
  });
}

/**
 * Generate HTML documentation page
 */
export function generateHTMLDocumentation(
  scale: ColorScale,
  colors: ColorResult[],
  guidelines: UsageGuideline[],
  contrastMatrix: ContrastPair[]
): string {
  // Compact swatch display with just essential info
  const swatchesHTML = colors.map((color, index) => {
    const step = LIGHTNESS_STEPS[index];
    const actualL = Math.round(color.L * 100);
    const textColor = step > 50 ? '#000' : '#fff';

    return `
      <div class="swatch-compact" style="background-color: ${color.hex}; color: ${textColor};">
        <div class="swatch-step">${step}</div>
        <div class="swatch-hex">${color.hex}</div>
        <div class="swatch-values">L${actualL} C${color.C.toFixed(2)} H${Math.round(color.H)}°</div>
      </div>
    `;
  }).join('');

  // Select key guidelines only (extreme light, mid, and dark)
  const keyGuidelines = [
    guidelines[0],
    guidelines[Math.floor(guidelines.length / 2)],
    guidelines[guidelines.length - 1]
  ].filter(Boolean);

  const guidelinesHTML = keyGuidelines.map(guideline => `
    <div class="guideline-compact">
      <div class="guideline-swatch" style="background-color: ${guideline.color};"></div>
      <div class="guideline-info">
        <strong>${scale.name} ${guideline.step}</strong>
        <div class="guideline-uses">${guideline.recommendations.slice(0, 2).join(', ')}</div>
        <div class="guideline-pairs">Pairs: ${guideline.bestPairings.slice(0, 3).join(', ')}</div>
      </div>
    </div>
  `).join('');

  // Generate top 5 pairs for each threshold
  const thresholds = [
    { label: 'WCAG 3:1', type: 'wcag', value: 3, badge: 'A' },
    { label: 'WCAG 4.5:1', type: 'wcag', value: 4.5, badge: 'AA' },
    { label: 'APCA 45 Lc', type: 'apca', value: 45, badge: '45' },
    { label: 'APCA 70 Lc', type: 'apca', value: 70, badge: '70' },
    { label: 'APCA 90 Lc', type: 'apca', value: 90, badge: '90' }
  ];

  const generateThresholdPairs = (threshold: typeof thresholds[0]) => {
    const filtered = contrastMatrix.filter(pair => {
      if (threshold.type === 'wcag') {
        return pair.wcag >= threshold.value;
      } else {
        return pair.apca >= threshold.value;
      }
    });

    // Sort by the relevant metric
    const sorted = threshold.type === 'wcag'
      ? filtered.sort((a, b) => a.wcag - b.wcag)  // Closest to threshold
      : filtered.sort((a, b) => a.apca - b.apca);

    return sorted.slice(0, 5);
  };

  const contrastTableHTML = thresholds.map(threshold => {
    const pairs = generateThresholdPairs(threshold);
    if (pairs.length === 0) return '';

    return `
      <div class="threshold-section">
        <h3>${threshold.label}</h3>
        <table class="contrast-table">
          <thead>
            <tr>
              <th>FG</th>
              <th>BG</th>
              <th>APCA</th>
              <th>WCAG</th>
              <th>Sample</th>
            </tr>
          </thead>
          <tbody>
            ${pairs.map(pair => `
              <tr>
                <td>${pair.fgStep}</td>
                <td>${pair.bgStep}</td>
                <td>${pair.apca.toFixed(0)}</td>
                <td>${pair.wcag.toFixed(1)}</td>
                <td>
                  <div class="preview" style="background-color: ${pair.background}; color: ${pair.foreground};">
                    Aa
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${scale.name} Color Scale Documentation - Luma</title>
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
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
      border: 1px solid #27272a;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #fafafa;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .subtitle {
      font-size: 1.125rem;
      color: #a1a1aa;
      margin-bottom: 3rem;
      font-weight: 400;
    }

    h2 {
      font-size: 1.875rem;
      margin: 3rem 0 1.5rem;
      color: #fafafa;
      border-bottom: 1px solid #3f3f46;
      padding-bottom: 0.75rem;
      font-weight: 600;
      letter-spacing: -0.025em;
    }

    .scale-info {
      background: #27272a;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      border: 1px solid #3f3f46;
    }

    .scale-info dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem 2rem;
    }

    .scale-info dt {
      font-weight: 600;
      color: #d4d4d8;
    }

    .scale-info dd {
      color: #a1a1aa;
      font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
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
      border-color: rgba(255, 255, 255, 0.2);
    }

    .swatch-label {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .swatch-step {
      font-size: 1.5rem;
    }

    .swatch-hex {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .swatch-details {
      margin-top: 0.75rem;
      font-size: 0.75rem;
      opacity: 0.8;
      font-family: 'Monaco', 'Courier New', monospace;
    }

    .detail-row {
      margin: 0.25rem 0;
    }

    .guidelines-grid {
      display: grid;
      gap: 1.5rem;
      margin: 2rem 0;
    }

    .guideline-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .guideline-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .guideline-swatch {
      width: 3rem;
      height: 3rem;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .guideline-header h3 {
      font-size: 1.25rem;
      color: #111827;
    }

    .guideline-content {
      padding: 1.5rem;
    }

    .guideline-content h4 {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 0.75rem;
    }

    .guideline-content ul {
      list-style: none;
      margin-bottom: 1.5rem;
    }

    .guideline-content li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
    }

    .recommendations li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }

    .warnings li::before {
      content: "!";
      position: absolute;
      left: 0.5rem;
      color: #f59e0b;
      font-weight: bold;
    }

    .warnings {
      background: #fef3c7;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
    }

    .pairings p {
      color: #6b7280;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
    }

    .threshold-section {
      margin-bottom: 0.15in;
      page-break-inside: avoid;
    }

    .threshold-section h3 {
      font-size: 8pt;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.04in;
      padding: 0.02in 0.04in;
      background: #f9fafb;
      border-left: 3px solid #3b82f6;
      border-radius: 2px;
    }

    .contrast-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 6pt;
      margin-bottom: 0.08in;
    }

    .contrast-table th {
      background: #f3f4f6;
      padding: 0.03in 0.04in;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #d1d5db;
      font-size: 6pt;
    }

    .contrast-table td {
      padding: 0.025in 0.04in;
      border-bottom: 1px solid #f3f4f6;
    }

    .level-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .level-aaa {
      background: #d1fae5;
      color: #065f46;
    }

    .level-aa {
      background: #dbeafe;
      color: #1e40af;
    }

    .level-a {
      background: #fef3c7;
      color: #92400e;
    }

    .level-fail {
      background: #fee2e2;
      color: #991b1b;
    }

    .preview {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 600;
      text-align: center;
      font-size: 1.125rem;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
        padding: 1rem;
      }

      .swatch-item:hover {
        transform: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${scale.name} Color Scale</h1>
      <p class="subtitle">Generated by Luma - P3 OKLCH Color Scale Generator | ${new Date().toLocaleDateString()}</p>
    </header>

    <div class="scale-info">
      <dl>
        <dt>Base Hue:</dt>
        <dd>${scale.hue}°</dd>
        <dt>Base Chroma:</dt>
        <dd>${scale.manualChroma.toFixed(4)}</dd>
        <dt>Hue Curve:</dt>
        <dd>Shift ${scale.hueCurve.shift}° / Pow ${scale.hueCurve.power}</dd>
        <dt>Chroma Curve:</dt>
        <dd>Shift ${scale.chromaCurve.shift} / Pow ${scale.chromaCurve.power}</dd>
        <dt>Contrast:</dt>
        <dd>${scale.contrastMode || 'standard'}</dd>
        <dt>Steps:</dt>
        <dd>${colors.length}</dd>
      </dl>
    </div>

    <h2>Color Swatches</h2>
    <div class="swatches-grid">
      ${swatchesHTML}
    </div>

    <div class="content-grid">
      <div class="guidelines-section">
        <h2>Key Usage Guidelines</h2>
        ${guidelinesHTML}
      </div>

      <div class="contrast-section">
        <h2>Top Accessible Pairs</h2>
        ${contrastTableHTML}
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate color matrix showing opacity variations
 * Creates a grid with lightness on Y-axis and opacity on X-axis
 * Styled to match LOMAT React app aesthetic
 * Uses the scale's targetBackground to determine color scheme
 */
export function generateColorMatrix(
  scale: ColorScale,
  colors: ColorResult[],
  opacitySteps: number[] = [100, 90, 80, 70, 60, 50, 40, 30, 20, 15, 12, 10, 7, 5, 3, 0]
): string {
  // Use scale's target background to determine color scheme from generated scale colors
  const targetBg = scale.targetBackground || 'white';
  const isDark = targetBg === 'black';
  const isGray = targetBg === 'gray';

  // Helper to get color by lightness step
  const getColorByStep = (step: number): string => {
    const index = LIGHTNESS_STEPS.indexOf(step);
    return index !== -1 ? colors[index].hex : '#000000';
  };

  // Use colors from the generated scale based on target background
  const bgColor = isDark ? getColorByStep(14) : isGray ? getColorByStep(85) : getColorByStep(98);
  const textColor = isDark ? getColorByStep(93) : isGray ? getColorByStep(32) : getColorByStep(40);
  const labelColor = isDark ? getColorByStep(96) : isGray ? getColorByStep(26) : getColorByStep(32);
  const strokeColor = isDark ? getColorByStep(17) : isGray ? getColorByStep(90) : getColorByStep(96);

  const toRgb = converter('rgb');

  const applyOpacity = (color: ColorResult, opacity: number): string => {
    const rgb = toRgb({ mode: 'oklch', l: color.L, c: color.C, h: color.H });
    if (!rgb) return bgColor;

    // Clamp RGB values to valid 0-255 range
    const r = Math.max(0, Math.min(255, Math.round((rgb.r || 0) * 255)));
    const g = Math.max(0, Math.min(255, Math.round((rgb.g || 0) * 255)));
    const b = Math.max(0, Math.min(255, Math.round((rgb.b || 0) * 255)));

    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  const cellSize = 48;
  const labelWidth = 50;
  const labelHeight = 40;
  const headerHeight = 80;
  const cornerRadius = 8;
  const cellGap = 4; // Increased gap for better visibility
  const padding = 20;
  const gridWidth = opacitySteps.length * (cellSize + cellGap) - cellGap;
  const gridHeight = colors.length * (cellSize + cellGap) - cellGap;
  const totalWidth = gridWidth + labelWidth + padding * 2;
  const totalHeight = gridHeight + labelHeight + headerHeight + padding * 2;

  // Generate SVG grid cells with rounded corners and visible gaps
  const cells = colors.map((color, rowIndex) => {
    return opacitySteps.map((opacity, colIndex) => {
      const x = padding + labelWidth + colIndex * (cellSize + cellGap);
      const y = headerHeight + labelHeight + rowIndex * (cellSize + cellGap);
      const fillColor = applyOpacity(color, opacity);

      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" rx="${cornerRadius}"/>`;
    }).join('\n');
  }).join('\n');

  // Generate row labels (lightness)
  const rowLabels = colors.map((_, rowIndex) => {
    const lightnessStep = LIGHTNESS_STEPS[rowIndex];
    const y = headerHeight + labelHeight + rowIndex * (cellSize + cellGap) + cellSize / 2;
    return `<text x="${padding + labelWidth - 10}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" font-weight="500">L${lightnessStep}</text>`;
  }).join('\n');

  // Generate column labels (opacity)
  const colLabels = opacitySteps.map((opacity, colIndex) => {
    const x = padding + labelWidth + colIndex * (cellSize + cellGap) + cellSize / 2;
    return `<text x="${x}" y="${headerHeight + labelHeight - 15}" text-anchor="middle" font-size="11" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" font-weight="400">${opacity}%</text>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${totalWidth}" height="${totalHeight}" fill="${bgColor}" rx="12"/>

  <!-- Header -->
  <text x="${padding}" y="35" font-size="22" font-weight="600" fill="${textColor}" font-family="-apple-system, system-ui, sans-serif">${scale.name}</text>
  <text x="${padding}" y="55" font-size="13" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif">Hue: ${scale.hue}° | Chroma: ${scale.manualChroma.toFixed(4)}</text>

  <!-- Axis Labels -->
  <text x="${padding + labelWidth + gridWidth / 2}" y="${headerHeight - 10}" text-anchor="middle" font-size="11" font-weight="600" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" letter-spacing="1.5">OPACITY STEPS →</text>

  <text x="${padding + 5}" y="${headerHeight + labelHeight + gridHeight / 2}" text-anchor="middle" font-size="11" font-weight="600" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" letter-spacing="1.5" transform="rotate(-90, ${padding + 5}, ${headerHeight + labelHeight + gridHeight / 2})">SOURCE L ↑</text>

  <!-- Column headers -->
  ${colLabels}

  <!-- Row labels -->
  ${rowLabels}

  <!-- Grid cells -->
  ${cells}

  <!-- Footer -->
  <text x="${totalWidth - padding}" y="${totalHeight - 15}" text-anchor="end" font-size="10" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" opacity="0.6">Generated by Luma | ${new Date().toLocaleDateString()}</text>
</svg>`;
}

/**
 * Generate hue matrix showing all color scales at each lightness step
 * Creates a grid with hue on Y-axis (different scales) and lightness on X-axis
 * @param scales - Array of all color scales to display
 * @param allColors - Map of scale IDs to their color arrays
 * @param targetBackground - Background theme to use
 */
export function generateHueMatrix(
  scales: ColorScale[],
  allColors: Map<string, ColorResult[]>,
  targetBackground: string = 'canvas-bg'
): string {
  const isDark = targetBackground === 'black';
  const isGray = targetBackground === 'gray';

  // Use first scale's colors for UI color references
  const firstScaleColors = allColors.get(scales[0]?.id);
  if (!firstScaleColors) return '';

  // Helper to get color by lightness step from first scale
  const getColorByStep = (step: number): string => {
    const index = LIGHTNESS_STEPS.indexOf(step);
    return index !== -1 ? firstScaleColors[index].hex : '#000000';
  };

  // Use same color mapping as opacity matrix
  const bgColor = isDark ? getColorByStep(14) : isGray ? getColorByStep(85) : getColorByStep(98);
  const textColor = isDark ? getColorByStep(93) : isGray ? getColorByStep(32) : getColorByStep(40);
  const labelColor = isDark ? getColorByStep(96) : isGray ? getColorByStep(26) : getColorByStep(32);
  const strokeColor = isDark ? getColorByStep(17) : isGray ? getColorByStep(90) : getColorByStep(96);

  const cellSize = 48;
  const labelWidth = 60;
  const labelHeight = 40;
  const headerHeight = 80;
  const cornerRadius = 8;
  const cellGap = 4;
  const padding = 20;
  const gridWidth = LIGHTNESS_STEPS.length * (cellSize + cellGap) - cellGap;
  const gridHeight = scales.length * (cellSize + cellGap) - cellGap;
  const totalWidth = gridWidth + labelWidth + padding * 2;
  const totalHeight = gridHeight + labelHeight + headerHeight + padding * 2;

  // Generate SVG grid cells - rows are scales/hues, columns are lightness steps
  const cells = scales.map((scale, rowIndex) => {
    const colors = allColors.get(scale.id);
    if (!colors) return '';

    return LIGHTNESS_STEPS.map((_, colIndex) => {
      const x = padding + labelWidth + colIndex * (cellSize + cellGap);
      const y = headerHeight + labelHeight + rowIndex * (cellSize + cellGap);
      const color = colors[colIndex];

      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color.hex}" stroke="${strokeColor}" stroke-width="2" rx="${cornerRadius}"/>`;
    }).join('\n');
  }).join('\n');

  // Generate row labels (hue/scale names)
  const rowLabels = scales.map((scale, rowIndex) => {
    const y = headerHeight + labelHeight + rowIndex * (cellSize + cellGap) + cellSize / 2;
    return `<text x="${padding + labelWidth - 10}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="11" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" font-weight="500">${scale.hue}°</text>`;
  }).join('\n');

  // Generate column labels (lightness steps)
  const colLabels = LIGHTNESS_STEPS.map((step, colIndex) => {
    const x = padding + labelWidth + colIndex * (cellSize + cellGap) + cellSize / 2;
    return `<text x="${x}" y="${headerHeight + labelHeight - 15}" text-anchor="middle" font-size="11" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" font-weight="400">L${step}</text>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${totalWidth}" height="${totalHeight}" fill="${bgColor}" rx="12"/>

  <!-- Header -->
  <text x="${padding}" y="35" font-size="22" font-weight="600" fill="${textColor}" font-family="-apple-system, system-ui, sans-serif">All Hues Matrix</text>
  <text x="${padding}" y="55" font-size="13" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif">${scales.length} scales across ${LIGHTNESS_STEPS.length} lightness steps</text>

  <!-- Axis Labels -->
  <text x="${padding + labelWidth + gridWidth / 2}" y="${headerHeight - 10}" text-anchor="middle" font-size="11" font-weight="600" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" letter-spacing="1.5">LIGHTNESS STEPS →</text>

  <text x="${padding + 5}" y="${headerHeight + labelHeight + gridHeight / 2}" text-anchor="middle" font-size="11" font-weight="600" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" letter-spacing="1.5" transform="rotate(-90, ${padding + 5}, ${headerHeight + labelHeight + gridHeight / 2})">HUE ↑</text>

  <!-- Column headers -->
  ${colLabels}

  <!-- Row labels -->
  ${rowLabels}

  <!-- Grid cells -->
  ${cells}

  <!-- Footer -->
  <text x="${totalWidth - padding}" y="${totalHeight - 15}" text-anchor="end" font-size="10" fill="${labelColor}" font-family="-apple-system, system-ui, sans-serif" opacity="0.6">Generated by Luma | ${new Date().toLocaleDateString()}</text>
</svg>`;
}

/**
 * Generate HTML documentation with embedded color matrix
 * Uses the scale's targetBackground to determine default theme
 */
export function generateColorMatrixHTML(
  scale: ColorScale,
  colors: ColorResult[],
  opacitySteps: number[] = [100, 90, 80, 70, 60, 50, 40, 30, 20, 15, 12, 10, 7, 5, 3, 0]
): string {
  const svg = generateColorMatrix(scale, colors, opacitySteps);

  // Use scale's target background for initial theme with colors from generated scale
  const targetBg = scale.targetBackground || 'white';
  const isDark = targetBg === 'black';
  const isGray = targetBg === 'gray';

  // Helper to get color by lightness step
  const getColorByStep = (step: number): string => {
    const index = LIGHTNESS_STEPS.indexOf(step);
    return index !== -1 ? colors[index].hex : '#000000';
  };

  // Use same color mapping as SVG export
  const bgColor = isDark ? getColorByStep(14) : isGray ? getColorByStep(85) : getColorByStep(98);
  const textColor = isDark ? getColorByStep(93) : isGray ? getColorByStep(32) : getColorByStep(40);
  const labelColor = isDark ? getColorByStep(96) : isGray ? getColorByStep(26) : getColorByStep(32);
  const borderColor = isDark ? getColorByStep(17) : isGray ? getColorByStep(90) : getColorByStep(96);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${scale.name} Color Matrix - Luma</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bgColor};
      color: ${textColor};
      padding: 2rem;
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .title-container {
      text-align: center;
      margin-bottom: 2rem;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .matrix-container {
      margin: 2rem 0;
      display: flex;
      border-radius: 8px;
      overflow: hidden;
      flex-direction: row;
      justify-content: space-evenly;
      align-items: stretch;
    }

    .matrix-container svg {
      display: block;
    }

    .info {
      margin-top: 2rem;
      padding: 1.5rem;
      background: ${borderColor};
      border-radius: 8px;
      border: 2px solid ${textColor};
    }

    .info h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: ${textColor};
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 0.875rem;
      color: ${labelColor};
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-family: 'Monaco', 'Courier New', monospace;
      color: ${textColor};
      font-weight: 600;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      background: ${borderColor};
      color: ${textColor};
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title-container">
      <h1>${scale.name} Color Matrix</h1>
      <span class="badge">Target Background: ${targetBg}</span>
      <p style="color: ${labelColor}; margin-bottom: 1rem;">
        Opacity variations across all lightness steps
      </p>
    </div>

    <div class="matrix-container">
      ${svg}
    </div>

    <div class="info">
      <h2>Scale Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Base Hue</span>
          <span class="info-value">${scale.hue}°</span>
        </div>
        <div class="info-item">
          <span class="info-label">Base Chroma</span>
          <span class="info-value">${scale.manualChroma.toFixed(4)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Hue Curve</span>
          <span class="info-value">Shift: ${scale.hueCurve.shift}° / Power: ${scale.hueCurve.power}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Chroma Curve</span>
          <span class="info-value">Shift: ${scale.chromaCurve.shift} / Power: ${scale.chromaCurve.power}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Target Background</span>
          <span class="info-value">${targetBg}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Lightness Steps</span>
          <span class="info-value">${colors.length} (L98 → L14)</span>
        </div>
        <div class="info-item">
          <span class="info-label">Opacity Steps</span>
          <span class="info-value">${opacitySteps.length} (100% → 0%)</span>
        </div>
      </div>
    </div>

    <div style="margin-top: 2rem; text-align: center; color: ${labelColor}; font-size: 0.875rem; opacity: 0.7;">
      Generated on ${new Date().toLocaleDateString()} by Luma | P3 OKLCH Color Scale Generator
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate HTML documentation with embedded hue matrix
 * @param scales - Array of all color scales to display
 * @param allColors - Map of scale IDs to their color arrays
 * @param targetBackground - Background theme to use
 */
export function generateHueMatrixHTML(
  scales: ColorScale[],
  allColors: Map<string, ColorResult[]>,
  targetBackground: string = 'canvas-bg'
): string {
  const svg = generateHueMatrix(scales, allColors, targetBackground);
  const isDark = targetBackground === 'black';
  const isGray = targetBackground === 'gray';

  // Use first scale's colors for UI color references
  const firstScaleColors = allColors.get(scales[0]?.id);
  if (!firstScaleColors) return '';

  const getColorByStep = (step: number): string => {
    const index = LIGHTNESS_STEPS.indexOf(step);
    return index !== -1 ? firstScaleColors[index].hex : '#000000';
  };

  const bgColor = isDark ? getColorByStep(14) : isGray ? getColorByStep(85) : getColorByStep(96);
  const textColor = isDark ? getColorByStep(96) : isGray ? getColorByStep(20) : getColorByStep(32);
  const labelColor = isDark ? getColorByStep(70) : isGray ? getColorByStep(40) : getColorByStep(48);
  const borderColor = isDark ? getColorByStep(26) : isGray ? getColorByStep(70) : getColorByStep(80);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Hues Matrix - Luma</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bgColor};
      color: ${textColor};
      padding: 2rem;
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .matrix-container {
      margin: 2rem 0;
      display: inline-block;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    .matrix-container svg {
      display: block;
    }

    .info {
      margin-top: 2rem;
      padding: 1.5rem;
      background: ${borderColor};
      border-radius: 8px;
      border: 2px solid ${borderColor};
    }

    .info h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: ${textColor};
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 0.875rem;
      color: ${labelColor};
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-family: 'Monaco', 'Courier New', monospace;
      color: ${textColor};
      font-weight: 600;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      background: ${borderColor};
      color: ${textColor};
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>All Hues Matrix</h1>
    <span class="badge">Target Background: ${targetBackground}</span>
    <p style="color: ${labelColor}; margin-bottom: 1rem;">
      All color scales showing lightness variations across hues
    </p>

    <div class="matrix-container">
      ${svg}
    </div>

    <div class="info">
      <h2>Matrix Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Total Scales</span>
          <span class="info-value">${scales.length}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Lightness Steps</span>
          <span class="info-value">${LIGHTNESS_STEPS.length} (L98 → L14)</span>
        </div>
        <div class="info-item">
          <span class="info-label">Target Background</span>
          <span class="info-value">${targetBackground}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Total Colors</span>
          <span class="info-value">${scales.length * LIGHTNESS_STEPS.length}</span>
        </div>
      </div>
    </div>

    <div style="margin-top: 2rem; text-align: center; color: ${labelColor}; font-size: 0.875rem; opacity: 0.7;">
      Generated on ${new Date().toLocaleDateString()} by Luma | P3 OKLCH Color Scale Generator
    </div>
  </div>
</body>
</html>`;
}
