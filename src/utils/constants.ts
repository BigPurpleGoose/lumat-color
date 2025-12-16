/**
 * Constants and default values for lumat
 */

import { GlobalSettings, BackgroundPreset, ContrastPreset, ContrastPresetKey, GrayscaleProfile, AccessibilitySettings } from '../types';

// Default lightness scale (15 steps)
export const DEFAULT_LIGHTNESS_STEPS = [98, 96, 93, 90, 85, 80, 70, 60, 48, 40, 32, 26, 20, 17, 14];

// Default opacity scale (16 steps)
export const DEFAULT_OPACITY_STEPS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 15, 12, 10, 7, 5, 3, 0];

// Default global settings
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  lightnessSteps: DEFAULT_LIGHTNESS_STEPS,
  opacitySteps: DEFAULT_OPACITY_STEPS,
  enforceGlobalLightness: true,
  allowPerScaleOverride: false,
  blendMode: 'srgb', // Default to CSS/Figma-compatible blending
};

// Default accessibility settings
export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  enabled: false,              // Indicators off by default
  useApca: true,              // APCA as default standard
  minLc: 60,                  // APCA body text threshold
  minWcag: 4.5,               // WCAG AA normal text
  preset: 'APCA_BODY_TEXT',   // Default to body text preset
  targetBackground: 'canvas-bg', // Default to white background
};

// Grayscale profiles for creating complementary neutral color scales
export const NEUTRAL_PROFILES: Record<string, GrayscaleProfile> = {
  truegray: {
    key: 'truegray',
    name: 'True Gray',
    hue: 0,
    chroma: 0,
    description: 'Pure achromatic gray with no color bias'
  },
  warmgray: {
    key: 'warmgray',
    name: 'Warm Gray',
    hue: 40,
    chroma: 0.008,
    description: 'Subtle yellow-orange tint for warmer feel'
  },
  coolgray: {
    key: 'coolgray',
    name: 'Cool Gray',
    hue: 220,
    chroma: 0.008,
    description: 'Subtle blue tint for cooler feel'
  },
  bluegray: {
    key: 'bluegray',
    name: 'Blue Gray',
    hue: 240,
    chroma: 0.012,
    description: 'More pronounced blue for slate-like appearance'
  },
  plum: {
    key: 'plum',
    name: 'Plum Gray',
    hue: 280,
    chroma: 0.015,
    description: 'Purple tint for sophisticated neutral palette'
  }
};

// Background presets for testing colors in context
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { name: 'canvas-bg', color: '#ffffff', lightness: 100 },
  { name: 'canvas-bg-lv1', color: '#f7f8ff', lightness: 98 },
  { name: 'canvas-bg-lv2', color: '#dcdde6', lightness: 90 },
  { name: 'canvas-bg-lv2 (E)', color: '#23242b', lightness: 26 },
  { name: 'canvas-bg-lv1 (E)', color: '#13141a', lightness: 20 },
  { name: 'canvas-bg (E)', color: '#07070d', lightness: 14 },
];

// Contrast filter presets
export const CONTRAST_PRESETS: Record<ContrastPresetKey, ContrastPreset> = {
  WCAG_AA_NORMAL: {
    name: 'WCAG AA (Normal Text)',
    value: 4.5,
    type: 'wcag',
    description: 'Minimum contrast for normal text (14pt and below)'
  },
  WCAG_AA_LARGE: {
    name: 'WCAG AA (Large Text)',
    value: 3,
    type: 'wcag',
    description: 'Minimum contrast for large text (18pt+ or 14pt+ bold)'
  },
  WCAG_AAA_NORMAL: {
    name: 'WCAG AAA (Normal Text)',
    value: 7,
    type: 'wcag',
    description: 'Enhanced contrast for normal text'
  },
  WCAG_AAA_LARGE: {
    name: 'WCAG AAA (Large Text)',
    value: 4.5,
    type: 'wcag',
    description: 'Enhanced contrast for large text'
  },
  UI_COMPONENT: {
    name: 'UI Component',
    value: 3,
    type: 'wcag',
    description: 'Minimum contrast for UI components and graphics'
  },
  APCA_BODY_TEXT: {
    name: 'APCA Body Text',
    value: 60,
    type: 'apca',
    description: 'APCA Lc 60 for body text (fluent reading)'
  },
  APCA_LARGE_TEXT: {
    name: 'APCA Large Text',
    value: 45,
    type: 'apca',
    description: 'APCA Lc 45 for large text (headings, subheadings)'
  },
  APCA_HEADINGS: {
    name: 'APCA Headings',
    value: 75,
    type: 'apca',
    description: 'APCA Lc 75 for prominent headings'
  },
  APCA_UI: {
    name: 'APCA UI Elements',
    value: 45,
    type: 'apca',
    description: 'APCA Lc 45 for UI elements and non-text content'
  },
  APCA_BRONZE: {
    name: 'APCA Bronze (60 Lc)',
    value: 60,
    type: 'apca',
    description: 'Bronze certification - large text minimum'
  },
  APCA_SILVER: {
    name: 'APCA Silver (75 Lc)',
    value: 75,
    type: 'apca',
    description: 'Silver certification - body text standard'
  },
  APCA_GOLD: {
    name: 'APCA Gold (90 Lc)',
    value: 90,
    type: 'apca',
    description: 'Gold certification - small/critical text'
  },
  WCAG_UI_COMPONENTS: {
    name: 'WCAG 2.1 UI Components (3:1)',
    value: 3,
    type: 'wcag',
    description: 'Non-text contrast per SC 1.4.11'
  },
  CUSTOM: {
    name: 'Custom',
    value: 0,
    type: 'wcag',
    description: 'Define your own threshold'
  }
};

// Preset as array for UI selection
export const CONTRAST_PRESET_OPTIONS: Array<{ key: ContrastPresetKey; preset: ContrastPreset }> = [
  { key: 'WCAG_AA_NORMAL', preset: CONTRAST_PRESETS.WCAG_AA_NORMAL },
  { key: 'WCAG_AA_LARGE', preset: CONTRAST_PRESETS.WCAG_AA_LARGE },
  { key: 'WCAG_AAA_NORMAL', preset: CONTRAST_PRESETS.WCAG_AAA_NORMAL },
  { key: 'WCAG_AAA_LARGE', preset: CONTRAST_PRESETS.WCAG_AAA_LARGE },
  { key: 'UI_COMPONENT', preset: CONTRAST_PRESETS.UI_COMPONENT },
  { key: 'WCAG_UI_COMPONENTS', preset: CONTRAST_PRESETS.WCAG_UI_COMPONENTS },
  { key: 'APCA_BODY_TEXT', preset: CONTRAST_PRESETS.APCA_BODY_TEXT },
  { key: 'APCA_LARGE_TEXT', preset: CONTRAST_PRESETS.APCA_LARGE_TEXT },
  { key: 'APCA_HEADINGS', preset: CONTRAST_PRESETS.APCA_HEADINGS },
  { key: 'APCA_UI', preset: CONTRAST_PRESETS.APCA_UI },
  { key: 'APCA_BRONZE', preset: CONTRAST_PRESETS.APCA_BRONZE },
  { key: 'APCA_SILVER', preset: CONTRAST_PRESETS.APCA_SILVER },
  { key: 'APCA_GOLD', preset: CONTRAST_PRESETS.APCA_GOLD },
  { key: 'CUSTOM', preset: CONTRAST_PRESETS.CUSTOM },
];
