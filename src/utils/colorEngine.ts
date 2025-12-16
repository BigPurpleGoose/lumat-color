import {
  converter,
  formatHex,
  formatRgb,
  formatHsl,
  clampChroma
} from 'culori';
import { calculateAPCA, calculateWCAG, validateContrast, relativeLuminance } from './contrast';
import { BACKGROUND_PRESETS } from './constants';
import { ColorCache, PERFORMANCE_FLAGS } from './performanceOptimizations';
import { applyChromaCompensation, getMaxChromaForHue } from './chromaLimits';

/**
 * Color Engine using OKLCH color space with Display P3 gamut mapping
 *
 * IMPORTANT: P3 Gamut Mapping Behavior
 * When colors are clamped to the P3 gamut using culori's clampChroma(),
 * both chroma AND lightness may be adjusted to produce the closest
 * perceptually accurate color within the P3 gamut.
 *
 * This means that high-lightness colors (L95-L98) with moderate chroma
 * may have their lightness reduced to L90-L96 after gamut mapping.
 * This is expected and colorimetrically correct behavior.
 *
 * Variable names use the intended lightness step (e.g., --scale-98)
 * while actual OKLCH values reflect the gamut-mapped lightness.
 * Both values are included in export comments for transparency.
 *
 * APCA MODE:
 * When contrastMode='apca-fixed', the engine uses a fixed-lightness
 * approach that prioritizes APCA contrast consistency across hues.
 * This ensures all colors at the same step have similar contrast ratios.
 */

// Type Definitions
export interface GamutInfo {
  chromaReduction: number;  // 0-1, how much C was reduced (0 = no reduction, 1 = fully reduced)
  lightnessShift: number;   // How much L changed (can be positive or negative)
  wasModified: boolean;     // Whether any gamut clamping occurred
  originalChroma: number;   // Original chroma before clamping
  originalLightness: number; // Original lightness before clamping
}

export interface ColorResult {
  oklch: string;
  cssP3: string;
  hex: string;
  rgba: string;
  hsla: string;
  L: number; // Actual lightness after P3 gamut mapping
  C: number;
  H: number;
  // Contrast information (when available)
  contrast?: {
    apca: { onBlack: number; onWhite: number; onGray: number };
    wcag: { onBlack: number; onWhite: number; onGray: number };
    meetsAA: boolean;
    meetsAAA: boolean;
  };
  // Specific background contrast (calculated against actual selected background)
  specificContrast?: {
    apca: number;
    wcag: number;
  };
  targetBackground?: string;
  gamutInfo?: GamutInfo; // Gamut modification tracking
}

export interface CurveParams {
  shift: number;
  power: number;
}

// Standard Lightness Scale
export const LIGHTNESS_STEPS = [98, 96, 93, 90, 85, 80, 70, 60, 48, 40, 32, 26, 20, 17, 14];

// Culori converters
const toP3 = converter('p3');
const toRgb = converter('rgb');

/**
 * Check if a color is within the P3 gamut
 * Uses conversion and checks if RGB values are within [0, 1] range
 */
export function isInP3Gamut(color: { mode: 'oklch'; l: number; c: number; h: number }): boolean {
  const p3Color = toP3(color);
  if (!p3Color) return false;
  return p3Color.r >= 0 && p3Color.r <= 1 &&
         p3Color.g >= 0 && p3Color.g <= 1 &&
         p3Color.b >= 0 && p3Color.b <= 1;
}

/**
 * Check if a color is within the sRGB gamut
 * Uses conversion and checks if RGB values are within [0, 1] range
 */
export function isInSRGBGamut(color: { mode: 'oklch'; l: number; c: number; h: number }): boolean {
  const rgb = toRgb(color);
  if (!rgb) return false;
  return rgb.r >= 0 && rgb.r <= 1 &&
         rgb.g >= 0 && rgb.g <= 1 &&
         rgb.b >= 0 && rgb.b <= 1;
}

/**
 * Clamp color to sRGB gamut while preserving exact lightness
 * Similar to clampToP3WithFixedLightness but for sRGB gamut
 * @param L - Target lightness (0-1)
 * @param C - Target chroma (will be reduced if needed)
 * @param H - Hue (0-360)
 * @returns OKLCH color within sRGB gamut at exact target lightness
 */
export function clampToSRGBWithFixedLightness(
  L: number,
  C: number,
  H: number
): { mode: 'oklch'; l: number; c: number; h: number } {
  const chromaStep = 0.0005;
  let currentChroma = C;

  // Try reducing chroma until color is in gamut
  while (currentChroma >= 0) {
    const color = { mode: 'oklch' as const, l: L, c: currentChroma, h: H };

    if (isInSRGBGamut(color)) {
      return color;
    }

    currentChroma -= chromaStep;

    // Safety: prevent infinite loop
    if (currentChroma < -chromaStep) break;
  }

  // Fallback to achromatic (gray) at target lightness
  return { mode: 'oklch' as const, l: L, c: 0, h: H };
}

/**
 * Clamp P3 color to sRGB with perceptual matching
 * Detects when P3 colors exceed sRGB gamut and provides graceful fallback
 * @param p3Color - P3 color to potentially clamp
 * @returns sRGB-safe color with perceptual similarity
 */
export function clampToSRGBPerceptual(
  p3Color: { mode: 'oklch'; l: number; c: number; h: number }
): { mode: 'oklch'; l: number; c: number; h: number } {
  // Check if P3 color fits in sRGB
  if (isInSRGBGamut(p3Color)) {
    return p3Color;
  }

  // Fallback: preserve lightness, reduce chroma for sRGB
  return clampToSRGBWithFixedLightness(p3Color.l, p3Color.c, p3Color.h);
}

/**
 * Clamp color to P3 gamut while preserving exact lightness
 * This reduces chroma iteratively until the color fits in the P3 gamut.
 * Used when contrastMode='apca-fixed' to ensure consistent lightness.
 *
 * @param L - Target lightness (0-1)
 * @param C - Target chroma (will be reduced if needed)
 * @param H - Hue (0-360)
 * @returns OKLCH color within P3 gamut at exact target lightness
 */
export function clampToP3WithFixedLightness(
  L: number,
  C: number,
  H: number
): { mode: 'oklch'; l: number; c: number; h: number } {
  const chromaStep = 0.0005;
  let currentChroma = C;

  // Try reducing chroma until color is in gamut
  while (currentChroma >= 0) {
    const color = { mode: 'oklch' as const, l: L, c: currentChroma, h: H };

    if (isInP3Gamut(color)) {
      return color;
    }

    currentChroma -= chromaStep;

    // Safety: prevent infinite loop
    if (currentChroma < -chromaStep) break;
  }

  // Fallback to achromatic (gray) at target lightness
  return { mode: 'oklch' as const, l: L, c: 0, h: H };
}

/**
 * Apply a power curve to adjust a value based on lightness
 * @param baseValue - The base value (hue or chroma)
 * @param lightness - Current lightness (0-1)
 * @param shift - How much to shift at extremes
 * @param power - Curve shape (0.5 = favors darks, 2 = favors lights, 1 = linear)
 * @returns Adjusted value
 */
export function applyCurve(baseValue: number, lightness: number, shift: number, power: number): number {
  // Normalize lightness to 0-1 range where 0 = darkest, 1 = lightest
  // Apply power curve: t^power for the interpolation factor
  const t = Math.pow(1 - lightness, power); // Inverted so dark = 1, light = 0
  return baseValue + (shift * t);
}

/**
 * Apply chroma curve with cubic bezier easing for natural color transitions
 * @param baseChroma - The base chroma value
 * @param lightness - Current lightness (0-1)
 * @param shift - How much to shift at extremes
 * @param power - Curve shape power
 * @returns Adjusted chroma value
 */
export function applyChromaCurveWithEasing(
  baseChroma: number,
  lightness: number,
  shift: number,
  power: number
): number {
  // Cubic bezier easing (0.42, 0, 0.58, 1) for smooth transitions
  const t = 1 - lightness;
  const eased = t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;

  return baseChroma + (shift * Math.pow(eased, power));
}

/**
 * Get maximum viable chroma for a given lightness and hue
 * High-lightness colors can handle less chroma before going out of gamut
 * @param L - Lightness (0-1)
 * @returns Maximum chroma that stays in gamut
 */
export function getMaxViableChroma(L: number): number {
  // Empirically derived limits for different lightness ranges
  if (L > 0.95) return 0.08;
  if (L > 0.90) return 0.12;
  if (L > 0.80) return 0.18;
  if (L > 0.20) return 0.25;
  if (L > 0.10) return 0.20;
  return 0.15; // Very dark colors
}

/**
 * Get chroma multiplier based on hue for perceptually uniform vibrancy
 *
 * Enhanced with hue-specific P3 gamut limits for accurate chroma scaling.
 * Replaces the original simple heuristic (0.7-1.3) with data-driven limits.
 *
 * @param hue - Hue (0-360)
 * @param lightness - Lightness (0-1) for context-aware scaling (optional)
 * @returns Multiplier (0.5-1.0, representing achievable chroma relative to blues)
 */
export function getChromaMultiplier(hue: number, lightness: number = 0.6): number {
  // Convert lightness to 0-100 scale for chromaLimits
  const lightness100 = lightness * 100;

  // Get max chroma for this hue at this lightness
  const maxChromaAtHue = getMaxChromaForHue(hue, lightness100);

  // Get max chroma for blue (reference: highest chroma)
  const maxChromaBlue = getMaxChromaForHue(240, lightness100);

  // Return ratio (blues = 1.0, yellows = ~0.5)
  const multiplier = maxChromaAtHue / maxChromaBlue;

  // Clamp to reasonable range
  return Math.max(0.5, Math.min(1.0, multiplier));
}

/**
 * Get accessible chroma adjusted for background contrast
 * Reduces chroma in danger zones where colors approach background lightness
 * @param L - Lightness (0-1)
 * @param baseChroma - Base chroma value
 * @param targetBg - Target background ('black', 'white', or 'gray')
 * @returns Adjusted chroma for accessibility
 */
export function getAccessibleChroma(
  L: number,
  baseChroma: number,
  targetBg: 'black' | 'white' | 'gray'
): number {
  const bgL = targetBg === 'black' ? 0 : targetBg === 'white' ? 1 : 0.5;
  const distance = Math.abs(L - bgL);

  // Reduce chroma in danger zone (within 0.3 lightness of background)
  if (distance < 0.3) {
    const reduction = 1 - (0.3 - distance) * 2;
    return baseChroma * Math.max(0.3, reduction);
  }

  return baseChroma;
}

/**
 * Get recommended contrast mode based on chroma value
 * Auto-selects best mode for different chroma ranges
 * @param chroma - Chroma value (0-0.4)
 * @returns Recommended contrast mode
 */
export function getRecommendedContrastMode(chroma: number): 'standard' | 'apca-fixed' | 'luminance-matched' {
  if (chroma < 0.02) return 'luminance-matched'; // Grays: match luminance
  if (chroma > 0.15) return 'standard'; // Vibrant colors: allow perceptual adjustment
  return 'apca-fixed'; // Mid-chroma: fixed lightness for consistent contrast
}

/**
 * Find OKLCH lightness value that produces target APCA contrast
 * Uses binary search to converge on the correct lightness.
 *
 * @param targetLc - Target APCA Lc value
 * @param hue - Hue (0-360)
 * @param chroma - Chroma (will be clamped to gamut)
 * @param background - Target background ('black', 'white', or 'gray')
 * @param tolerance - Acceptable Lc difference (default: 1.5)
 * @returns OKLCH lightness that achieves target Lc (or closest possible)
 */
export function findLightnessForAPCA(
  targetLc: number,
  hue: number,
  chroma: number,
  background: 'black' | 'white' | 'gray' = 'white',
  tolerance: number = 1.5
): number {
  const bgColor = {
    mode: 'oklch' as const,
    l: background === 'black' ? 0 : background === 'white' ? 1 : 0.8,
    c: 0,
    h: 0
  };

  let minL = 0.01;
  let maxL = 0.99;
  let iterations = 0;
  const maxIterations = 30;

  while (maxL - minL > 0.001 && iterations < maxIterations) {
    const midL = (minL + maxL) / 2;

    // Create color at this lightness with fixed lightness gamut mapping
    const color = clampToP3WithFixedLightness(midL, chroma, hue);
    const actualLc = calculateAPCA(color, bgColor);

    if (Math.abs(actualLc - targetLc) < tolerance) {
      return midL;
    }

    // Adjust search range based on whether we need more or less lightness
    if (background === 'black') {
      // Light on dark: higher L = higher Lc
      if (actualLc < targetLc) {
        minL = midL;
      } else {
        maxL = midL;
      }
    } else {
      // Dark on light: lower L = higher Lc (absolute value)
      if (actualLc < targetLc) {
        maxL = midL;
      } else {
        minL = midL;
      }
    }

    iterations++;
  }

  // Return midpoint of final range
  return (minL + maxL) / 2;
}

/**
 * Find OKLCH lightness value that produces target relative luminance (Y)
 * This ensures colors appear identical in monochromatic/grayscale view.
 * Used when contrastMode='luminance-matched'.
 *
 * @param targetY - Target relative luminance (Y) value (0-1)
 * @param hue - Hue (0-360)
 * @param chroma - Chroma (will be clamped to gamut)
 * @param tolerance - Acceptable Y difference (default: 0.001)
 * @returns OKLCH lightness that achieves target Y (or closest possible)
 */
export function findLightnessForLuminance(
  targetY: number,
  hue: number,
  chroma: number,
  tolerance: number = 0.001
): number {
  let minL = 0.01;
  let maxL = 0.99;
  let iterations = 0;
  const maxIterations = 30;

  while (maxL - minL > 0.001 && iterations < maxIterations) {
    const midL = (minL + maxL) / 2;

    // Create color at this lightness with fixed lightness gamut mapping
    const color = clampToP3WithFixedLightness(midL, chroma, hue);

    // Convert to RGB and calculate Y (relative luminance)
    const rgb = toRgb(color);
    if (!rgb) {
      // Fallback if conversion fails
      return midL;
    }

    const actualY = relativeLuminance(rgb.r, rgb.g, rgb.b);

    if (Math.abs(actualY - targetY) < tolerance) {
      return midL;
    }

    // Higher L = higher Y
    if (actualY < targetY) {
      minL = midL;
    } else {
      maxL = midL;
    }

    iterations++;
  }

  // Return midpoint of final range
  return (minL + maxL) / 2;
}

/**
 * Find OKLCH lightness value that produces target WCAG contrast ratio
 * Uses binary search to converge on the correct lightness.
 *
 * @param targetRatio - Target WCAG contrast ratio (e.g., 4.5 for AA)
 * @param hue - Hue (0-360)
 * @param chroma - Chroma (will be clamped to gamut)
 * @param background - Target background preset name
 * @param tolerance - Acceptable ratio difference (default: 0.1)
 * @returns OKLCH lightness that achieves target ratio (or closest possible)
 */
export function findLightnessForWCAG(
  targetRatio: number,
  hue: number,
  chroma: number,
  background: string = 'canvas-bg',
  tolerance: number = 0.1
): number {
  // Get background lightness from preset
  const bgPreset = BACKGROUND_PRESETS.find(p => p.name === background);
  const bgLightness = bgPreset ? bgPreset.lightness / 100 : 1;

  // Convert to relative luminance
  const bgColor = { mode: 'oklch' as const, l: bgLightness, c: 0, h: 0 };
  const bgRgb = toRgb(bgColor);
  const bgLuminance = bgRgb ? relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b) : bgLightness;

  let minL = 0.01;
  let maxL = 0.99;
  let iterations = 0;
  const maxIterations = 30;

  while (maxL - minL > 0.001 && iterations < maxIterations) {
    const midL = (minL + maxL) / 2;

    // Create color at this lightness with fixed lightness gamut mapping
    const color = clampToP3WithFixedLightness(midL, chroma, hue);
    const rgb = toRgb(color);

    if (!rgb) {
      return midL; // Fallback
    }

    const fgLuminance = relativeLuminance(rgb.r, rgb.g, rgb.b);

    // Calculate WCAG contrast ratio
    const ratio = fgLuminance > bgLuminance
      ? (fgLuminance + 0.05) / (bgLuminance + 0.05)
      : (bgLuminance + 0.05) / (fgLuminance + 0.05);

    if (Math.abs(ratio - targetRatio) < tolerance) {
      return midL;
    }

    // Adjust search range
    if (ratio < targetRatio) {
      // Need more contrast
      if (bgLuminance > 0.5) {
        minL = midL; // Darker on light background
      } else {
        maxL = midL; // Lighter on dark background
      }
    } else {
      if (bgLuminance > 0.5) {
        maxL = midL;
      } else {
        minL = midL;
      }
    }

    iterations++;
  }

  // Return midpoint of final range
  return (minL + maxL) / 2;
}

// Main Function: Generate Color Object with optional curve adjustments
export function generateColor(
  L: number,
  C: number,
  H: number,
  hueCurve?: CurveParams,
  chromaCurve?: CurveParams,
  options?: {
    contrastMode?: 'standard' | 'apca-fixed' | 'luminance-matched' | 'apca-target' | 'wcag-target';
    calculateContrast?: boolean;
    targetBackground?: string;
    targetLc?: number;        // Target APCA Lc for 'apca-target' mode
    targetWcagRatio?: number; // Target WCAG ratio for 'wcag-target' mode
    chromaCompensation?: boolean; // Apply perceptual chroma compensation (default: true)
  }
): ColorResult {
  // Check cache first (memoization)
  if (PERFORMANCE_FLAGS.USE_COLOR_CACHE) {
    const cached = ColorCache.get(L, C, H, { hueCurve, chromaCurve, options });
    if (cached) {
      return cached;
    }
  }

  const contrastMode = options?.contrastMode || 'standard';
  const shouldCalculateContrast = options?.calculateContrast ?? false;
  const targetBackground = options?.targetBackground || 'canvas-bg';

  // Apply curves if provided
  let effectiveH = H;
  let effectiveC = C;

  if (hueCurve) {
    effectiveH = applyCurve(H, L, hueCurve.shift, hueCurve.power);
    // Normalize hue to 0-360 range
    effectiveH = ((effectiveH % 360) + 360) % 360;
  }

  if (chromaCurve) {
    // Use bezier easing for smoother chroma transitions
    effectiveC = applyChromaCurveWithEasing(C, L, chromaCurve.shift, chromaCurve.power);
    // Ensure chroma stays positive
    effectiveC = Math.max(0, effectiveC);
  }

  // Apply perceptual chroma compensation based on hue (optional)
  const enableChromaCompensation = options?.chromaCompensation ?? true;
  if (enableChromaCompensation) {
    const chromaMultiplier = getChromaMultiplier(effectiveH, L);
    effectiveC = effectiveC * chromaMultiplier;
  }

  // Lock hue for near-grayscale colors to prevent imperceptible hue shifts
  if (effectiveC < 0.02) {
    effectiveH = H; // Use original hue, not curve-adjusted
  }

  // Track original values for gamut info
  const originalL = L;
  const originalC = effectiveC;

  let clampedOklch: { mode: 'oklch'; l: number; c: number; h: number };

  if (contrastMode === 'apca-target') {
    // APCA Target mode: Generate colors to meet specific APCA Lc targets
    const targetLc = options?.targetLc || 75;
    const adjustedL = findLightnessForAPCA(
      targetLc,
      effectiveH,
      effectiveC,
      targetBackground as 'black' | 'white' | 'gray'
    );
    clampedOklch = clampToP3WithFixedLightness(adjustedL, effectiveC, effectiveH);
  } else if (contrastMode === 'wcag-target') {
    // WCAG Target mode: Generate colors to meet specific WCAG ratios
    const targetRatio = options?.targetWcagRatio || 4.5;
    const adjustedL = findLightnessForWCAG(
      targetRatio,
      effectiveH,
      effectiveC,
      targetBackground
    );
    clampedOklch = clampToP3WithFixedLightness(adjustedL, effectiveC, effectiveH);
  } else if (contrastMode === 'luminance-matched') {
    // Luminance-matched mode: Find L that produces target Y (relative luminance)
    // This ensures colors appear identical in grayscale/monochromatic view
    const rgb = toRgb({ mode: 'oklch' as const, l: L, c: 0, h: effectiveH });
    const targetY = rgb ? relativeLuminance(rgb.r, rgb.g, rgb.b) : L;

    const adjustedL = findLightnessForLuminance(targetY, effectiveH, effectiveC);
    clampedOklch = clampToP3WithFixedLightness(adjustedL, effectiveC, effectiveH);
  } else if (contrastMode === 'apca-fixed') {
    // APCA mode: Use fixed-lightness gamut mapping
    clampedOklch = clampToP3WithFixedLightness(L, effectiveC, effectiveH);
  } else {
    // Standard mode: Allow lightness adjustment for perceptual accuracy
    const oklchColor = {
      mode: 'oklch' as const,
      l: L,
      c: effectiveC,
      h: effectiveH
    };
    const clamped = clampChroma(oklchColor, 'p3');

    // Safety check: if clampChroma returns undefined, use original color
    if (!clamped || clamped.l === undefined) {
      clampedOklch = {
        mode: 'oklch' as const,
        l: L,
        c: effectiveC,
        h: effectiveH
      };
    } else {
      clampedOklch = {
        mode: 'oklch' as const,
        l: clamped.l,
        c: clamped.c,
        h: clamped.h || 0
      };
    }
  }

  // Convert to various formats
  const p3Color = toP3(clampedOklch);

  // Format outputs
  const hexValue = formatHex(clampedOklch);
  const rgbaValue = formatRgb(clampedOklch);
  const hslaValue = formatHsl(clampedOklch);

  // Format P3 for CSS (color(display-p3 r g b))
  const cssP3 = p3Color
    ? `color(display-p3 ${p3Color.r.toFixed(3)} ${p3Color.g.toFixed(3)} ${p3Color.b.toFixed(3)})`
    : hexValue;

  // Format OKLCH for CSS
  const oklchString = `oklch(${(clampedOklch.l * 100).toFixed(1)}% ${clampedOklch.c.toFixed(4)} ${(clampedOklch.h || 0).toFixed(1)})`;

  // Calculate contrast if requested
  let contrastInfo;
  let specificContrast;
  if (shouldCalculateContrast) {
    contrastInfo = validateContrast(clampedOklch);

    // Calculate precise contrast against the specific selected background
    if (options?.targetBackground) {
      const bgPreset = BACKGROUND_PRESETS.find(p => p.name === options.targetBackground);
      if (bgPreset) {
        const bgLightness = bgPreset.lightness / 100;
        const bgColor = { mode: 'oklch' as const, l: bgLightness, c: 0, h: 0 };
        specificContrast = {
          apca: calculateAPCA(clampedOklch, bgColor),
          wcag: calculateWCAG(clampedOklch, bgColor)
        };
      }
    }
  }

  // Calculate gamut modification info
  const chromaReduction = originalC > 0
    ? Math.max(0, (originalC - clampedOklch.c) / originalC)
    : 0;
  const lightnessShift = clampedOklch.l - originalL;
  const wasModified = chromaReduction > 0.01 || Math.abs(lightnessShift) > 0.01;

  const gamutInfo: GamutInfo = {
    chromaReduction,
    lightnessShift,
    wasModified,
    originalChroma: originalC,
    originalLightness: originalL
  };

  const result: ColorResult = {
    oklch: oklchString,
    cssP3: cssP3,
    hex: hexValue,
    rgba: rgbaValue,
    hsla: hslaValue,
    L: clampedOklch.l,
    C: clampedOklch.c,
    H: clampedOklch.h || 0,
    contrast: contrastInfo,
    specificContrast: specificContrast,
    targetBackground: targetBackground,
    gamutInfo
  };

  // Cache the result for future use
  if (PERFORMANCE_FLAGS.USE_COLOR_CACHE) {
    ColorCache.set(L, C, H, result, { hueCurve, chromaCurve, options });
  }

  return result;
}

/**
 * Clear color conversion cache
 * Call when gamut settings or global parameters change
 */
export function clearColorCache(): void {
  ColorCache.clear();
}
