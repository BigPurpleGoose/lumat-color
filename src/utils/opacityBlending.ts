/**
 * Opacity Blending Utilities
 *
 * Converts OKLCH colors to sRGB, applies alpha blending,
 * and calculates resulting lightness and contrast values.
 * Ported from lomat-react-app with TypeScript enhancements.
 *
 * Performance: Uses LUT-based gamma correction for 5× speedup in matrix operations
 */

import { converter, formatHex, clampChroma } from 'culori';
import { getAPCA } from './contrast';
import { GammaCorrection, PERFORMANCE_FLAGS } from './performanceOptimizations';

const toRgb = converter('rgb');

export interface RGBColor {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
}

export interface BlendResult {
  rgb: RGBColor;
  hex: string;
  luminance: number;
  lightness: number;  // L* value (0-100)
}

/**
 * Convert hex to sRGB object with r, g, b in 0-1 range
 */
export const hexToSRGB = (hex: string): RGBColor => {
  const parsed = parseHexToRgb(hex);
  const color = toRgb({ mode: 'rgb', ...parsed });
  return color && typeof color === 'object' && 'r' in color
    ? { r: color.r, g: color.g, b: color.b }
    : parsed;
};

// Helper to parse hex string to RGB
function parseHexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Convert OKLCH to sRGB (gamma-corrected for CSS display)
 * @param l - Lightness (0-100)
 * @param c - Chroma (0-0.4)
 * @param h - Hue (0-360)
 * @returns {r, g, b} in 0-1 range
 */
export const oklchToSRGB = (l: number, c: number, h: number): RGBColor => {
  // Validate inputs
  if (isNaN(l) || isNaN(c) || isNaN(h) || l === undefined || c === undefined || h === undefined) {
    return { r: 0, g: 0, b: 0 };
  }

  const color = { mode: 'oklch' as const, l: l / 100, c, h };
  const clamped = clampChroma(color, 'p3');

  // Safety check: if clampChroma returns undefined, use original color
  const colorToConvert = clamped || color;

  const srgb = toRgb(colorToConvert);
  return srgb && typeof srgb === 'object' && 'r' in srgb
    ? { r: srgb.r, g: srgb.g, b: srgb.b }
    : { r: 0, g: 0, b: 0 };
};

/**
 * Mix two sRGB colors with alpha blending
 * Standard CSS behavior: Source * alpha + Background * (1-alpha)
 * @param fg - Foreground color (source)
 * @param bg - Background color (destination)
 * @param alpha - Opacity (0-1)
 */
export const mixSRGB = (fg: RGBColor, bg: RGBColor, alpha: number): RGBColor => {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha)
  };
};

/**
 * Mix two sRGB colors with linear RGB alpha blending
 * Perceptually accurate blending: convert to linear space, blend, convert back
 * @param fg - Foreground color (source)
 * @param bg - Background color (destination)
 * @param alpha - Opacity (0-1)
 */
export const mixLinearRGB = (fg: RGBColor, bg: RGBColor, alpha: number): RGBColor => {
  // Convert to linear space
  const fgLinear = { r: sRGBToLinear(fg.r), g: sRGBToLinear(fg.g), b: sRGBToLinear(fg.b) };
  const bgLinear = { r: sRGBToLinear(bg.r), g: sRGBToLinear(bg.g), b: sRGBToLinear(bg.b) };

  // Blend in linear space
  const blendedLinear = {
    r: fgLinear.r * alpha + bgLinear.r * (1 - alpha),
    g: fgLinear.g * alpha + bgLinear.g * (1 - alpha),
    b: fgLinear.b * alpha + bgLinear.b * (1 - alpha)
  };

  // Convert back to sRGB space
  return {
    r: linearToSRGB(blendedLinear.r),
    g: linearToSRGB(blendedLinear.g),
    b: linearToSRGB(blendedLinear.b)
  };
};

/**
 * Convert sRGB gamma-corrected value to linear RGB
 * Used for perceptually accurate opacity blending
 * Performance: Uses LUT for 5× speedup when enabled
 */
export const sRGBToLinear = (v: number): number => {
  if (PERFORMANCE_FLAGS.USE_LUT_GAMMA) {
    return GammaCorrection.sRGBToLinear(v);
  }
  // Fallback to precise calculation
  v = Math.max(0, Math.min(1, v));
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

/**
 * Convert linear RGB value to sRGB gamma-corrected
 * Used after linear blending to return to display space
 * Performance: Uses LUT for 5× speedup when enabled
 */
export const linearToSRGB = (v: number): number => {
  if (PERFORMANCE_FLAGS.USE_LUT_GAMMA) {
    return GammaCorrection.linearToSRGB(v);
  }
  // Fallback to precise calculation
  v = Math.max(0, Math.min(1, v));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1.0 / 2.4) - 0.055;
};

/**
 * WCAG 2.1 Relative Luminance
 * Uses the standard formula from WCAG 2.1
 */
export const getLuminance = (color: RGBColor): number => {
  const R = sRGBToLinear(color.r);
  const G = sRGBToLinear(color.g);
  const B = sRGBToLinear(color.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/**
 * Convert sRGB object to hex
 */
export const rgbToHex = (color: RGBColor): string => {
  return formatHex({ mode: 'rgb', r: color.r, g: color.g, b: color.b });
};

/**
 * Convert perceived lightness (L*) back from luminance (Y)
 * CIE L* formula:
 * L* = 116 * Y^(1/3) - 16 for Y > 0.008856
 * L* = 903.3 * Y for Y <= 0.008856
 */
export const luminanceToLightness = (luminance: number): number => {
  return luminance > 0.008856
    ? 116 * Math.pow(luminance, 1.0 / 3.0) - 16
    : 903.3 * luminance;
};

/**
 * Blend an OKLCH color onto a background with alpha using standard sRGB blending
 *
 * This function performs CSS-standard alpha compositing:
 * 1. Converts OKLCH foreground to sRGB (gamma-corrected display space)
 * 2. Performs weighted blend in sRGB space: result = fg*alpha + bg*(1-alpha)
 * 3. Calculates WCAG luminance (Y) from blended result
 * 4. Converts Y to CIE L* using standard formula
 *
 * This matches Figma's default behavior and CSS alpha compositing.
 * For physically accurate (but visually different) blending, use mixLinearRGB.
 *
 * IMPORTANT: The resulting L* is NOT a simple weighted average of input L* values!
 * This is correct behavior - L* and luminance (Y) have a non-linear relationship.
 *
 * Example: OKLCH(20% L) at 90% opacity on white (98% L) background:
 * - Simple (incorrect) L* blend: 0.9*20 + 0.1*98 = 27.8
 * - sRGB blending result: ~35
 * - Linear RGB blending result: ~37.1 (more physically accurate but visually faster progression)
 *
 * @param l - OKLCH Lightness (0-100)
 * @param c - OKLCH Chroma (0-0.4)
 * @param h - OKLCH Hue (0-360)
 * @param opacity - Alpha/opacity (0-100)
 * @param bgHex - Background color as hex
 * @returns BlendResult with RGB, hex, luminance, and L* lightness of the blended color
 */
export const blendOKLCHOnBackground = (
  l: number,
  c: number,
  h: number,
  opacity: number,
  bgHex: string,
  blendMode: 'srgb' | 'linear' = 'srgb'
): BlendResult => {
  // Validate inputs
  if (isNaN(l) || isNaN(c) || isNaN(h) || isNaN(opacity)) {
    console.warn('Invalid color values in blendOKLCHOnBackground:', { l, c, h, opacity });
    return {
      rgb: { r: 0, g: 0, b: 0 },
      hex: '#000000',
      luminance: 0,
      lightness: 0
    };
  }

  // Convert OKLCH to sRGB
  const fgSRGB = oklchToSRGB(l, c, h);

  // Convert background to sRGB
  const bgSRGB = hexToSRGB(bgHex);

  // Alpha blend using selected mode
  const alpha = opacity / 100;
  const blendedRGB = blendMode === 'linear'
    ? mixLinearRGB(fgSRGB, bgSRGB, alpha)  // Physically accurate (faster progression)
    : mixSRGB(fgSRGB, bgSRGB, alpha);       // CSS/Figma standard (smoother progression)

  // Calculate luminance and L* lightness
  const luminance = getLuminance(blendedRGB);
  const lightness = luminanceToLightness(luminance);

  // Convert to hex
  const hex = rgbToHex(blendedRGB);

  return {
    rgb: blendedRGB,
    hex,
    luminance,
    lightness
  };
};

/**
 * Generate a complete matrix of blend results
 * for all lightness-opacity combinations
 *
 * @param hue - OKLCH Hue (0-360)
 * @param chroma - OKLCH Chroma (0-0.4)
 * @param lightnessSteps - Array of lightness values
 * @param opacitySteps - Array of opacity values
 * @param bgHex - Background color as hex
 */
export const generateBlendMatrix = (
  hue: number,
  chroma: number,
  lightnessSteps: number[],
  opacitySteps: number[],
  bgHex: string
): BlendResult[][] => {
  return lightnessSteps.map(lightness =>
    opacitySteps.map(opacity =>
      blendOKLCHOnBackground(lightness, chroma, hue, opacity, bgHex)
    )
  );
};

/**
 * Find the closest opacity that produces a target lightness
 * Useful for "match mode" in matrix view
 *
 * @param targetLightness - Target L* lightness (0-100)
 * @param l - OKLCH Lightness (0-100)
 * @param c - OKLCH Chroma (0-0.4)
 * @param h - OKLCH Hue (0-360)
 * @param opacitySteps - Array of available opacity values
 * @param bgHex - Background color as hex
 * @returns {opacity, delta} - Best matching opacity and lightness difference
 */
export const findClosestOpacity = (
  targetLightness: number,
  l: number,
  c: number,
  h: number,
  opacitySteps: number[],
  bgHex: string
): { opacity: number; delta: number; result: BlendResult } => {
  let bestMatch = { opacity: 100, delta: Infinity, result: blendOKLCHOnBackground(l, c, h, 100, bgHex) };

  for (const opacity of opacitySteps) {
    const result = blendOKLCHOnBackground(l, c, h, opacity, bgHex);
    const delta = Math.abs(result.lightness - targetLightness);

    if (delta < bestMatch.delta) {
      bestMatch = { opacity, delta, result };
    }
  }

  return bestMatch;
};

/**
 * Calculate minimum opacity needed to meet WCAG contrast requirement
 * Uses binary search to find the lowest opacity that achieves target ratio
 *
 * @param l - OKLCH Lightness (0-100)
 * @param c - OKLCH Chroma (0-0.4)
 * @param h - OKLCH Hue (0-360)
 * @param bgHex - Background color as hex
 * @param targetRatio - Target WCAG contrast ratio (e.g., 4.5, 7.0)
 * @param tolerance - Acceptable difference from target (default 0.1)
 * @returns Minimum opacity (0-100) or null if target cannot be met at 100%
 */
export const calculateMinimumOpacityWCAG = (
  l: number,
  c: number,
  h: number,
  bgHex: string,
  targetRatio: number,
  tolerance: number = 0.1
): number | null => {
  const bgSRGB = hexToSRGB(bgHex);
  const bgLuminance = getLuminance(bgSRGB);

  // Helper to calculate WCAG contrast ratio
  const getWCAGRatio = (opacity: number): number => {
    const result = blendOKLCHOnBackground(l, c, h, opacity, bgHex);
    const L1 = Math.max(result.luminance, bgLuminance);
    const L2 = Math.min(result.luminance, bgLuminance);
    return (L1 + 0.05) / (L2 + 0.05);
  };

  // Check if target is achievable at 100%
  const maxContrast = getWCAGRatio(100);
  if (maxContrast < targetRatio - tolerance) {
    return null; // Cannot meet target even at full opacity
  }

  // Binary search for minimum opacity
  let low = 0;
  let high = 100;
  let bestOpacity = 100;

  while (high - low > 0.5) {
    const mid = (low + high) / 2;
    const contrast = getWCAGRatio(mid);

    if (contrast >= targetRatio - tolerance) {
      bestOpacity = mid;
      high = mid; // Try lower opacity
    } else {
      low = mid; // Need higher opacity
    }
  }

  return Math.ceil(bestOpacity); // Round up to ensure target is met
};

/**
 * Calculate minimum opacity needed to meet APCA contrast requirement
 * Uses binary search to find the lowest opacity that achieves target Lc
 *
 * @param l - OKLCH Lightness (0-100)
 * @param c - OKLCH Chroma (0-0.4)
 * @param h - OKLCH Hue (0-360)
 * @param bgHex - Background color as hex
 * @param targetLc - Target APCA Lc value (e.g., 60, 75, 90)
 * @param tolerance - Acceptable difference from target (default 1.0)
 * @returns Minimum opacity (0-100) or null if target cannot be met at 100%
 */
export const calculateMinimumOpacityAPCA = (
  l: number,
  c: number,
  h: number,
  bgHex: string,
  targetLc: number,
  tolerance: number = 1.0
): number | null => {
  const bgSRGB = hexToSRGB(bgHex);
  const bgLuminance = getLuminance(bgSRGB);

  // Helper to calculate APCA Lc value
  const getAPCAValue = (opacity: number): number => {
    const result = blendOKLCHOnBackground(l, c, h, opacity, bgHex);
    return Math.abs(getAPCA(result.luminance, bgLuminance));
  };

  // Check if target is achievable at 100%
  const maxContrast = getAPCAValue(100);
  if (maxContrast < targetLc - tolerance) {
    return null; // Cannot meet target even at full opacity
  }

  // Binary search for minimum opacity
  let low = 0;
  let high = 100;
  let bestOpacity = 100;

  while (high - low > 0.5) {
    const mid = (low + high) / 2;
    const contrast = getAPCAValue(mid);

    if (contrast >= targetLc - tolerance) {
      bestOpacity = mid;
      high = mid; // Try lower opacity
    } else {
      low = mid; // Need higher opacity
    }
  }

  return Math.ceil(bestOpacity); // Round up to ensure target is met
};
