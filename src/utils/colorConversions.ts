/**
 * Color Conversion Utilities
 *
 * Shared color conversion functions used across the codebase.
 * Single source of truth for common color space conversions.
 *
 * @module colorConversions
 */

import { formatHex } from 'culori';

/**
 * Calculate relative luminance for WCAG contrast calculations
 *
 * Uses sRGB gamma correction per WCAG 2.1 specification.
 * This is the Y value in the CIE XYZ color space.
 *
 * @param r - Red channel (0-1)
 * @param g - Green channel (0-1)
 * @param b - Blue channel (0-1)
 * @returns Relative luminance (0-1)
 *
 * @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = Math.max(0, Math.min(1, val));
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Convert RGB values to hex string
 *
 * Uses culori's formatHex for consistent color formatting.
 *
 * @param r - Red channel (0-1)
 * @param g - Green channel (0-1)
 * @param b - Blue channel (0-1)
 * @returns Hex color string (e.g., "#ff0000")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return formatHex({ mode: 'rgb', r, g, b });
}

/**
 * Convert RGB object to hex string
 *
 * Convenience overload for RGB objects.
 *
 * @param color - RGB color object
 * @returns Hex color string (e.g., "#ff0000")
 */
export function rgbObjectToHex(color: { r: number; g: number; b: number }): string {
  return formatHex({ mode: 'rgb', r: color.r, g: color.g, b: color.b });
}

/**
 * Convert perceived lightness (L*) back from luminance (Y)
 *
 * CIE L* formula:
 * - L* = 116 * Y^(1/3) - 16 for Y > 0.008856
 * - L* = 903.3 * Y for Y <= 0.008856
 *
 * @param luminance - Relative luminance (0-1)
 * @returns CIE L* lightness (0-100)
 */
export function luminanceToLightness(luminance: number): number {
  return luminance > 0.008856
    ? 116 * Math.pow(luminance, 1.0 / 3.0) - 16
    : 903.3 * luminance;
}

/**
 * Convert CIE L* lightness to relative luminance (Y)
 *
 * Inverse of luminanceToLightness.
 *
 * @param lightness - CIE L* lightness (0-100)
 * @returns Relative luminance (0-1)
 */
export function lightnessToLuminance(lightness: number): number {
  if (lightness <= 8) {
    return lightness / 903.3;
  }
  return Math.pow((lightness + 16) / 116, 3);
}
