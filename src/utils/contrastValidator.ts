import { ColorResult } from './colorEngine';
import { ColorScale } from '../types';

/**
 * Contrast validation utilities for pattern detection across color scales.
 *
 * Progressive enhancement layer on top of existing contrast calculations.
 * Does not modify color generation - only analyzes existing contrast data.
 */

/**
 * Map background preset names to contrast calculation keys.
 * BACKGROUND_PRESETS use simplified names that map to contrast calculation keys.
 */
function mapBackgroundToContrastKey(bgPresetName: string): 'white' | 'gray' | 'black' {
  // White backgrounds (L >= 95)
  if (bgPresetName === 'white' || bgPresetName === 'light1') {
    return 'white';
  }

  // Gray backgrounds (L 85-95)
  if (bgPresetName === 'light2') {
    return 'gray';
  }

  // Black/dark backgrounds (L < 30)
  if (bgPresetName === 'dark1' || bgPresetName === 'dark2' || bgPresetName === 'contrast') {
    return 'black';
  }

  // Legacy fallback mapping for old preset names
  const legacyMap: Record<string, 'white' | 'gray' | 'black'> = {
    'canvas-bg': 'white',
    'canvas-bg-lv1': 'white',
    'canvas-bg-lv2': 'gray',
    'canvas-bg (E)': 'black',
    'canvas-bg-lv1 (E)': 'black',
    'canvas-bg-lv2 (E)': 'black',
    'black': 'black',
    'gray': 'gray',
  };

  if (legacyMap[bgPresetName]) {
    return legacyMap[bgPresetName];
  }

  // Fallback: analyze preset name pattern for lightness hints
  const lightnessMatch = bgPresetName.match(/L(\d+)/i);
  if (lightnessMatch) {
    const lightness = parseInt(lightnessMatch[1], 10);
    if (lightness < 40) return 'black';
    if (lightness >= 85) return 'white';
    return 'gray';
  }

  // Final fallback: check for common dark/light keywords
  if (bgPresetName.toLowerCase().includes('dark') ||
      bgPresetName.toLowerCase().includes('black') ||
      bgPresetName.toLowerCase().includes('contrast')) {
    return 'black';
  }

  if (bgPresetName.toLowerCase().includes('light') ||
      bgPresetName.toLowerCase().includes('canvas')) {
    return 'white';
  }

  // If no pattern matches, log warning and default to gray (safest middle ground)
  console.warn(`Unknown background preset "${bgPresetName}", defaulting to gray for contrast calculation`);
  return 'gray';
}

export interface ContrastThreshold {
  enabled?: boolean;      // Whether threshold validation is active
  minLc: number;          // Minimum APCA Lc (e.g., 60 for body text, 75 for small text)
  minWcag: number;        // Minimum WCAG ratio (e.g., 4.5 for AA, 7.0 for AAA)
  useApca: boolean;       // True = APCA, False = WCAG
}

export interface SwatchContrastResult {
  step: number;           // Lightness step (e.g., 70)
  passes: boolean;        // Whether it meets threshold
  apcaValue: number;      // Actual APCA Lc
  wcagValue: number;      // Actual WCAG ratio
  delta: number;          // How far from threshold (+/- values)
  recommended: boolean;   // Is this the recommended swatch to use?
}

export interface ScaleContrastSummary {
  scaleId: string;
  scaleName: string;
  targetBackground: string;
  contrastMode: string;
  passingSwatches: SwatchContrastResult[];
  failingSwatches: SwatchContrastResult[];
  recommendedStep: number | null;  // Closest passing swatch to L50
  complianceRate: number;          // 0-1 percentage of passing swatches
}

/**
 * Evaluate a single swatch against contrast threshold.
 * Pure function - uses existing contrast data from ColorResult.
 * Prioritizes specificContrast (calculated against actual background) over generic contrast values.
 */
export function evaluateSwatchContrast(
  color: ColorResult,
  targetBg: string,
  threshold: ContrastThreshold
): SwatchContrastResult {
  // Early return if no contrast data available
  if (!color.contrast) {
    return {
      step: Math.round(color.L * 100),
      passes: false,
      apcaValue: 0,
      wcagValue: 1,
      delta: threshold.useApca ? -threshold.minLc : -threshold.minWcag,
      recommended: false
    };
  }

  // Prefer specificContrast (calculated against actual selected background) over generic values
  let apcaValue: number;
  let wcagValue: number;

  if (color.specificContrast && color.targetBackground === targetBg) {
    // Use precise contrast calculated against the actual selected background
    apcaValue = color.specificContrast.apca;
    wcagValue = color.specificContrast.wcag;
  } else {
    // Fallback to generic pre-calculated contrast values
    const contrastKey = mapBackgroundToContrastKey(targetBg);

    apcaValue = contrastKey === 'white'
      ? color.contrast.apca.onWhite
      : contrastKey === 'gray'
      ? color.contrast.apca.onGray
      : color.contrast.apca.onBlack;

    wcagValue = contrastKey === 'white'
      ? color.contrast.wcag.onWhite
      : contrastKey === 'gray'
      ? color.contrast.wcag.onGray
      : color.contrast.wcag.onBlack;
  }

  // Determine pass/fail
  const passes = threshold.useApca
    ? apcaValue >= threshold.minLc
    : wcagValue >= threshold.minWcag;

  // Calculate delta (positive = exceeds threshold, negative = below threshold)
  const delta = threshold.useApca
    ? apcaValue - threshold.minLc
    : wcagValue - threshold.minWcag;

  return {
    step: Math.round(color.L * 100),
    passes,
    apcaValue,
    wcagValue,
    delta,
    recommended: false // Set by findPassingSwatches
  };
}

/**
 * Analyze all swatches in a scale to find contrast patterns.
 * Returns summary with passing/failing swatches and recommendations.
 */
export function analyzeScaleContrast(
  scale: ColorScale,
  colors: ColorResult[],
  threshold: ContrastThreshold
): ScaleContrastSummary {
  const targetBg = scale.targetBackground || 'white';

  // Evaluate all swatches
  const results = colors.map(color =>
    evaluateSwatchContrast(color, targetBg, threshold)
  );

  const passingSwatches = results.filter(r => r.passes);

  // Find recommended swatch (closest to L50 that passes)
  let recommendedStep: number | null = null;
  if (passingSwatches.length > 0) {
    const recommended = passingSwatches.reduce((best, curr) => {
      const currDist = Math.abs(curr.step - 50);
      const bestDist = Math.abs(best.step - 50);
      return currDist < bestDist ? curr : best;
    });
    recommendedStep = recommended.step;

    // Mark it as recommended
    const idx = results.findIndex(r => r.step === recommendedStep);
    if (idx !== -1) {
      results[idx].recommended = true;
    }
  }

  const complianceRate = colors.length > 0
    ? passingSwatches.length / colors.length
    : 0;

  return {
    scaleId: scale.id,
    scaleName: scale.name,
    targetBackground: targetBg,
    contrastMode: scale.contrastMode || 'standard',
    passingSwatches: results.filter(r => r.passes),
    failingSwatches: results.filter(r => !r.passes),
    recommendedStep,
    complianceRate
  };
}

/**
 * Find all swatches across multiple scales that meet contrast requirements.
 * Useful for generating compliance reports or filtering UI.
 */
export function findPassingSwatches(
  scales: ColorScale[],
  colorsMap: Map<string, ColorResult[]>,
  threshold: ContrastThreshold
): ScaleContrastSummary[] {
  return scales.map(scale => {
    const colors = colorsMap.get(scale.id) || [];
    return analyzeScaleContrast(scale, colors, threshold);
  });
}

/**
 * Get default thresholds based on use case.
 */
export const CONTRAST_PRESETS = {
  bodyText: { minLc: 75, minWcag: 4.5, useApca: true },
  largeText: { minLc: 60, minWcag: 3.0, useApca: true },
  uiElements: { minLc: 45, minWcag: 3.0, useApca: true },
  wcagAA: { minLc: 60, minWcag: 4.5, useApca: false },
  wcagAAA: { minLc: 75, minWcag: 7.0, useApca: false },
} as const;

/**
 * Helper to determine if a specific lightness step passes threshold.
 * Useful for quick lookups without full analysis.
 */
export function doesStepPassThreshold(
  step: number,
  colors: ColorResult[],
  targetBg: 'black' | 'white' | 'gray',
  threshold: ContrastThreshold
): boolean {
  const color = colors.find(c => Math.round(c.L * 100) === step);
  if (!color) return false;

  const result = evaluateSwatchContrast(color, targetBg, threshold);
  return result.passes;
}
