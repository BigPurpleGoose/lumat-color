/**
 * Delta Analysis Utilities
 *
 * Calculates deviations and accuracy metrics between intended and actual colors.
 * Useful for analyzing how power curves, gamut mapping, and opacity blending
 * affect the final color output.
 */

// Simple Euclidean distance in OKLCH space for deltaE approximation
function calculateDeltaE(c1: { l: number; c: number; h: number }, c2: { l: number; c: number; h: number }): number {
  const dL = c1.l - c2.l;
  const dC = c1.c - c2.c;
  // Hue difference accounts for circular nature
  let dH = c1.h - c2.h;
  while (dH > 180) dH -= 360;
  while (dH < -180) dH += 360;

  // Approximate deltaE using weighted Euclidean distance
  return Math.sqrt(dL * dL + (dC * 100) * (dC * 100) + (dH / 3.6) * (dH / 3.6));
}

export interface DeltaMetrics {
  deltaL: number;          // Lightness difference (intended - actual)
  deltaC: number;          // Chroma difference
  deltaH: number;          // Hue difference (smallest angle)
  deltaE: number;          // Total perceptual difference (DeltaE)
  percentError: number;    // Absolute lightness error as percentage
}

export interface ColorComparison {
  intended: {
    l: number;
    c: number;
    h: number;
  };
  actual: {
    l: number;
    c: number;
    h: number;
  };
  delta: DeltaMetrics;
}

/**
 * Calculate the smallest angular difference between two hues
 * Accounts for circular nature of hue (0° = 360°)
 */
export const calculateHueDelta = (h1: number, h2: number): number => {
  let delta = h2 - h1;

  // Normalize to -180 to 180 range
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;

  return delta;
};

/**
 * Calculate comprehensive delta metrics between two OKLCH colors
 */
export const calculateDelta = (
  intended: { l: number; c: number; h: number },
  actual: { l: number; c: number; h: number }
): DeltaMetrics => {
  // Individual component deltas
  const deltaL = intended.l - actual.l;
  const deltaC = intended.c - actual.c;
  const deltaH = calculateHueDelta(intended.h, actual.h);

  // DeltaE (perceptual difference) using simplified calculation
  const deltaEValue = calculateDeltaE(intended, actual);

  // Percent error in lightness
  const percentError = intended.l > 0 ? Math.abs(deltaL / intended.l) * 100 : 0;

  return {
    deltaL,
    deltaC,
    deltaH,
    deltaE: deltaEValue,
    percentError
  };
};

/**
 * Create a full comparison between intended and actual colors
 */
export const compareColors = (
  intended: { l: number; c: number; h: number },
  actual: { l: number; c: number; h: number }
): ColorComparison => {
  return {
    intended,
    actual,
    delta: calculateDelta(intended, actual)
  };
};

/**
 * Assess the quality of a color match
 * Returns a rating: 'excellent' | 'good' | 'fair' | 'poor'
 */
export const assessMatchQuality = (delta: DeltaMetrics): {
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
} => {
  const { deltaE, percentError } = delta;

  // DeltaE thresholds:
  // < 1: Not perceptible by human eye
  // < 2: Perceptible through close observation
  // < 10: Perceptible at a glance
  // > 10: Colors are more different than similar

  if (deltaE < 1 && percentError < 1) {
    return {
      rating: 'excellent',
      description: 'Imperceptible difference'
    };
  } else if (deltaE < 2 && percentError < 2) {
    return {
      rating: 'good',
      description: 'Difference only noticeable on close inspection'
    };
  } else if (deltaE < 5 && percentError < 5) {
    return {
      rating: 'fair',
      description: 'Noticeable difference but similar overall'
    };
  } else {
    return {
      rating: 'poor',
      description: 'Significant difference'
    };
  }
};

/**
 * Analyze a color scale to find the largest deviations
 * Useful for identifying which steps are most affected by curves or gamut mapping
 */
export const analyzeScaleAccuracy = (
  comparisons: ColorComparison[]
): {
  averageDeltaE: number;
  maxDeltaE: ColorComparison;
  averageLightnessDelta: number;
  maxLightnessDelta: ColorComparison;
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
} => {
  if (comparisons.length === 0) {
    return {
      averageDeltaE: 0,
      maxDeltaE: {
        intended: { l: 0, c: 0, h: 0 },
        actual: { l: 0, c: 0, h: 0 },
        delta: { deltaL: 0, deltaC: 0, deltaH: 0, deltaE: 0, percentError: 0 }
      },
      averageLightnessDelta: 0,
      maxLightnessDelta: {
        intended: { l: 0, c: 0, h: 0 },
        actual: { l: 0, c: 0, h: 0 },
        delta: { deltaL: 0, deltaC: 0, deltaH: 0, deltaE: 0, percentError: 0 }
      },
      overallQuality: 'excellent'
    };
  }

  // Calculate averages
  const totalDeltaE = comparisons.reduce((sum, c) => sum + c.delta.deltaE, 0);
  const totalLightnessDelta = comparisons.reduce((sum, c) => sum + Math.abs(c.delta.deltaL), 0);
  const averageDeltaE = totalDeltaE / comparisons.length;
  const averageLightnessDelta = totalLightnessDelta / comparisons.length;

  // Find maximums
  const maxDeltaE = comparisons.reduce((max, c) =>
    c.delta.deltaE > max.delta.deltaE ? c : max
  );
  const maxLightnessDelta = comparisons.reduce((max, c) =>
    Math.abs(c.delta.deltaL) > Math.abs(max.delta.deltaL) ? c : max
  );

  // Overall quality based on average DeltaE
  let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (averageDeltaE < 1) overallQuality = 'excellent';
  else if (averageDeltaE < 2) overallQuality = 'good';
  else if (averageDeltaE < 5) overallQuality = 'fair';
  else overallQuality = 'poor';

  return {
    averageDeltaE,
    maxDeltaE,
    averageLightnessDelta,
    maxLightnessDelta,
    overallQuality
  };
};

/**
 * Format delta values for display
 */
export const formatDelta = (value: number, precision: number = 2): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(precision)}`;
};

/**
 * Get a CSS class name for delta visualization
 * Based on the magnitude of the delta
 */
export const getDeltaClassName = (delta: number, type: 'lightness' | 'chroma' | 'hue' | 'deltaE'): string => {
  const absDelta = Math.abs(delta);

  const thresholds = {
    lightness: [1, 2, 5],
    chroma: [0.01, 0.02, 0.05],
    hue: [2, 5, 10],
    deltaE: [1, 2, 5]
  };

  const [excellent, good, fair] = thresholds[type];

  if (absDelta < excellent) return 'delta-excellent';
  if (absDelta < good) return 'delta-good';
  if (absDelta < fair) return 'delta-fair';
  return 'delta-poor';
};
