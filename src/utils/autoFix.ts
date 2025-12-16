/**
 * Auto-fix Utilities
 *
 * Automatically adjusts color scale parameters to meet accessibility thresholds
 */

import { ColorScale } from '../types';
import { generateColor } from './colorEngine';

interface AutoFixOptions {
  targetMinWCAG?: number;  // Target minimum WCAG ratio (default: 4.5)
  targetMinAPCA?: number;  // Target minimum APCA Lc (default: 75)
  adjustChroma?: boolean;  // Allow chroma adjustment (default: true)
  adjustMode?: boolean;    // Allow contrast mode change (default: true)
}

interface AutoFixResult {
  scale: ColorScale;
  improvements: string[];
  metrics: {
    wcagPairsImproved: number;
    apcaPairsImproved: number;
    chromaAdjustment: number;
    modeChanged: boolean;
  };
}

/**
 * Analyze current scale and suggest/apply improvements
 */
export function autoFixScale(
  scale: ColorScale,
  lightnessSteps: number[],
  options: AutoFixOptions = {}
): AutoFixResult {
  const {
    targetMinWCAG = 4.5,
    targetMinAPCA = 75,
    adjustChroma = true,
    adjustMode = true,
  } = options;

  const improvements: string[] = [];
  let adjustedScale = { ...scale };
  let chromaAdjustment = 0;
  let modeChanged = false;

  // 1. Check if contrast mode optimization would help
  if (adjustMode && scale.contrastMode === 'standard') {
    // For low chroma (near-grayscale), use luminance-matched
    if (scale.manualChroma < 0.02) {
      adjustedScale.contrastMode = 'luminance-matched';
      improvements.push('Switched to luminance-matched mode for grayscale consistency');
      modeChanged = true;
    }
    // For moderate chroma, use apca-fixed for consistent contrast
    else if (scale.manualChroma < 0.15) {
      adjustedScale.contrastMode = 'apca-fixed';
      improvements.push('Switched to APCA-fixed mode for consistent contrast');
      modeChanged = true;
    }
  }

  // 2. Optimize contrast mode for scale consistency (NOT target modes)
  // Target modes generate single colors and collapse all swatches to same lightness
  if (adjustMode && scale.contrastMode === 'standard') {
    // For high contrast goals, use apca-fixed for consistent contrast across scale
    adjustedScale.contrastMode = 'apca-fixed';
    improvements.push('Switched to APCA-fixed mode for consistent contrast across scale');
    modeChanged = true;
  }

  // 3. Analyze current color generation to check contrast
  const colors = lightnessSteps.map(l =>
    generateColor(
      l / 100,
      adjustedScale.manualChroma,
      adjustedScale.hue,
      adjustedScale.hueCurve,
      adjustedScale.chromaCurve,
      {
        contrastMode: adjustedScale.contrastMode || 'standard',
        calculateContrast: true,
        targetBackground: adjustedScale.targetBackground || 'canvas-bg',
        targetLc: adjustedScale.apcaTargetLc,
        targetWcagRatio: adjustedScale.wcagTargetRatio,
        chromaCompensation: adjustedScale.chromaCompensation ?? true,
      }
    )
  );

  // Count pairs meeting thresholds
  let wcagPairs = 0;
  let apcaPairs = 0;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const contrastI = colors[i].contrast;
      const contrastJ = colors[j].contrast;

      if (contrastI?.wcag && contrastJ?.wcag && contrastI?.apca && contrastJ?.apca) {
        // Calculate contrast between pairs
        const wcag = Math.max(
          contrastI.wcag.onWhite,
          contrastJ.wcag.onWhite
        );
        const apca = Math.max(
          Math.abs(contrastI.apca.onWhite),
          Math.abs(contrastJ.apca.onWhite)
        );

        if (wcag >= targetMinWCAG) wcagPairs++;
        if (apca >= targetMinAPCA) apcaPairs++;
      }
    }
  }

  // 4. Adjust chroma if needed and allowed
  if (adjustChroma && scale.manualChroma > 0.05) {
    // High chroma can reduce contrast - suggest reduction if compliance is low
    const totalPairs = (colors.length * (colors.length - 1)) / 2;
    const wcagCompliance = wcagPairs / totalPairs;

    if (wcagCompliance < 0.5) {
      // Reduce chroma by 20% to improve contrast
      const reduction = scale.manualChroma * 0.2;
      adjustedScale.manualChroma = Math.max(0.05, scale.manualChroma - reduction);
      chromaAdjustment = -reduction;
      improvements.push(`Reduced chroma by ${(reduction * 100).toFixed(1)}% to improve contrast`);
    }
  }

  // 5. Enable chroma compensation if not already enabled
  if (adjustedScale.chromaCompensation === false) {
    adjustedScale.chromaCompensation = true;
    improvements.push('Enabled chroma compensation for perceptual uniformity');
  }

  // 6. Suggest target background optimization
  if (!adjustedScale.targetBackground || adjustedScale.targetBackground === 'canvas-bg') {
    improvements.push('Consider setting specific target background for accurate contrast calculations');
  }

  return {
    scale: adjustedScale,
    improvements,
    metrics: {
      wcagPairsImproved: 0, // Would need before/after comparison
      apcaPairsImproved: 0,
      chromaAdjustment,
      modeChanged,
    },
  };
}

/**
 * Quick preset auto-fixes for common scenarios
 */
export const AUTO_FIX_PRESETS = {
  'wcag-aa': (scale: ColorScale, lightnessSteps: number[]) =>
    autoFixScale(scale, lightnessSteps, {
      targetMinWCAG: 4.5,
      adjustChroma: true,
      adjustMode: true,
    }),

  'wcag-aaa': (scale: ColorScale, lightnessSteps: number[]) =>
    autoFixScale(scale, lightnessSteps, {
      targetMinWCAG: 7.0,
      adjustChroma: true,
      adjustMode: true,
    }),

  'apca-body': (scale: ColorScale, lightnessSteps: number[]) =>
    autoFixScale(scale, lightnessSteps, {
      targetMinAPCA: 75,
      adjustChroma: true,
      adjustMode: true,
    }),

  'apca-heading': (scale: ColorScale, lightnessSteps: number[]) =>
    autoFixScale(scale, lightnessSteps, {
      targetMinAPCA: 90,
      adjustChroma: true,
      adjustMode: true,
    }),
};
