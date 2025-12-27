import { converter } from 'culori';
import * as APCA from 'apca-w3';
import { APCA_ALGORITHM_CONSTANTS, APCA_TARGETS as APCA_TARGETS_CENTRALIZED, WCAG_THRESHOLDS } from './constants';
import { relativeLuminance, rgbToHex } from './colorConversions';

// calcAPCA is available but not in TypeScript types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calcAPCA = (APCA as any).calcAPCA as (textColor: string, bgColor: string, places?: number) => number;

/**
 * Contrast calculation utilities for APCA and WCAG
 *
 * APCA (Accessible Perceptual Contrast Algorithm) provides perceptually
 * accurate contrast values (Lc) that better match human vision than WCAG.
 *
 * WCAG 2.1 contrast ratios are maintained as legal minimum requirements.
 */

interface OklchColor {
  mode: 'oklch';
  l: number;
  c: number;
  h: number;
}

interface ContrastResult {
  apca: {
    onBlack: number;
    onWhite: number;
    onGray: number;
  };
  wcag: {
    onBlack: number;
    onWhite: number;
    onGray: number;
  };
  meetsAA: boolean;
  meetsAAA: boolean;
}

const toRgb = converter('rgb');

/**
 * Calculate APCA contrast (Lc value)
 * @param foreground - Foreground color in OKLCH
 * @param background - Background color in OKLCH
 * @returns APCA Lc value (always positive for consistency - magnitude represents contrast strength)
 *
 * Note: APCA natively returns positive values for light-on-dark and negative for dark-on-light.
 * We return absolute values since our use case compares colors against fixed backgrounds
 * (black, white, gray) where polarity is already known from context.
 */
export function calculateAPCA(foreground: OklchColor, background: OklchColor): number {
  const fgRgb = toRgb(foreground);
  const bgRgb = toRgb(background);

  if (!fgRgb || !bgRgb) return 0;

  // Convert to hex strings for APCA (format: #RRGGBB)
  const fgHex = rgbToHex(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgHex = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);

  // Calculate APCA contrast using calcAPCA which accepts hex colors
  const lc = calcAPCA(fgHex, bgHex);

  // calcAPCA returns 0 for invalid input or very low contrast
  if (typeof lc !== 'number' || isNaN(lc)) {
    return 0;
  }

  // Return absolute value - we care about magnitude, not polarity
  // (polarity is implicit from background choice: onBlack/onWhite/onGray)
  return Math.abs(lc);
}

/**
 * Calculate APCA contrast with polarity preserved
 * @param foreground - Foreground color in OKLCH
 * @param background - Background color in OKLCH
 * @returns APCA Lc value with sign (positive = light-on-dark, negative = dark-on-light)
 *
 * Use this when polarity matters for your use case (e.g., determining text vs background contrast direction).
 * Most UI cases should use calculateAPCA() which returns absolute values.
 */
export function calculateAPCAWithPolarity(foreground: OklchColor, background: OklchColor): number {
  const fgRgb = toRgb(foreground);
  const bgRgb = toRgb(background);

  if (!fgRgb || !bgRgb) return 0;

  const fgHex = rgbToHex(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgHex = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);

  const lc = calcAPCA(fgHex, bgHex);

  if (typeof lc !== 'number' || isNaN(lc)) {
    return 0;
  }

  return lc; // Preserve sign
}

/**
 * Calculate WCAG 2.1 contrast ratio
 * @param foreground - Foreground color in OKLCH
 * @param background - Background color in OKLCH
 * @returns WCAG contrast ratio (1-21)
 */
export function calculateWCAG(foreground: OklchColor, background: OklchColor): number {
  const fgRgb = toRgb(foreground);
  const bgRgb = toRgb(background);

  if (!fgRgb || !bgRgb) return 1;

  const fgLum = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate contrast against multiple backgrounds
 */
export function validateContrast(color: OklchColor): ContrastResult {
  const black: OklchColor = { mode: 'oklch', l: 0.12, c: 0, h: 0 }; // contrast
  const white: OklchColor = { mode: 'oklch', l: 1, c: 0, h: 0 }; // white
  const gray: OklchColor = { mode: 'oklch', l: 0.93, c: 0, h: 0 }; // light2

  const wcagBlack = calculateWCAG(color, black);
  const wcagWhite = calculateWCAG(color, white);
  const wcagGray = calculateWCAG(color, gray);

  // Determine highest contrast for WCAG validation
  const maxWCAG = Math.max(wcagBlack, wcagWhite, wcagGray);

  return {
    apca: {
      onBlack: calculateAPCA(color, black),
      onWhite: calculateAPCA(color, white),
      onGray: calculateAPCA(color, gray),
    },
    wcag: {
      onBlack: wcagBlack,
      onWhite: wcagWhite,
      onGray: wcagGray,
    },
    meetsAA: maxWCAG >= WCAG_THRESHOLDS.AA_NORMAL,
    meetsAAA: maxWCAG >= WCAG_THRESHOLDS.AAA_NORMAL,
  };
}

/**
 * Re-export relativeLuminance for backward compatibility
 * @deprecated Import directly from './colorConversions' instead
 */
export { relativeLuminance } from './colorConversions';

/**
 * APCA target values for common use cases
 * @deprecated Use APCA_TARGETS from constants.ts instead. Kept for backward compatibility.
 */
export const APCA_TARGETS = {
  // For light text on dark backgrounds (positive Lc)
  lightOnDark: {
    bodyText: APCA_TARGETS_CENTRALIZED.bodyText,
    largeText: APCA_TARGETS_CENTRALIZED.largeText,
    placeholder: APCA_TARGETS_CENTRALIZED.placeholder,
    decorative: APCA_TARGETS_CENTRALIZED.decorative,
  },
  // For dark text on light backgrounds (negative Lc, stored as positive)
  darkOnLight: {
    bodyText: 90,      // Higher requirement for dark-on-light
    largeText: 75,
    placeholder: 60,
    decorative: 45,
  },
};

/**
 * WCAG minimum requirements
 * @deprecated Use WCAG_THRESHOLDS from constants.ts instead. Re-exported for backward compatibility.
 */
export const WCAG_MINIMUMS = WCAG_THRESHOLDS;

/**
 * Helper: Calculate WCAG 2.1 contrast ratio from two luminance values
 */
export function getContrast(lum1: number, lum2: number): number {
  const L1 = Math.max(lum1, lum2);
  const L2 = Math.min(lum1, lum2);
  return (L1 + 0.05) / (L2 + 0.05);
}

/**
 * Helper: Calculate APCA contrast from two luminance values
 * Using the same algorithm as in opacityBlending.ts
 */
export function getAPCA(txtY: number, bgY: number): number {
  const {
    normBG,
    normTXT,
    revTXT,
    revBG,
    blkThrs,
    blkClmp,
    scaleBoW,
    scaleWoB,
    loConThresh,
    loConOffset,
    deltaYmin,
  } = APCA_ALGORITHM_CONSTANTS;

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
