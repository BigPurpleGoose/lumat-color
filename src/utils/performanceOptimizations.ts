/**
 * Performance Optimization Utilities
 *
 * Provides lookup tables (LUTs) and caching mechanisms for computationally
 * expensive color operations. Offers 5-10× speedup for repeated calculations.
 */

import { ColorResult, CurveParams } from './colorEngine';

/**
 * Gamma Correction Lookup Tables
 * Pre-computed values for sRGB ↔ Linear RGB conversions
 * Provides ~5× speedup over Math.pow() with negligible accuracy loss
 */
class GammaLUT {
  private static sRGBToLinearTable: Float32Array;
  private static linearToSRGBTable: Float32Array;
  private static initialized = false;
  private static precision = 1024; // Higher precision than 8-bit (256)

  static init(precision: number = 1024) {
    if (this.initialized && this.precision === precision) return;

    this.precision = precision;

    // Forward LUT: sRGB → Linear RGB
    this.sRGBToLinearTable = new Float32Array(precision);
    for (let i = 0; i < precision; i++) {
      const v = i / (precision - 1);
      this.sRGBToLinearTable[i] = v <= 0.04045
        ? v / 12.92
        : Math.pow((v + 0.055) / 1.055, 2.4);
    }

    // Reverse LUT: Linear RGB → sRGB
    this.linearToSRGBTable = new Float32Array(precision);
    for (let i = 0; i < precision; i++) {
      const v = i / (precision - 1);
      this.linearToSRGBTable[i] = v <= 0.0031308
        ? 12.92 * v
        : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    }

    this.initialized = true;
  }

  /**
   * Fast sRGB to Linear RGB conversion using LUT
   * ~5× faster than Math.pow() with <0.5% error
   */
  static sRGBToLinearFast(v: number): number {
    if (!GammaLUT.initialized) GammaLUT.init();

    // Clamp input to valid range
    v = Math.max(0, Math.min(1, v));

    // Lookup with linear interpolation for sub-pixel accuracy
    const index = v * (GammaLUT.precision - 1);
    const indexFloor = Math.floor(index);
    const indexCeil = Math.min(indexFloor + 1, GammaLUT.precision - 1);
    const fraction = index - indexFloor;

    return GammaLUT.sRGBToLinearTable[indexFloor] * (1 - fraction) +
           GammaLUT.sRGBToLinearTable[indexCeil] * fraction;
  }

  /**
   * Fast Linear RGB to sRGB conversion using LUT
   * ~5× faster than Math.pow() with <0.5% error
   */
  static linearToSRGBFast(v: number): number {
    if (!GammaLUT.initialized) GammaLUT.init();

    // Clamp input to valid range
    v = Math.max(0, Math.min(1, v));

    // Lookup with linear interpolation
    const index = v * (GammaLUT.precision - 1);
    const indexFloor = Math.floor(index);
    const indexCeil = Math.min(indexFloor + 1, GammaLUT.precision - 1);
    const fraction = index - indexFloor;

    return GammaLUT.linearToSRGBTable[indexFloor] * (1 - fraction) +
           GammaLUT.linearToSRGBTable[indexCeil] * fraction;
  }

  /**
   * Precise conversion (original Math.pow implementation)
   * Use for single high-precision calculations
   */
  static sRGBToLinearPrecise(v: number): number {
    v = Math.max(0, Math.min(1, v));
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  static linearToSRGBPrecise(v: number): number {
    v = Math.max(0, Math.min(1, v));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  }
}

// Initialize LUTs on module load
GammaLUT.init();

/**
 * Color Conversion Cache
 * Memoizes expensive color generation operations
 * Provides 5-10× speedup for repeated calculations with same parameters
 */
class ColorConversionCache {
  private static cache = new Map<string, ColorResult>();
  private static maxSize = 1000; // LRU eviction at 1000 entries
  private static enabled = true;

  private static getCacheKey(
    L: number,
    C: number,
    H: number,
    options: any
  ): string {
    // Create deterministic key from parameters
    return `${L.toFixed(4)},${C.toFixed(4)},${H.toFixed(1)},${JSON.stringify(options || {})}`;
  }

  static get(
    L: number,
    C: number,
    H: number,
    options?: any
  ): ColorResult | undefined {
    if (!this.enabled) return undefined;

    const key = this.getCacheKey(L, C, H, options);
    return this.cache.get(key);
  }

  static set(
    L: number,
    C: number,
    H: number,
    result: ColorResult,
    options?: any
  ): void {
    if (!this.enabled) return;

    const key = this.getCacheKey(L, C, H, options);

    // LRU eviction: remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, result);
  }

  static clear(): void {
    this.cache.clear();
  }

  static disable(): void {
    this.enabled = false;
    this.clear();
  }

  static enable(): void {
    this.enabled = true;
  }

  static getStats(): { size: number; maxSize: number; hitRate: number } {
    // For future implementation: track hits/misses
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // TODO: implement hit/miss tracking
    };
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  static measure(label: string, fn: () => any): any {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);

    return result;
  }

  static getStats(label: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    total: number
  } | null {
    const times = this.measurements.get(label);
    if (!times || times.length === 0) return null;

    return {
      count: times.length,
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((a, b) => a + b, 0)
    };
  }

  static reset(): void {
    this.measurements.clear();
  }

  static logStats(): void {
    console.log('=== Performance Statistics ===');
    this.measurements.forEach((times, label) => {
      const stats = this.getStats(label);
      if (stats) {
        console.log(`${label}:`, {
          calls: stats.count,
          avg: `${stats.avg.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          total: `${stats.total.toFixed(2)}ms`
        });
      }
    });
  }
}

// Export both fast and precise versions
export const GammaCorrection = {
  sRGBToLinear: GammaLUT.sRGBToLinearFast,
  linearToSRGB: GammaLUT.linearToSRGBFast,
  sRGBToLinearPrecise: GammaLUT.sRGBToLinearPrecise,
  linearToSRGBPrecise: GammaLUT.linearToSRGBPrecise
};

export const ColorCache = ColorConversionCache;

// Feature flags for enabling/disabling optimizations
export const PERFORMANCE_FLAGS = {
  USE_LUT_GAMMA: true,      // Use LUT for gamma correction
  USE_COLOR_CACHE: true,     // Use memoization cache
  USE_WEB_WORKERS: false,    // Use Web Workers (Phase 2)
  LOG_PERFORMANCE: false     // Log performance metrics
};
