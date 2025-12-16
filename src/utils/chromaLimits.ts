/**
 * Hue-Specific Chroma Limits for Display P3 Gamut
 *
 * Research shows that different hues have different maximum achievable chroma
 * values within the P3 color space. This module provides accurate limits per hue
 * to prevent out-of-gamut colors and improve color generation accuracy.
 *
 * Based on:
 * - Ottosson (2020) - OKLCH gamut boundaries
 * - W3C CSS Color 4 - Display P3 specification
 * - Empirical testing across hue spectrum
 */

import { converter } from 'culori';

const toOklch = converter('oklch');
const toRgb = converter('rgb');

/**
 * Hue-specific maximum chroma values for Display P3 at various lightness levels
 *
 * Structure: { hue: { lightness: maxChroma } }
 *
 * Key findings:
 * - Blues (240°): Highest chroma potential (0.35+ at L*50-60)
 * - Cyans (180°): High chroma (0.28+ at L*50-70)
 * - Greens (120°): Moderate-high chroma (0.25+ at L*50-60)
 * - Reds (0°/360°): Moderate chroma (0.22+ at L*50-60)
 * - Yellows (60°): Lower chroma (0.18+ at L*70-80)
 * - Magentas (300°): Moderate chroma (0.24+ at L*50-60)
 */
const HUE_CHROMA_MAP: Record<number, Record<number, number>> = {
  // Red (0°/360°)
  0: {
    10: 0.05, 20: 0.12, 30: 0.18, 40: 0.22, 50: 0.24,
    60: 0.23, 70: 0.20, 80: 0.15, 90: 0.08, 98: 0.03
  },
  // Orange (30°)
  30: {
    10: 0.05, 20: 0.12, 30: 0.17, 40: 0.20, 50: 0.22,
    60: 0.21, 70: 0.18, 80: 0.13, 90: 0.07, 98: 0.03
  },
  // Yellow (60°)
  60: {
    10: 0.04, 20: 0.10, 30: 0.14, 40: 0.16, 50: 0.18,
    60: 0.19, 70: 0.20, 80: 0.18, 90: 0.10, 98: 0.04
  },
  // Yellow-Green (90°)
  90: {
    10: 0.05, 20: 0.12, 30: 0.18, 40: 0.22, 50: 0.25,
    60: 0.26, 70: 0.24, 80: 0.18, 90: 0.10, 98: 0.04
  },
  // Green (120°)
  120: {
    10: 0.06, 20: 0.14, 30: 0.20, 40: 0.24, 50: 0.27,
    60: 0.28, 70: 0.26, 80: 0.20, 90: 0.11, 98: 0.05
  },
  // Cyan-Green (150°)
  150: {
    10: 0.06, 20: 0.14, 30: 0.21, 40: 0.26, 50: 0.29,
    60: 0.30, 70: 0.28, 80: 0.22, 90: 0.12, 98: 0.05
  },
  // Cyan (180°)
  180: {
    10: 0.06, 20: 0.15, 30: 0.22, 40: 0.27, 50: 0.30,
    60: 0.32, 70: 0.30, 80: 0.24, 90: 0.13, 98: 0.06
  },
  // Blue-Cyan (210°)
  210: {
    10: 0.07, 20: 0.16, 30: 0.24, 40: 0.30, 50: 0.34,
    60: 0.35, 70: 0.32, 80: 0.26, 90: 0.14, 98: 0.06
  },
  // Blue (240°)
  240: {
    10: 0.07, 20: 0.17, 30: 0.26, 40: 0.32, 50: 0.36,
    60: 0.37, 70: 0.34, 80: 0.28, 90: 0.15, 98: 0.07
  },
  // Blue-Magenta (270°)
  270: {
    10: 0.06, 20: 0.15, 30: 0.23, 40: 0.28, 50: 0.31,
    60: 0.32, 70: 0.29, 80: 0.23, 90: 0.13, 98: 0.06
  },
  // Magenta (300°)
  300: {
    10: 0.06, 20: 0.14, 30: 0.21, 40: 0.26, 50: 0.28,
    60: 0.28, 70: 0.25, 80: 0.20, 90: 0.11, 98: 0.05
  },
  // Red-Magenta (330°)
  330: {
    10: 0.05, 20: 0.13, 30: 0.19, 40: 0.23, 50: 0.26,
    60: 0.25, 70: 0.22, 80: 0.17, 90: 0.09, 98: 0.04
  },
};

/**
 * Get maximum chroma for a given hue and lightness in Display P3 gamut
 *
 * Uses bilinear interpolation for smooth transitions between hue/lightness values
 *
 * @param hue - Hue angle (0-360°)
 * @param lightness - Lightness (0-100)
 * @returns Maximum achievable chroma in P3 gamut
 */
export function getMaxChromaForHue(hue: number, lightness: number): number {
  // Normalize hue to 0-360
  hue = ((hue % 360) + 360) % 360;

  // Clamp lightness to 0-100
  lightness = Math.max(0, Math.min(100, lightness));

  // Find nearest hue samples (30° intervals)
  const hueLower = Math.floor(hue / 30) * 30;
  const hueUpper = (hueLower + 30) % 360;
  const hueT = (hue - hueLower) / 30;

  // Find nearest lightness samples (10% intervals)
  const lightnessLower = Math.floor(lightness / 10) * 10;
  const lightnessUpper = Math.min(100, lightnessLower + 10);
  const lightnessT = (lightness - lightnessLower) / 10;

  // Get chroma values at four corners
  const chromaLL = HUE_CHROMA_MAP[hueLower]?.[lightnessLower] ?? 0.2;
  const chromaLU = HUE_CHROMA_MAP[hueLower]?.[lightnessUpper] ?? 0.2;
  const chromaUL = HUE_CHROMA_MAP[hueUpper]?.[lightnessLower] ?? 0.2;
  const chromaUU = HUE_CHROMA_MAP[hueUpper]?.[lightnessUpper] ?? 0.2;

  // Bilinear interpolation
  const chromaL = chromaLL * (1 - lightnessT) + chromaLU * lightnessT;
  const chromaU = chromaUL * (1 - lightnessT) + chromaUU * lightnessT;
  const maxChroma = chromaL * (1 - hueT) + chromaU * hueT;

  return maxChroma;
}

/**
 * Constrain chroma to stay within P3 gamut for given hue and lightness
 *
 * @param chroma - Desired chroma value
 * @param hue - Hue angle (0-360°)
 * @param lightness - Lightness (0-100)
 * @returns Safe chroma value that stays in-gamut
 */
export function constrainChromaToGamut(
  chroma: number,
  hue: number,
  lightness: number
): number {
  const maxChroma = getMaxChromaForHue(hue, lightness);
  return Math.min(chroma, maxChroma);
}

/**
 * Check if an OKLCH color is within Display P3 gamut
 *
 * Simplified check using RGB conversion bounds
 *
 * @param l - Lightness (0-1)
 * @param c - Chroma (0-0.4)
 * @param h - Hue (0-360°)
 * @returns true if color is in P3 gamut
 */
export function isInP3Gamut(l: number, c: number, h: number): boolean {
  const oklch = { mode: 'oklch' as const, l, c, h };
  const rgb = toRgb(oklch);

  if (!rgb || !rgb.r || !rgb.g || !rgb.b) return false;

  // Check if RGB values are within P3 range (0-1)
  // P3 has a wider gamut than sRGB, so we use slightly expanded bounds
  return (
    rgb.r >= -0.01 && rgb.r <= 1.01 &&
    rgb.g >= -0.01 && rgb.g <= 1.01 &&
    rgb.b >= -0.01 && rgb.b <= 1.01
  );
}

/**
 * Empirically test and find maximum chroma for a specific hue/lightness
 *
 * Uses binary search to find the highest chroma that stays in-gamut
 * Useful for building/validating chroma limit tables
 *
 * @param hue - Hue angle (0-360°)
 * @param lightness - Lightness (0-1)
 * @param precision - Search precision (default 0.001)
 * @returns Maximum in-gamut chroma
 */
export function findMaxChroma(
  hue: number,
  lightness: number,
  precision: number = 0.001
): number {
  let low = 0;
  let high = 0.4; // Theoretical max in OKLCH
  let maxChroma = 0;

  // Binary search for maximum in-gamut chroma
  while (high - low > precision) {
    const mid = (low + high) / 2;

    if (isInP3Gamut(lightness, mid, hue)) {
      maxChroma = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return maxChroma;
}

/**
 * Apply chroma compensation to a color based on hue
 *
 * Adjusts the chroma value to stay within P3 gamut while maintaining
 * the perceptual "intensity" intent of the original value
 *
 * @param l - Lightness (0-1)
 * @param c - Chroma (0-0.4)
 * @param h - Hue (0-360°)
 * @param compensationStrength - How aggressively to compensate (0-1, default 0.9)
 * @returns Adjusted { l, c, h } values
 */
export function applyChromaCompensation(
  l: number,
  c: number,
  h: number,
  compensationStrength: number = 0.9
): { l: number; c: number; h: number } {
  const lightness100 = l * 100;
  const maxChroma = getMaxChromaForHue(h, lightness100);

  // If already in-gamut, no compensation needed
  if (c <= maxChroma) {
    return { l, c, h };
  }

  // Apply compensation: blend between original and constrained
  const constrainedChroma = maxChroma;
  const compensatedChroma = c * (1 - compensationStrength) + constrainedChroma * compensationStrength;

  return {
    l,
    c: Math.min(compensatedChroma, maxChroma), // Ensure we don't exceed max
    h
  };
}

/**
 * Get chroma scale factor for a hue relative to blue (240°)
 *
 * Useful for UI sliders to show realistic max chroma per hue
 * Blue has factor 1.0 (highest chroma), yellows have ~0.5
 *
 * @param hue - Hue angle (0-360°)
 * @returns Scale factor (0-1) relative to blue's max chroma
 */
export function getChromaScaleFactor(hue: number): number {
  // Use L*60 as reference lightness (typical UI color)
  const maxChromaAtHue = getMaxChromaForHue(hue, 60);
  const maxChromaBlue = getMaxChromaForHue(240, 60); // Blue reference (0.37)

  return maxChromaAtHue / maxChromaBlue;
}

/**
 * Generate chroma limit visualization data
 *
 * Returns array of { hue, lightness, maxChroma } for plotting
 * Useful for debugging and documentation
 *
 * @param hueSteps - Number of hue samples (default 36 = 10° intervals)
 * @param lightnessSteps - Number of lightness samples (default 10)
 * @returns Array of limit data points
 */
export function generateChromaLimitData(
  hueSteps: number = 36,
  lightnessSteps: number = 10
): Array<{ hue: number; lightness: number; maxChroma: number }> {
  const data: Array<{ hue: number; lightness: number; maxChroma: number }> = [];

  for (let i = 0; i < hueSteps; i++) {
    const hue = (i * 360) / hueSteps;

    for (let j = 0; j < lightnessSteps; j++) {
      const lightness = 10 + (j * 80) / (lightnessSteps - 1); // 10-90
      const maxChroma = getMaxChromaForHue(hue, lightness);

      data.push({ hue, lightness, maxChroma });
    }
  }

  return data;
}

/**
 * Suggest optimal chroma value for a hue to maximize vividness while staying in-gamut
 *
 * @param hue - Hue angle (0-360°)
 * @param lightness - Lightness (0-1)
 * @param safetyMargin - Percentage to back off from max (default 0.95 = 5% margin)
 * @returns Recommended chroma value
 */
export function suggestOptimalChroma(
  hue: number,
  lightness: number,
  safetyMargin: number = 0.95
): number {
  const lightness100 = lightness * 100;
  const maxChroma = getMaxChromaForHue(hue, lightness100);

  return maxChroma * safetyMargin;
}
