// Grayscale profile for creating complementary neutral color scales
export type GrayscaleProfileKey = 'truegray' | 'warmgray' | 'coolgray' | 'bluegray' | 'plum';

export interface GrayscaleProfile {
  key: GrayscaleProfileKey;
  name: string;
  hue: number;           // Base hue (0-360)
  chroma: number;        // Subtle chroma amount (0.005-0.015)
  description: string;
}

export interface ColorScale {
  id: string;
  name: string;
  hue: number;
  manualChroma: number;
  // Power curves for dynamic color adjustment across lightness range
  hueCurve: {
    shift: number;      // -180 to 180 degrees (hue shift at extremes)
    power: number;      // 0.5 to 2 (curve shape: <1 shifts darks, >1 shifts lights)
  };
  chromaCurve: {
    shift: number;      // -0.2 to 0.2 (chroma adjustment at extremes)
    power: number;      // 0.5 to 2 (curve shape)
  };
  // APCA-aligned contrast mode (optional feature)
  contrastMode?: 'standard' | 'apca-fixed' | 'luminance-matched' | 'apca-target' | 'wcag-target';  // Default: 'standard'
  targetBackground?: string;  // Background preset name from BACKGROUND_PRESETS (default: 'canvas-bg')
  apcaTolerance?: number;  // APCA Lc tolerance, default: 1.5
  apcaTargetLc?: number;  // Target APCA Lc value for 'apca-target' mode (e.g., 75)
  wcagTargetRatio?: number;  // Target WCAG ratio for 'wcag-target' mode (e.g., 4.5)
  enforceWCAG?: boolean;   // Enforce WCAG AA minimum, default: false
  chromaCompensation?: boolean;  // Apply perceptual chroma compensation by hue (default: true)
  // Contrast threshold for pattern detection (optional feature)
  contrastThreshold?: {
    enabled: boolean;     // Whether to show pass/fail indicators
    minLc: number;        // Minimum APCA Lc (e.g., 60 for body text)
    minWcag: number;      // Minimum WCAG ratio (e.g., 4.5 for AA)
    useApca: boolean;     // True = use APCA, False = use WCAG
    preset?: ContrastPresetKey;  // Optional preset reference
  };
  // Custom lightness steps (overrides global if provided)
  customLightnessSteps?: number[];
  // Grayscale profile for neutral color generation
  grayscaleProfile?: GrayscaleProfileKey;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  scales: ColorScale[];
  globalSettings?: GlobalSettings;  // Snapshot of global settings when project was saved
}

// Global settings shared across all projects
export interface GlobalSettings {
  lightnessSteps: number[];   // Default: [98, 96, 93, 90, 85, 80, 70, 60, 48, 40, 32, 26, 20, 17, 14]
  opacitySteps: number[];     // Default: [100, 90, 80, 70, 60, 50, 40, 30, 20, 15, 12, 10, 7, 5, 3, 0]
  enforceGlobalLightness: boolean;  // Lock all scales to same lightness steps
  allowPerScaleOverride: boolean;   // Allow individual scales to override
  blendMode: 'srgb' | 'linear';     // Opacity blending mode: 'srgb' matches Figma/CSS, 'linear' is physically accurate
}

// Global accessibility settings (unified across all views)
export interface AccessibilitySettings {
  enabled: boolean;           // Master toggle for accessibility indicators
  useApca: boolean;          // True = APCA, False = WCAG
  minLc: number;             // Minimum APCA Lc (e.g., 60 for body text, 75 for small text)
  minWcag: number;           // Minimum WCAG ratio (e.g., 4.5 for AA, 7.0 for AAA)
  preset: ContrastPresetKey; // Current preset selection
  targetBackground: string;  // Background preset name for contrast evaluation
}

// Background preset for testing
export interface BackgroundPreset {
  name: string;
  color: string;
  lightness: number;
}

// Contrast filter presets
export type ContrastPresetKey =
  | 'WCAG_AA_NORMAL'
  | 'WCAG_AA_LARGE'
  | 'WCAG_AAA_NORMAL'
  | 'WCAG_AAA_LARGE'
  | 'UI_COMPONENT'
  | 'WCAG_UI_COMPONENTS'
  | 'APCA_BODY_TEXT'
  | 'APCA_LARGE_TEXT'
  | 'APCA_HEADINGS'
  | 'APCA_UI'
  | 'APCA_BRONZE'
  | 'APCA_SILVER'
  | 'APCA_GOLD'
  | 'CUSTOM';

export interface ContrastPreset {
  name: string;
  value: number;
  type: 'wcag' | 'apca';
  description?: string;
}

export type ViewMode = 'swatch' | 'gradient' | 'matrix' | 'analysis';
