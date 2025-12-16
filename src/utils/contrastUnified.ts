/**
 * Unified Contrast Calculation Utility
 *
 * Consolidates all contrast calculation methods into a single, consistent interface.
 * Supports both direct color-to-color contrast and opacity-blended contrast calculations.
 *
 * This utility bridges the gap between:
 * - contrast.ts: Direct OKLCH color-to-color contrast
 * - MatrixCell's unique opacity-blended contrast methods
 * - Various APCA/WCAG calculation patterns across the codebase
 */

import { converter } from 'culori';
import * as APCA from 'apca-w3';
import { blendOKLCHOnBackground } from './opacityBlending';

// calcAPCA is available but not in TypeScript types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calcAPCA = (APCA as any).calcAPCA as (textColor: string, bgColor: string, places?: number) => number;

const toRgb = converter('rgb');

interface OklchColor {
  mode: 'oklch';
  l: number;
  c: number;
  h: number;
}

interface ContrastResult {
  apca: number;    // APCA Lc value (absolute)
  wcag: number;    // WCAG contrast ratio (1-21)
}

interface OpacityBlendOptions {
  opacity: number;          // Opacity percentage (0-100)
  bgHex: string;           // Background color as hex
  blendMode?: 'srgb' | 'linear';  // Blend mode
}

/**
 * Calculate relative luminance for WCAG contrast
 * Uses sRGB gamma correction per WCAG 2.1 specification
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = Math.max(0, Math.min(1, val));
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Convert RGB values to hex string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (val: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(val * 255)));
    return clamped.toString(16).padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate WCAG 2.1 contrast ratio from two luminance values
 * @param lum1 - First luminance value (0-1)
 * @param lum2 - Second luminance value (0-1)
 * @returns WCAG contrast ratio (1-21)
 */
export function getContrastFromLuminance(lum1: number, lum2: number): number {
  const L1 = Math.max(lum1, lum2);
  const L2 = Math.min(lum1, lum2);
  return (L1 + 0.05) / (L2 + 0.05);
}

/**
 * Calculate APCA contrast from two luminance values
 * Uses APCA constants and algorithm for perceptually uniform contrast
 * @param txtY - Text/foreground luminance (0-1)
 * @param bgY - Background luminance (0-1)
 * @returns APCA Lc value (with polarity, positive = light-on-dark)
 */
export function getAPCAFromLuminance(txtY: number, bgY: number): number {
  // APCA constants (from APCA-W3 specification)
  const normBG = 0.56;
  const normTXT = 0.57;
  const revTXT = 0.62;
  const revBG = 0.65;
  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const scaleBoW = 1.14;
  const scaleWoB = 1.14;
  const loConThresh = 0.1;
  const loConOffset = 0.027;
  const deltaYmin = 0.0005;

  // Soft clamp black levels
  bgY = bgY > blkThrs ? bgY : bgY + Math.pow(blkThrs - bgY, blkClmp);
  txtY = txtY > blkThrs ? txtY : txtY + Math.pow(blkThrs - txtY, blkClmp);

  // Calculate SAPC
  let SAPC = 0;
  let outputContrast = 0;

  if (Math.abs(bgY - txtY) < deltaYmin) {
    return 0;
  }

  if (bgY > txtY) {
    // Black text on white background
    SAPC = (Math.pow(bgY, normBG) - Math.pow(txtY, normTXT)) * scaleBoW;
    outputContrast = SAPC < loConThresh ? 0 : SAPC - loConOffset;
  } else {
    // White text on black background
    SAPC = (Math.pow(bgY, revBG) - Math.pow(txtY, revTXT)) * scaleWoB;
    outputContrast = SAPC > -loConThresh ? 0 : SAPC + loConOffset;
  }

  return outputContrast * 100;
}

/**
 * Calculate unified contrast between two OKLCH colors
 * Supports direct color-to-color contrast calculation
 *
 * @param foreground - Foreground/text color in OKLCH
 * @param background - Background color in OKLCH
 * @returns ContrastResult with APCA and WCAG values
 */
export function calculateUnifiedContrast(
  foreground: OklchColor,
  background: OklchColor
): ContrastResult {
  const fgRgb = toRgb(foreground);
  const bgRgb = toRgb(background);

  if (!fgRgb || !bgRgb) {
    return { apca: 0, wcag: 1 };
  }

  // Calculate luminance for both colors
  const fgLum = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  // Calculate WCAG contrast
  const wcag = getContrastFromLuminance(fgLum, bgLum);

  // Calculate APCA contrast using calcAPCA for consistency
  const fgHex = rgbToHex(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgHex = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);
  const apca = calcAPCA(fgHex, bgHex);

  return {
    apca: typeof apca === 'number' && !isNaN(apca) ? Math.abs(apca) : 0,
    wcag: wcag
  };
}

/**
 * Calculate unified contrast with opacity blending
 * Supports opacity-blended colors (MatrixCell use case)
 *
 * @param foreground - Foreground color in OKLCH
 * @param background - Background color in OKLCH
 * @param blendOptions - Opacity and blend mode options
 * @returns ContrastResult with APCA and WCAG values
 */
export function calculateUnifiedContrastWithOpacity(
  foreground: OklchColor,
  background: OklchColor,
  blendOptions: OpacityBlendOptions
): ContrastResult {
  const bgRgb = toRgb(background);

  if (!bgRgb) {
    return { apca: 0, wcag: 1 };
  }

  // Calculate background luminance
  const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  // Blend foreground with opacity
  const blendResult = blendOKLCHOnBackground(
    foreground.l,
    foreground.c,
    foreground.h,
    blendOptions.opacity,
    blendOptions.bgHex,
    blendOptions.blendMode || 'srgb'
  );

  // Calculate contrasts using blended luminance
  const wcag = getContrastFromLuminance(blendResult.luminance, bgLum);
  const apca = getAPCAFromLuminance(blendResult.luminance, bgLum);

  return {
    apca: Math.abs(apca),
    wcag: wcag
  };
}

/**
 * Calculate unified contrast from pre-computed luminance values
 * Useful for performance-critical paths where luminance is already available
 *
 * @param fgLuminance - Foreground luminance (0-1)
 * @param bgLuminance - Background luminance (0-1)
 * @returns ContrastResult with APCA and WCAG values
 */
export function calculateUnifiedContrastFromLuminance(
  fgLuminance: number,
  bgLuminance: number
): ContrastResult {
  const wcag = getContrastFromLuminance(fgLuminance, bgLuminance);
  const apca = getAPCAFromLuminance(fgLuminance, bgLuminance);

  return {
    apca: Math.abs(apca),
    wcag: wcag
  };
}

/**
 * Batch calculate contrast for multiple color pairs
 * Optimized for bulk operations in Matrix View
 *
 * @param colorPairs - Array of [foreground, background] pairs
 * @returns Array of ContrastResults
 */
export function batchCalculateContrast(
  colorPairs: Array<[OklchColor, OklchColor]>
): ContrastResult[] {
  return colorPairs.map(([fg, bg]) => calculateUnifiedContrast(fg, bg));
}

/**
 * Check if contrast meets WCAG AA requirements
 * @param wcagRatio - WCAG contrast ratio
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns true if meets AA requirements
 */
export function meetsWCAGAA(wcagRatio: number, isLargeText: boolean = false): boolean {
  return wcagRatio >= (isLargeText ? 3.0 : 4.5);
}

/**
 * Check if contrast meets WCAG AAA requirements
 * @param wcagRatio - WCAG contrast ratio
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns true if meets AAA requirements
 */
export function meetsWCAGAAA(wcagRatio: number, isLargeText: boolean = false): boolean {
  return wcagRatio >= (isLargeText ? 4.5 : 7.0);
}

/**
 * Check if contrast meets APCA Bronze/Silver/Gold levels
 * @param apcaLc - APCA Lc value (absolute)
 * @returns Object with bronze/silver/gold compliance
 */
export function getAPCACompliance(apcaLc: number): {
  bronze: boolean;  // Lc >= 60
  silver: boolean;  // Lc >= 75
  gold: boolean;    // Lc >= 90
} {
  return {
    bronze: apcaLc >= 60,
    silver: apcaLc >= 75,
    gold: apcaLc >= 90
  };
}

/**
 * APCA target values for common use cases
 */
export const APCA_TARGETS = {
  bodyText: 75,      // Standard body text
  largeText: 60,     // Headlines, large UI text
  smallText: 90,     // Small or critical text
  placeholder: 45,   // Placeholder text, disabled states
  decorative: 30,    // Non-text UI elements
  uiElements: 45,    // Interactive UI components
} as const;

/**
 * WCAG minimum requirements
 */
export const WCAG_MINIMUMS = {
  AAA_NORMAL: 7.0,   // AAA for normal text
  AA_NORMAL: 4.5,    // AA for normal text (legal minimum)
  AAA_LARGE: 4.5,    // AAA for large text (18pt+)
  AA_LARGE: 3.0,     // AA for large text
  UI_COMPONENT: 3.0, // Non-text UI components (SC 1.4.11)
} as const;
