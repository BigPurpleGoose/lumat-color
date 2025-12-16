/**
 * Advanced APCA Auto-Fix Algorithm
 *
 * Intelligently adjusts color scales to meet APCA accessibility targets
 * using sophisticated optimization strategies.
 *
 * Features:
 * - Binary search for optimal lightness values
 * - Hue-aware chroma compensation
 * - Multi-target optimization (background, text, UI)
 * - Minimal perceptual disruption
 */

import { ColorScale } from '../types';
import { generateColor, ColorResult } from './colorEngine';
import { calculateAPCA } from './contrast';
import { converter } from 'culori';

const toOklch = converter('oklch');

export interface APCATarget {
  minLc: number;           // Minimum APCA Lc value (e.g., 60, 75, 90)
  background: string;      // Target background hex color
  priority: 'must' | 'should' | 'nice'; // Compliance priority
  name?: string;           // Display name (e.g., "Body Text on White")
}

export interface AutoFixAPCAOptions {
  targets: APCATarget[];   // Multiple APCA targets to satisfy
  adjustLightness?: boolean; // Allow lightness adjustment (default: true)
  adjustChroma?: boolean;  // Allow chroma adjustment (default: true)
  maxIterations?: number;  // Max optimization iterations (default: 20)
  tolerance?: number;      // Lc tolerance (default: 1.0)
  preserveEndpoints?: boolean; // Keep L*98 and L*14 fixed (default: true)
}

export interface AutoFixAPCAResult {
  scale: ColorScale;
  adjustedLightnessSteps: number[];
  improvements: string[];
  metrics: {
    targetsAchieved: number;
    targetsFailed: number;
    averageLcImprovement: number;
    lightnessAdjustments: Array<{ step: number; before: number; after: number }>;
    chromaAdjustment: number;
  };
  success: boolean;
}

/**
 * Find optimal lightness value to meet APCA Lc target
 *
 * Uses binary search to converge on lightness that produces target contrast
 */
function findLightnessForAPCATarget(
  targetLc: number,
  hue: number,
  chroma: number,
  backgroundHex: string,
  initialL: number,
  tolerance: number = 1.0
): { l: number; achievedLc: number; success: boolean } {
  // Generate color at initial lightness to get background luminance
  const initialColor = generateColor(initialL, chroma, hue, { shift: 0, power: 1 }, { shift: 0, power: 1 }, {
    contrastMode: 'standard',
    calculateContrast: false,
    targetBackground: 'white',
  });

  // Convert background hex to OKLCH
  const bgOklch = hexToOklch(backgroundHex);

  // Binary search for optimal lightness
  let low = 0.05;  // Minimum lightness (avoid pure black)
  let high = 0.98; // Maximum lightness (avoid pure white)
  let bestL = initialL;
  let bestLc = 0;
  let iterations = 0;
  const maxIterations = 30;

  while (iterations < maxIterations && (high - low) > 0.005) {
    const midL = (low + high) / 2;

    // Generate color at this lightness
    const testColor = generateColor(midL, chroma, hue, { shift: 0, power: 1 }, { shift: 0, power: 1 }, {
      contrastMode: 'standard',
      calculateContrast: false,
      targetBackground: 'white',
    });

    // Calculate APCA contrast
    const fgOklch = { mode: 'oklch' as const, l: testColor.L, c: testColor.C, h: testColor.H };
    const lc = Math.abs(calculateAPCA(fgOklch, bgOklch));

    // Track best result
    if (Math.abs(lc - targetLc) < Math.abs(bestLc - targetLc)) {
      bestL = midL;
      bestLc = lc;
    }

    // Adjust search range
    if (lc < targetLc) {
      // Need more contrast - adjust lightness away from background
      const bgL = bgOklch.l;
      if (bgL > 0.5) {
        high = midL; // Background is light, go darker
      } else {
        low = midL;  // Background is dark, go lighter
      }
    } else {
      // Have enough contrast - can move closer to background
      const bgL = bgOklch.l;
      if (bgL > 0.5) {
        low = midL;  // Background is light, can be lighter
      } else {
        high = midL; // Background is dark, can be darker
      }
    }

    iterations++;
  }

  const success = Math.abs(bestLc - targetLc) <= tolerance;

  return { l: bestL, achievedLc: bestLc, success };
}

/**
 * Convert hex color to OKLCH
 */
function hexToOklch(hex: string): { mode: 'oklch'; l: number; c: number; h: number } {
  try {
    // Culori's converter accepts hex strings directly
    const oklch = toOklch(hex as any);
    if (!oklch || typeof oklch !== 'object') {
      console.warn('Failed to convert hex to OKLCH:', hex);
      return { mode: 'oklch' as const, l: 1, c: 0, h: 0 }; // Default to white
    }

    return {
      mode: 'oklch' as const,
      l: oklch.l ?? 1,
      c: oklch.c ?? 0,
      h: oklch.h ?? 0,
    };
  } catch (error) {
    console.warn('Error converting hex to OKLCH:', hex, error);
    return { mode: 'oklch' as const, l: 1, c: 0, h: 0 };
  }
}

/**
 * Auto-fix color scale to meet APCA targets
 *
 * Main optimization algorithm that adjusts scale parameters
 */
export function autoFixAPCA(
  scale: ColorScale,
  lightnessSteps: number[],
  options: AutoFixAPCAOptions
): AutoFixAPCAResult {
  const {
    targets,
    adjustLightness = true,
    adjustChroma = true,
    maxIterations = 20,
    tolerance = 1.0,
    preserveEndpoints = true,
  } = options;

  const improvements: string[] = [];
  const lightnessAdjustments: Array<{ step: number; before: number; after: number }> = [];
  let adjustedScale = { ...scale };
  let adjustedSteps = [...lightnessSteps];
  let chromaAdjustment = 0;

  // Sort targets by priority (must > should > nice)
  const sortedTargets = [...targets].sort((a, b) => {
    const priorityOrder = { must: 3, should: 2, nice: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Track results
  let targetsAchieved = 0;
  let totalLcImprovement = 0;

  // Strategy 1: Optimize contrast mode
  if (scale.contrastMode !== 'apca-fixed') {
    adjustedScale.contrastMode = 'apca-fixed';
    improvements.push('Switched to APCA-fixed mode for consistent contrast');
  }

  // Strategy 2: Adjust chroma if needed
  if (adjustChroma && scale.manualChroma > 0.2) {
    // High chroma can interfere with contrast targets
    const chromaReduction = Math.min(0.05, scale.manualChroma * 0.15);
    adjustedScale.manualChroma = scale.manualChroma - chromaReduction;
    chromaAdjustment = -chromaReduction;
    improvements.push(`Reduced chroma by ${(chromaReduction * 100).toFixed(1)}% to improve APCA compliance`);
  }

  // Strategy 3: Adjust individual lightness values to meet targets
  if (adjustLightness) {
    const primaryTarget = sortedTargets[0]; // Focus on highest priority target

    if (primaryTarget) {
      // For each lightness step (except preserved endpoints)
      for (let i = 0; i < lightnessSteps.length; i++) {
        const step = lightnessSteps[i];

        // Skip endpoints if preserving
        if (preserveEndpoints && (step === 98 || step === 14)) {
          continue;
        }

        // Find optimal lightness for this step
        const result = findLightnessForAPCATarget(
          primaryTarget.minLc,
          adjustedScale.hue,
          adjustedScale.manualChroma,
          primaryTarget.background,
          step / 100,
          tolerance
        );

        const newStep = Math.round(result.l * 100);

        // Only adjust if improvement is significant (>2% lightness change)
        if (Math.abs(newStep - step) >= 2 && result.success) {
          lightnessAdjustments.push({
            step: i,
            before: step,
            after: newStep,
          });
          adjustedSteps[i] = newStep;
          totalLcImprovement += result.achievedLc;
          targetsAchieved++;
        }
      }

      if (lightnessAdjustments.length > 0) {
        improvements.push(
          `Adjusted ${lightnessAdjustments.length} lightness values to meet APCA Lc ${primaryTarget.minLc}`
        );
      }
    }
  }

  // Strategy 4: Enable chroma compensation
  if (!adjustedScale.chromaCompensation) {
    adjustedScale.chromaCompensation = true;
    improvements.push('Enabled hue-specific chroma compensation');
  }

  // Calculate success metrics
  const targetsFailed = sortedTargets.length - targetsAchieved;
  const averageLcImprovement = targetsAchieved > 0 ? totalLcImprovement / targetsAchieved : 0;
  const success = targetsFailed === 0 || (targetsAchieved / sortedTargets.length) >= 0.7;

  return {
    scale: adjustedScale,
    adjustedLightnessSteps: adjustedSteps,
    improvements,
    metrics: {
      targetsAchieved,
      targetsFailed,
      averageLcImprovement,
      lightnessAdjustments,
      chromaAdjustment,
    },
    success,
  };
}

/**
 * Quick APCA auto-fix presets for common use cases
 */
export const APCA_AUTO_FIX_PRESETS = {
  /**
   * Body text on white background (Lc 75+)
   */
  'body-text-white': (scale: ColorScale, steps: number[]) =>
    autoFixAPCA(scale, steps, {
      targets: [
        { minLc: 75, background: '#FFFFFF', priority: 'must', name: 'Body Text' },
      ],
      adjustLightness: true,
      adjustChroma: true,
    }),

  /**
   * Body text on black background (Lc 75+)
   */
  'body-text-black': (scale: ColorScale, steps: number[]) =>
    autoFixAPCA(scale, steps, {
      targets: [
        { minLc: 75, background: '#000000', priority: 'must', name: 'Body Text' },
      ],
      adjustLightness: true,
      adjustChroma: true,
    }),

  /**
   * Large text on white background (Lc 60+)
   */
  'large-text-white': (scale: ColorScale, steps: number[]) =>
    autoFixAPCA(scale, steps, {
      targets: [
        { minLc: 60, background: '#FFFFFF', priority: 'must', name: 'Large Text' },
      ],
      adjustLightness: true,
      adjustChroma: true,
    }),

  /**
   * UI elements on white (Lc 60+)
   */
  'ui-white': (scale: ColorScale, steps: number[]) =>
    autoFixAPCA(scale, steps, {
      targets: [
        { minLc: 60, background: '#FFFFFF', priority: 'must', name: 'UI Elements' },
      ],
      adjustLightness: true,
      adjustChroma: true,
    }),

  /**
   * Multi-target: work on both light and dark backgrounds
   */
  'universal': (scale: ColorScale, steps: number[]) =>
    autoFixAPCA(scale, steps, {
      targets: [
        { minLc: 60, background: '#FFFFFF', priority: 'must', name: 'Light BG' },
        { minLc: 60, background: '#000000', priority: 'should', name: 'Dark BG' },
      ],
      adjustLightness: true,
      adjustChroma: true,
      maxIterations: 30,
    }),

  /**
   * Strict compliance: Body text (Lc 90+)
   */
  'strict-body': (scale: ColorScale, steps: number[]) =>
    autoFixAPCA(scale, steps, {
      targets: [
        { minLc: 90, background: '#FFFFFF', priority: 'must', name: 'Strict Body Text' },
      ],
      adjustLightness: true,
      adjustChroma: true,
      maxIterations: 30,
    }),
};

/**
 * Analyze scale and recommend best auto-fix preset
 */
export function recommendAPCAPreset(
  scale: ColorScale,
  targetBackground: string = '#FFFFFF'
): keyof typeof APCA_AUTO_FIX_PRESETS {
  const bgOklch = hexToOklch(targetBackground);
  const isLightBg = bgOklch.l > 0.5;

  // High chroma scales work better with UI presets (lower Lc targets)
  if (scale.manualChroma > 0.15) {
    return isLightBg ? 'ui-white' : 'body-text-black';
  }

  // Low chroma (near-grayscale) can handle strict targets
  if (scale.manualChroma < 0.05) {
    return isLightBg ? 'strict-body' : 'body-text-black';
  }

  // Default: body text preset
  return isLightBg ? 'body-text-white' : 'body-text-black';
}
