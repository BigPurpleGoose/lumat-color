import React from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  Separator,
  Callout,
  ScrollArea,
  Slider,
  Select,
  Switch,
} from "@radix-ui/themes";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon, MagicWandIcon } from "@radix-ui/react-icons";
import type { ColorScale } from "../types";
import { CurveControls } from "./CurveControls";
import { NEUTRAL_PROFILES } from "../utils/constants";
import { useAppStore } from "../store/useAppStore";
import { AUTO_FIX_PRESETS } from "../utils/autoFix";

interface ControlPanelProps {
  scale: ColorScale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (key: keyof ColorScale, value: any) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  scale,
  onUpdate,
}) => {
  const contrastMode = scale.contrastMode || "standard";
  const { getLightnessSteps } = useAppStore();

  const handleAutoFix = (
    preset: "wcag-aa" | "wcag-aaa" | "apca-body" | "apca-heading"
  ) => {
    try {
      const lightnessSteps = getLightnessSteps(scale);
      if (!lightnessSteps || lightnessSteps.length === 0) {
        console.error("Auto-fix failed: No lightness steps available");
        return;
      }

      const result = AUTO_FIX_PRESETS[preset](scale, lightnessSteps);
      if (!result || !result.scale) {
        console.error("Auto-fix failed: Invalid result");
        return;
      }

      let appliedChanges = 0;
      Object.entries(result.scale).forEach(([key, value]) => {
        if (value !== scale[key as keyof ColorScale]) {
          onUpdate(key as keyof ColorScale, value);
          appliedChanges++;
        }
      });

      if (appliedChanges > 0) {
        console.log(
          `Auto-fix applied ${appliedChanges} changes:`,
          result.improvements
        );
      } else {
        console.log("Scale already optimized for", preset);
      }
    } catch (error) {
      console.error("Auto-fix error:", error);
    }
  };

  const getModeDescription = () => {
    switch (contrastMode) {
      case "luminance-matched":
        return "Locks perceptual brightness (Y). Colors appear identical in grayscale.";
      case "apca-fixed":
        return "Locks OKLCH lightness. Consistent contrast across hues.";
      case "apca-target":
        return "Generates colors to meet a specific APCA Lc value.";
      case "wcag-target":
        return "Generates colors to meet a specific WCAG contrast ratio.";
      default:
        return "P3 gamut mapping may adjust both chroma and lightness.";
    }
  };

  const getModeBadgeText = () => {
    switch (contrastMode) {
      case "luminance-matched":
        return "Luminance Matched";
      case "apca-fixed":
        return "APCA Fixed";
      case "apca-target":
        return "APCA Target";
      case "wcag-target":
        return "WCAG Target";
      default:
        return null;
    }
  };

  return (
    <ScrollArea style={{ height: "100%" }}>
      <Box p="3" style={{ backgroundColor: "#18181b" }}>
        {/* COLOR SELECTION */}
        <Box mb="4">
          <Flex align="center" gap="2" mb="3">
            <Text size="2" weight="bold" color="blue">
              Color Selection
            </Text>
          </Flex>
          <Flex direction="column" gap="3">
            {/* Hue Control */}
            <Box>
              <Flex justify="between" mb="2">
                <Text
                  size="1"
                  weight="medium"
                  style={{
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Hue
                </Text>
                <Text
                  size="1"
                  weight="medium"
                  style={{ color: "#fafafa", fontFamily: "monospace" }}
                >
                  {scale.hue}°
                </Text>
              </Flex>
              <input
                type="range"
                min="0"
                max="360"
                value={scale.hue}
                onChange={(e) => onUpdate("hue", parseInt(e.target.value))}
                title="Adjust the base hue (0-360 degrees)"
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background:
                    "linear-gradient(to right, #f87171, #facc15, #4ade80, #60a5fa, #818cf8, #c084fc, #f472b6, #f87171)",
                }}
              />
              <Box
                mt="2"
                style={{
                  height: "8px",
                  width: "100%",
                  borderRadius: "9999px",
                  backgroundColor: `oklch(60% 0.3 ${scale.hue})`,
                }}
              />
            </Box>

            {/* Chroma Control */}
            <Box>
              <Flex justify="between" mb="2">
                <Text
                  size="1"
                  weight="medium"
                  style={{
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Target Chroma
                </Text>
                <Text
                  size="1"
                  weight="medium"
                  style={{ color: "#fafafa", fontFamily: "monospace" }}
                >
                  {scale.manualChroma.toFixed(3)}
                </Text>
              </Flex>
              <Slider
                value={[scale.manualChroma]}
                onValueChange={([value]) => onUpdate("manualChroma", value)}
                min={0}
                max={0.4}
                step={0.01}
                style={{ width: "100%" }}
              />
              <Text
                size="1"
                mt="2"
                style={{
                  color: "#a1a1aa",
                  lineHeight: "1.4",
                  fontSize: "10px",
                }}
              >
                {getModeDescription()}
              </Text>
            </Box>

            {/* Grayscale Profile */}
            <Box>
              <Flex justify="between" mb="2">
                <Text
                  size="1"
                  weight="medium"
                  style={{
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Grayscale Profile
                </Text>
                {scale.grayscaleProfile && (
                  <Badge color="indigo" variant="soft" size="1">
                    Active
                  </Badge>
                )}
              </Flex>
              <Select.Root
                value={scale.grayscaleProfile || "none"}
                onValueChange={(value) => {
                  const profile = value === "none" ? undefined : value;
                  if (profile && NEUTRAL_PROFILES[profile]) {
                    const neutralProfile = NEUTRAL_PROFILES[profile];
                    onUpdate("hue", neutralProfile.hue);
                    onUpdate("manualChroma", neutralProfile.chroma);
                    onUpdate("grayscaleProfile", profile);
                  } else {
                    onUpdate("grayscaleProfile", undefined);
                  }
                }}
              >
                <Select.Trigger style={{ width: "100%" }} />
                <Select.Content>
                  <Select.Item value="none">None (Color Scale)</Select.Item>
                  {Object.entries(NEUTRAL_PROFILES).map(([key, profile]) => (
                    <Select.Item key={key} value={key}>
                      {profile.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Text
                size="1"
                mt="2"
                style={{
                  color: "#a1a1aa",
                  lineHeight: "1.4",
                  fontSize: "10px",
                }}
              >
                {scale.grayscaleProfile
                  ? NEUTRAL_PROFILES[scale.grayscaleProfile]?.description
                  : "Select a neutral gray preset for achromatic scales"}
              </Text>
            </Box>
          </Flex>
        </Box>

        <Separator size="4" mb="4" />

        {/* CONTRAST STRATEGY */}
        <Box mb="4">
          <Flex align="center" justify="between" mb="3">
            <Flex align="center" gap="2">
              <Text size="2" weight="bold" color="purple">
                Contrast Strategy
              </Text>
              {getModeBadgeText() && (
                <Badge color="purple" variant="soft" size="1">
                  {getModeBadgeText()}
                </Badge>
              )}
            </Flex>
          </Flex>
          <Flex direction="column" gap="3">
            {/* Contrast Mode */}
            <Box>
              <Text
                size="1"
                weight="medium"
                mb="2"
                as="label"
                style={{
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                }}
              >
                Contrast Mode
              </Text>
              <Select.Root
                value={contrastMode}
                onValueChange={(value) => onUpdate("contrastMode", value)}
              >
                <Select.Trigger style={{ width: "100%" }} />
                <Select.Content>
                  <Select.Item value="standard">Standard</Select.Item>
                  <Select.Item value="apca-fixed">
                    APCA Fixed (Lock OKLCH L)
                  </Select.Item>
                  <Select.Item value="luminance-matched">
                    Luminance Matched (Lock Y)
                  </Select.Item>
                  <Select.Item value="apca-target">
                    APCA Target (Meet Lc)
                  </Select.Item>
                  <Select.Item value="wcag-target">
                    WCAG Target (Meet Ratio)
                  </Select.Item>
                </Select.Content>
              </Select.Root>
              {contrastMode !== "standard" && (
                <Callout.Root size="1" color="blue" variant="soft" mt="2">
                  <Callout.Text>{getModeDescription()}</Callout.Text>
                </Callout.Root>
              )}
            </Box>

            {/* APCA Target */}
            {contrastMode === "apca-target" && (
              <Box>
                <Flex justify="between" mb="2">
                  <Text
                    size="1"
                    weight="medium"
                    style={{
                      color: "#a1a1aa",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Target Lc
                  </Text>
                  <Text
                    size="1"
                    weight="medium"
                    style={{ color: "#fafafa", fontFamily: "monospace" }}
                  >
                    {scale.apcaTargetLc || 75}
                  </Text>
                </Flex>
                <Slider
                  value={[scale.apcaTargetLc || 75]}
                  onValueChange={([value]) => onUpdate("apcaTargetLc", value)}
                  min={45}
                  max={100}
                  step={5}
                  style={{ width: "100%" }}
                />
                <Text
                  size="1"
                  mt="1"
                  style={{ color: "#a1a1aa", fontSize: "10px" }}
                >
                  45: UI • 60: Large • 75: Body • 90: Small
                </Text>
              </Box>
            )}

            {/* WCAG Target */}
            {contrastMode === "wcag-target" && (
              <Box>
                <Flex justify="between" mb="2">
                  <Text
                    size="1"
                    weight="medium"
                    style={{
                      color: "#a1a1aa",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Target Ratio
                  </Text>
                  <Text
                    size="1"
                    weight="medium"
                    style={{ color: "#fafafa", fontFamily: "monospace" }}
                  >
                    {(scale.wcagTargetRatio || 4.5).toFixed(1)}:1
                  </Text>
                </Flex>
                <Slider
                  value={[scale.wcagTargetRatio || 4.5]}
                  onValueChange={([value]) =>
                    onUpdate("wcagTargetRatio", value)
                  }
                  min={3}
                  max={7}
                  step={0.5}
                  style={{ width: "100%" }}
                />
                <Text
                  size="1"
                  mt="1"
                  style={{ color: "#a1a1aa", fontSize: "10px" }}
                >
                  3:1: UI/Large • 4.5:1: AA • 7:1: AAA
                </Text>
              </Box>
            )}

            {/* Target Background - Now Global */}
            <Callout.Root size="1" color="gray" variant="soft">
              <Callout.Text>
                <Text size="1" style={{ color: "#a1a1aa" }}>
                  Target background for contrast calculations is set globally in
                  the{" "}
                  <Text weight="bold" style={{ color: "#d4d4d8" }}>
                    Accessibility Toolbar
                  </Text>{" "}
                  at the top of the page.
                </Text>
              </Callout.Text>
            </Callout.Root>
          </Flex>
        </Box>

        {/* ACCORDIONS */}
        <Accordion.Root type="multiple">
          {/* Fine-Tuning */}
          <Accordion.Item
            value="advanced"
            style={{
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "#27272a",
              marginBottom: "8px",
            }}
          >
            <Accordion.Trigger
              style={{
                all: "unset",
                width: "100%",
                padding: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Flex align="center" gap="2">
                <Text size="2" weight="medium">
                  Fine-Tuning
                </Text>
                {(scale.hueCurve?.shift !== 0 ||
                  scale.chromaCurve?.shift !== 0 ||
                  scale.chromaCompensation === false) && (
                  <Badge color="orange" variant="soft" size="1">
                    Active
                  </Badge>
                )}
              </Flex>
              <ChevronDownIcon />
            </Accordion.Trigger>
            <Accordion.Content
              style={{ padding: "12px", borderTop: "1px solid #3f3f46" }}
            >
              <Flex direction="column" gap="3">
                <Box>
                  <CurveControls scale={scale} onUpdate={onUpdate} />
                </Box>

                <Box>
                  <Flex align="center" justify="between" mb="2">
                    <Text size="1" weight="medium" style={{ color: "#a1a1aa" }}>
                      Chroma Compensation
                    </Text>
                    <Switch
                      checked={scale.chromaCompensation ?? true}
                      onCheckedChange={(checked) =>
                        onUpdate("chromaCompensation", checked)
                      }
                    />
                  </Flex>
                  <Text size="1" style={{ color: "#71717a", fontSize: "10px" }}>
                    Adjusts chroma based on hue for perceptual uniformity
                  </Text>
                </Box>
              </Flex>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </Box>
    </ScrollArea>
  );
};
