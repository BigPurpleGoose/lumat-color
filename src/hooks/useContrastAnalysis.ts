import { useMemo } from 'react';
import { ColorResult } from '../utils/colorEngine';
import { ColorScale } from '../types';
import {
  analyzeScaleContrast,
  findPassingSwatches,
  ContrastThreshold,
  ScaleContrastSummary,
  CONTRAST_PRESETS
} from '../utils/contrastValidator';

/**
 * Custom hook for contrast pattern analysis.
 * Progressive enhancement - does not modify color generation,
 * only analyzes existing ColorResult data.
 */

export interface UseContrastAnalysisOptions {
  threshold?: ContrastThreshold;
  enabled?: boolean;  // Gate computation for performance
}

/**
 * Analyze a single scale's contrast patterns.
 */
export function useScaleContrastAnalysis(
  scale: ColorScale | null,
  colors: ColorResult[],
  options: UseContrastAnalysisOptions = {}
): ScaleContrastSummary | null {
  const { threshold, enabled = true } = options;

  return useMemo(() => {
    if (!enabled || !scale || colors.length === 0) return null;

    // Use scale's configured threshold, or provided threshold, or default
    const effectiveThreshold: ContrastThreshold = scale.contrastThreshold?.enabled
      ? {
          minLc: scale.contrastThreshold.minLc,
          minWcag: scale.contrastThreshold.minWcag,
          useApca: scale.contrastThreshold.useApca
        }
      : threshold || CONTRAST_PRESETS.bodyText;

    return analyzeScaleContrast(scale, colors, effectiveThreshold);
  }, [scale, colors, threshold, enabled]);
}

/**
 * Analyze contrast patterns across all scales in a project.
 */
export function useProjectContrastAnalysis(
  scales: ColorScale[],
  colorsMap: Map<string, ColorResult[]>,
  options: UseContrastAnalysisOptions = {}
): ScaleContrastSummary[] {
  const { threshold = CONTRAST_PRESETS.bodyText, enabled = true } = options;

  return useMemo(() => {
    if (!enabled || scales.length === 0) return [];

    return findPassingSwatches(scales, colorsMap, threshold);
  }, [scales, colorsMap, threshold, enabled]);
}

/**
 * Get quick stats across all analyzed scales.
 */
export function useContrastStats(summaries: ScaleContrastSummary[]) {
  return useMemo(() => {
    if (summaries.length === 0) {
      return {
        totalSwatches: 0,
        totalPassing: 0,
        totalFailing: 0,
        averageCompliance: 0,
        scalesFullyCompliant: 0,
        scalesPartiallyCompliant: 0,
        scalesNonCompliant: 0
      };
    }

    const totalSwatches = summaries.reduce(
      (sum, s) => sum + s.passingSwatches.length + s.failingSwatches.length,
      0
    );
    const totalPassing = summaries.reduce((sum, s) => sum + s.passingSwatches.length, 0);
    const totalFailing = summaries.reduce((sum, s) => sum + s.failingSwatches.length, 0);
    const averageCompliance = totalSwatches > 0 ? totalPassing / totalSwatches : 0;

    const scalesFullyCompliant = summaries.filter(s => s.complianceRate === 1).length;
    const scalesPartiallyCompliant = summaries.filter(
      s => s.complianceRate > 0 && s.complianceRate < 1
    ).length;
    const scalesNonCompliant = summaries.filter(s => s.complianceRate === 0).length;

    return {
      totalSwatches,
      totalPassing,
      totalFailing,
      averageCompliance,
      scalesFullyCompliant,
      scalesPartiallyCompliant,
      scalesNonCompliant
    };
  }, [summaries]);
}

/**
 * Find recommended swatches across all scales.
 * Useful for quick reference in UI.
 */
export function useRecommendedSwatches(summaries: ScaleContrastSummary[]) {
  return useMemo(() => {
    return summaries
      .filter(s => s.recommendedStep !== null)
      .map(s => ({
        scaleId: s.scaleId,
        scaleName: s.scaleName,
        recommendedStep: s.recommendedStep!,
        targetBackground: s.targetBackground
      }));
  }, [summaries]);
}
