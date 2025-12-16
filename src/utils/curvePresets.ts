/**
 * Bezier Curve Presets
 *
 * Pre-configured hue and chroma curves inspired by popular design systems
 * and color theory research. Provides instant access to proven curve patterns.
 *
 * Based on analysis of:
 * - Material Design 3 (Google)
 * - Tailwind CSS
 * - Radix Colors
 * - Apple Human Interface Guidelines
 * - IBM Carbon Design System
 */

export interface CurveConfig {
  shift: number;  // -1 to 1 (negative = shift down/left, positive = shift up/right)
  power: number;  // 0.1 to 3 (affects curve steepness)
}

export interface CurvePreset {
  name: string;
  description: string;
  hueCurve: CurveConfig;
  chromaCurve: CurveConfig;
  bestFor: string[];
  inspiration: string;
  visualization?: string; // ASCII art or emoji representation
}

/**
 * Complete collection of curve presets
 */
export const CURVE_PRESETS: Record<string, CurvePreset> = {
  /**
   * Linear: No curves, pure mathematical progression
   */
  'linear': {
    name: 'Linear',
    description: 'No curve adjustment, pure linear progression from L*14 to L*98',
    hueCurve: { shift: 0, power: 1 },
    chromaCurve: { shift: 0, power: 1 },
    bestFor: ['Scientific visualization', 'Data charts', 'Technical documentation'],
    inspiration: 'Mathematical baseline',
    visualization: '─────── (straight line)',
  },

  /**
   * Material Design 3: Vibrant midtones, subtle endpoints
   */
  'material-3': {
    name: 'Material Design 3',
    description: 'Vibrant midtones with smooth transitions, inspired by Material You',
    hueCurve: { shift: 0.1, power: 1.2 },
    chromaCurve: { shift: 0.2, power: 1.4 },
    bestFor: ['Mobile apps', 'Android interfaces', 'Expressive brand colors'],
    inspiration: 'Google Material Design 3 (2021)',
    visualization: '╭─────╮ (gentle arc)',
  },

  /**
   * Tailwind: Balanced, predictable, slightly enhanced midtones
   */
  'tailwind': {
    name: 'Tailwind CSS',
    description: 'Balanced progression with slightly enhanced midtones for UI versatility',
    hueCurve: { shift: 0, power: 1.1 },
    chromaCurve: { shift: 0.15, power: 1.2 },
    bestFor: ['Web applications', 'Utility-first CSS', 'Developer tools'],
    inspiration: 'Tailwind CSS color system',
    visualization: '╭────╮ (subtle curve)',
  },

  /**
   * Radix: Perceptually uniform, scientifically balanced
   */
  'radix': {
    name: 'Radix Colors',
    description: 'Scientifically balanced for perceptual uniformity and accessibility',
    hueCurve: { shift: -0.05, power: 1.15 },
    chromaCurve: { shift: 0.1, power: 1.1 },
    bestFor: ['Design systems', 'Accessibility-first products', 'Component libraries'],
    inspiration: 'Radix Colors by WorkOS',
    visualization: '─╭──╮─ (balanced)',
  },

  /**
   * Apple: Sophisticated, refined, natural-looking
   */
  'apple-hig': {
    name: 'Apple HIG',
    description: 'Refined progression with natural-looking color transitions',
    hueCurve: { shift: 0.05, power: 1.3 },
    chromaCurve: { shift: 0.25, power: 1.5 },
    bestFor: ['iOS apps', 'macOS interfaces', 'Premium products'],
    inspiration: 'Apple Human Interface Guidelines',
    visualization: '╭───╮ (elegant curve)',
  },

  /**
   * IBM Carbon: Professional, corporate, high contrast
   */
  'carbon': {
    name: 'IBM Carbon',
    description: 'Professional appearance with strong contrast for enterprise use',
    hueCurve: { shift: -0.1, power: 0.9 },
    chromaCurve: { shift: 0.05, power: 1.0 },
    bestFor: ['Enterprise software', 'Data dashboards', 'Professional tools'],
    inspiration: 'IBM Carbon Design System',
    visualization: '╲───╱ (wide curve)',
  },

  /**
   * Vibrant: Maximum color intensity for brands
   */
  'vibrant': {
    name: 'Vibrant Brand',
    description: 'Maximum chroma in midtones for bold, attention-grabbing colors',
    hueCurve: { shift: 0.2, power: 1.5 },
    chromaCurve: { shift: 0.4, power: 1.8 },
    bestFor: ['Marketing sites', 'Brand identity', 'Creative portfolios'],
    inspiration: 'High-energy brand guidelines',
    visualization: '╭───╮ (steep arc)',
  },

  /**
   * Muted: Sophisticated, low-saturation
   */
  'muted': {
    name: 'Muted Sophistication',
    description: 'Reduced chroma for elegant, sophisticated appearance',
    hueCurve: { shift: -0.1, power: 0.95 },
    chromaCurve: { shift: -0.2, power: 0.8 },
    bestFor: ['Luxury brands', 'Editorial design', 'Minimalist interfaces'],
    inspiration: 'High-end fashion and luxury design',
    visualization: '─╮  ╭─ (shallow curve)',
  },

  /**
   * Pastel: Light, airy, soft colors
   */
  'pastel': {
    name: 'Pastel Soft',
    description: 'Reduced chroma with emphasis on light tones for soft, airy feel',
    hueCurve: { shift: 0.15, power: 1.4 },
    chromaCurve: { shift: -0.15, power: 0.85 },
    bestFor: ['Children\'s products', 'Wellness apps', 'Soft UI designs'],
    inspiration: 'Pastel color theory',
    visualization: '  ╭─── (light emphasis)',
  },

  /**
   * Dark Mode: Optimized for dark backgrounds
   */
  'dark-mode': {
    name: 'Dark Mode Optimized',
    description: 'Enhanced lighter tones while maintaining dark endpoint accessibility',
    hueCurve: { shift: 0.25, power: 1.6 },
    chromaCurve: { shift: 0.3, power: 1.5 },
    bestFor: ['Dark UI themes', 'Night mode', 'Low-light environments'],
    inspiration: 'Dark mode best practices',
    visualization: '───╭─╮ (light emphasis)',
  },

  /**
   * High Contrast: Accessibility-first
   */
  'high-contrast': {
    name: 'High Contrast',
    description: 'Maximized contrast for accessibility compliance',
    hueCurve: { shift: -0.2, power: 0.85 },
    chromaCurve: { shift: -0.1, power: 0.9 },
    bestFor: ['Accessibility modes', 'Government sites', 'Public services'],
    inspiration: 'WCAG AAA guidelines',
    visualization: '╲─────╱ (strong separation)',
  },

  /**
   * Monochrome: Near-grayscale with subtle hue
   */
  'monochrome': {
    name: 'Monochrome',
    description: 'Minimal chroma for near-grayscale appearance with subtle hue',
    hueCurve: { shift: 0, power: 1 },
    chromaCurve: { shift: -0.4, power: 0.6 },
    bestFor: ['Typography scales', 'Neutral UI', 'Grayscale designs'],
    inspiration: 'Grayscale color theory',
    visualization: '─ (almost flat)',
  },

  /**
   * Natural: Inspired by nature photography
   */
  'natural': {
    name: 'Natural Tones',
    description: 'Curve patterns found in nature photography and organic materials',
    hueCurve: { shift: 0.08, power: 1.25 },
    chromaCurve: { shift: 0.18, power: 1.35 },
    bestFor: ['Nature brands', 'Organic products', 'Environmental themes'],
    inspiration: 'Natural color distributions in photography',
    visualization: '╭──╮ (organic curve)',
  },

  /**
   * Neon: Electric, digital, cyberpunk
   */
  'neon': {
    name: 'Neon Electric',
    description: 'Extreme chroma in bright tones for electric, digital aesthetics',
    hueCurve: { shift: 0.35, power: 1.8 },
    chromaCurve: { shift: 0.5, power: 2.0 },
    bestFor: ['Gaming interfaces', 'Cyberpunk themes', 'Digital art'],
    inspiration: 'Neon lighting and digital displays',
    visualization: '───╭╮ (sharp peak)',
  },

  /**
   * Retro: 1970s-1980s inspired
   */
  'retro-70s': {
    name: 'Retro 70s',
    description: 'Warm, earthy tones inspired by 1970s design aesthetics',
    hueCurve: { shift: -0.15, power: 1.05 },
    chromaCurve: { shift: 0.12, power: 1.25 },
    bestFor: ['Vintage designs', 'Retro branding', 'Nostalgic themes'],
    inspiration: '1970s color palettes',
    visualization: '╲──╮ (warm shift)',
  },

  /**
   * Soft UI: Neumorphism-inspired
   */
  'soft-ui': {
    name: 'Soft UI / Neumorphism',
    description: 'Subtle chroma variations for soft, dimensional UI designs',
    hueCurve: { shift: 0.05, power: 1.1 },
    chromaCurve: { shift: 0.08, power: 1.15 },
    bestFor: ['Neumorphic designs', 'Soft shadows', '3D-effect UIs'],
    inspiration: 'Neumorphism design trend',
    visualization: '─╭╮─ (gentle peak)',
  },
};

/**
 * Preset categories for easier browsing
 */
export const PRESET_CATEGORIES = {
  'Design Systems': ['material-3', 'tailwind', 'radix', 'apple-hig', 'carbon'],
  'Aesthetics': ['vibrant', 'muted', 'pastel', 'natural', 'retro-70s'],
  'Accessibility': ['high-contrast', 'dark-mode'],
  'Special Effects': ['neon', 'soft-ui', 'monochrome'],
  'Baseline': ['linear'],
};

/**
 * Get preset by name
 */
export function getPreset(name: string): CurvePreset | undefined {
  if (!name || typeof name !== 'string') {
    console.warn('Invalid preset name:', name);
    return undefined;
  }
  return CURVE_PRESETS[name];
}

/**
 * Get all preset names
 */
export function getPresetNames(): string[] {
  return Object.keys(CURVE_PRESETS);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: string): CurvePreset[] {
  const presetNames = PRESET_CATEGORIES[category as keyof typeof PRESET_CATEGORIES] || [];
  return presetNames.map(name => CURVE_PRESETS[name]).filter(Boolean);
}

/**
 * Recommend preset based on scale characteristics
 */
export function recommendPreset(
  chroma: number,
  targetBackground: string,
  contrastMode: string
): string {
  // High chroma = vibrant presets
  if (chroma > 0.2) {
    return 'vibrant';
  }

  // Low chroma = muted or monochrome
  if (chroma < 0.05) {
    return 'monochrome';
  }

  // Dark background = dark mode optimized
  if (targetBackground === 'black' || targetBackground === 'dark-gray') {
    return 'dark-mode';
  }

  // Accessibility focus = high contrast
  if (contrastMode === 'apca-fixed' || contrastMode === 'wcag-target') {
    return 'high-contrast';
  }

  // Default to popular design system
  return 'tailwind';
}

/**
 * Blend two presets together
 */
export function blendPresets(
  preset1Name: string,
  preset2Name: string,
  ratio: number = 0.5
): { hueCurve: CurveConfig; chromaCurve: CurveConfig } {
  const p1 = CURVE_PRESETS[preset1Name];
  const p2 = CURVE_PRESETS[preset2Name];

  if (!p1 || !p2) {
    return {
      hueCurve: { shift: 0, power: 1 },
      chromaCurve: { shift: 0, power: 1 },
    };
  }

  // Linear interpolation between presets
  const hueCurve = {
    shift: p1.hueCurve.shift * (1 - ratio) + p2.hueCurve.shift * ratio,
    power: p1.hueCurve.power * (1 - ratio) + p2.hueCurve.power * ratio,
  };

  const chromaCurve = {
    shift: p1.chromaCurve.shift * (1 - ratio) + p2.chromaCurve.shift * ratio,
    power: p1.chromaCurve.power * (1 - ratio) + p2.chromaCurve.power * ratio,
  };

  return { hueCurve, chromaCurve };
}

/**
 * Create custom preset from parameters
 */
export function createCustomPreset(
  name: string,
  description: string,
  hueCurve: CurveConfig,
  chromaCurve: CurveConfig,
  bestFor: string[]
): CurvePreset {
  return {
    name,
    description,
    hueCurve,
    chromaCurve,
    bestFor,
    inspiration: 'Custom user preset',
  };
}

/**
 * Validate curve configuration
 */
export function validateCurveConfig(curve: CurveConfig): boolean {
  return (
    curve.shift >= -1 &&
    curve.shift <= 1 &&
    curve.power >= 0.1 &&
    curve.power <= 3
  );
}

/**
 * Export preset as shareable JSON
 */
export function exportPreset(presetName: string): string {
  const preset = CURVE_PRESETS[presetName];
  if (!preset) {
    return '{}';
  }
  return JSON.stringify(preset, null, 2);
}

/**
 * Import preset from JSON
 */
export function importPreset(json: string): CurvePreset | null {
  try {
    const preset = JSON.parse(json) as CurvePreset;

    // Validate structure
    if (!preset.name || !preset.hueCurve || !preset.chromaCurve) {
      return null;
    }

    if (!validateCurveConfig(preset.hueCurve) || !validateCurveConfig(preset.chromaCurve)) {
      return null;
    }

    return preset;
  } catch {
    return null;
  }
}
