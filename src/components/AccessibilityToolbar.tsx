/**
 * Accessibility Toolbar Component
 *
 * Unified global accessibility controls for pass/fail indicators, contrast thresholds,
 * and background selection. Replaces fragmented accessibility controls scattered across
 * ControlPanel, AdvancedExportDialog, MatrixView, and Swatch components.
 *
 * Features:
 * - Master indicators toggle (Enable/Disable pass/fail indicators)
 * - Contrast mode switch (APCA / WCAG)
 * - Threshold sliders (APCA Lc, WCAG ratio)
 * - Preset dropdown (15 presets: WCAG AA/AAA, APCA Body/Large/Headings, etc.)
 * - Background selector (matches color testing backgrounds)
 */

import React from "react";
import {
  Flex,
  Text,
  Switch,
  Select,
  Slider,
  Badge,
  Separator,
} from "@radix-ui/themes";
import { useAppStore } from "../store/useAppStore";
import { CONTRAST_PRESET_OPTIONS } from "../utils/constants";

export const AccessibilityToolbar: React.FC = () => {
  const { accessibilitySettings, updateAccessibilitySettings } = useAppStore();

  // Handle preset selection
  const handlePresetChange = (presetKey: string) => {
    const preset = CONTRAST_PRESET_OPTIONS.find((p) => p.key === presetKey);
    if (!preset) return;

    updateAccessibilitySettings({
      preset: preset.key,
      useApca: preset.preset.type === "apca",
      ...(preset.preset.type === "apca"
        ? { minLc: preset.preset.value }
        : { minWcag: preset.preset.value }),
    });
  };

  // Handle APCA/WCAG mode toggle
  const handleModeToggle = (checked: boolean) => {
    updateAccessibilitySettings({ useApca: checked });
  };

  // Handle threshold slider changes
  const handleLcChange = (value: number[]) => {
    updateAccessibilitySettings({ minLc: value[0] });
  };

  const handleWcagChange = (value: number[]) => {
    updateAccessibilitySettings({ minWcag: value[0] });
  };

  // Handle background selection
  const handleBackgroundChange = (bgName: string) => {
    updateAccessibilitySettings({ targetBackground: bgName });
  };

  // Handle master indicators toggle
  const handleIndicatorsToggle = (checked: boolean) => {
    updateAccessibilitySettings({ enabled: checked });
  };

  return (
    <Flex
      direction="column"
      gap="3"
      p="3"
      style={{
        backgroundColor: "var(--gray-2)",
        borderBottom: "1px solid var(--gray-5)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Flex direction="row" gap="4" align="center" wrap="wrap">
        {/* Master Indicators Toggle */}
        <Flex align="center" gap="2">
          <Switch
            checked={accessibilitySettings.enabled}
            onCheckedChange={handleIndicatorsToggle}
            size="2"
          />
          <Text size="2" weight="medium">
            {accessibilitySettings.enabled ? "Indicators On" : "Indicators Off"}
          </Text>
        </Flex>

        <Separator orientation="vertical" style={{ height: "24px" }} />

        {/* APCA/WCAG Mode Toggle */}
        <Flex align="center" gap="2">
          <Text size="2" color="gray">
            WCAG
          </Text>
          <Switch
            checked={accessibilitySettings.useApca}
            onCheckedChange={handleModeToggle}
            size="2"
            disabled={!accessibilitySettings.enabled}
          />
          <Text size="2" color="gray">
            APCA
          </Text>
        </Flex>

        <Separator orientation="vertical" style={{ height: "24px" }} />

        {/* Preset Selector */}
        <Flex align="center" gap="2" style={{ minWidth: "200px" }}>
          <Text size="2" weight="medium">
            Preset:
          </Text>
          <Select.Root
            value={accessibilitySettings.preset}
            onValueChange={handlePresetChange}
            disabled={!accessibilitySettings.enabled}
          >
            <Select.Trigger style={{ flex: 1 }} />
            <Select.Content>
              <Select.Group>
                <Select.Label>WCAG Standards</Select.Label>
                <Select.Item value="WCAG_AA_NORMAL">
                  WCAG AA (Normal Text)
                </Select.Item>
                <Select.Item value="WCAG_AA_LARGE">
                  WCAG AA (Large Text)
                </Select.Item>
                <Select.Item value="WCAG_AAA_NORMAL">
                  WCAG AAA (Normal Text)
                </Select.Item>
                <Select.Item value="WCAG_AAA_LARGE">
                  WCAG AAA (Large Text)
                </Select.Item>
                <Select.Item value="UI_COMPONENT">
                  UI Component (3:1)
                </Select.Item>
                <Select.Item value="WCAG_UI_COMPONENTS">
                  WCAG 2.1 UI Components
                </Select.Item>
              </Select.Group>
              <Select.Separator />
              <Select.Group>
                <Select.Label>APCA Standards</Select.Label>
                <Select.Item value="APCA_BODY_TEXT">
                  APCA Body Text (60 Lc)
                </Select.Item>
                <Select.Item value="APCA_LARGE_TEXT">
                  APCA Large Text (45 Lc)
                </Select.Item>
                <Select.Item value="APCA_HEADINGS">
                  APCA Headings (75 Lc)
                </Select.Item>
                <Select.Item value="APCA_UI">
                  APCA UI Elements (45 Lc)
                </Select.Item>
                <Select.Item value="APCA_BRONZE">
                  APCA Bronze (60 Lc)
                </Select.Item>
                <Select.Item value="APCA_SILVER">
                  APCA Silver (75 Lc)
                </Select.Item>
                <Select.Item value="APCA_GOLD">APCA Gold (90 Lc)</Select.Item>
              </Select.Group>
              <Select.Separator />
              <Select.Item value="CUSTOM">Custom</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        <Separator orientation="vertical" style={{ height: "24px" }} />

        {/* Threshold Sliders */}
        {accessibilitySettings.useApca ? (
          <Flex align="center" gap="2" style={{ minWidth: "180px" }}>
            <Text size="2" weight="medium">
              Min APCA Lc:
            </Text>
            <Slider
              value={[accessibilitySettings.minLc]}
              onValueChange={handleLcChange}
              min={0}
              max={110}
              step={5}
              disabled={!accessibilitySettings.enabled}
              style={{ flex: 1 }}
            />
            <Badge size="1" color="blue">
              {accessibilitySettings.minLc}
            </Badge>
          </Flex>
        ) : (
          <Flex align="center" gap="2" style={{ minWidth: "180px" }}>
            <Text size="2" weight="medium">
              Min WCAG:
            </Text>
            <Slider
              value={[accessibilitySettings.minWcag]}
              onValueChange={handleWcagChange}
              min={1}
              max={21}
              step={0.1}
              disabled={!accessibilitySettings.enabled}
              style={{ flex: 1 }}
            />
            <Badge size="1" color="green">
              {accessibilitySettings.minWcag.toFixed(1)}
            </Badge>
          </Flex>
        )}

        <Separator orientation="vertical" style={{ height: "24px" }} />

        {/* Background Selector */}
        <Flex align="center" gap="2" style={{ minWidth: "200px" }}>
          <Text size="2" weight="medium">
            Background:
          </Text>
          <Select.Root
            value={accessibilitySettings.targetBackground}
            onValueChange={handleBackgroundChange}
            disabled={!accessibilitySettings.enabled}
          >
            <Select.Trigger style={{ flex: 1 }} />
            <Select.Content>
              <Select.Group>
                <Select.Label>Light Backgrounds</Select.Label>
                <Select.Item value="canvas-bg">Canvas BG (L100)</Select.Item>
                <Select.Item value="canvas-bg-lv1">
                  Canvas BG Lv1 (L98)
                </Select.Item>
                <Select.Item value="canvas-bg-lv2">
                  Canvas BG Lv2 (L90)
                </Select.Item>
              </Select.Group>
              <Select.Separator />
              <Select.Group>
                <Select.Label>Dark Backgrounds (Emphasized)</Select.Label>
                <Select.Item value="canvas-bg-lv2 (E)">
                  Canvas BG Lv2 (E) - L26
                </Select.Item>
                <Select.Item value="canvas-bg-lv1 (E)">
                  Canvas BG Lv1 (E) - L20
                </Select.Item>
                <Select.Item value="canvas-bg (E)">
                  Canvas BG (E) - L14
                </Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      {/* Info Badge showing current settings */}
      {accessibilitySettings.enabled && (
        <Flex gap="2" align="center">
          <Badge size="1" color="blue">
            {accessibilitySettings.useApca ? "APCA" : "WCAG"} Mode
          </Badge>
          <Badge size="1" color="green">
            Threshold:{" "}
            {accessibilitySettings.useApca
              ? `${accessibilitySettings.minLc} Lc`
              : `${accessibilitySettings.minWcag.toFixed(1)}:1`}
          </Badge>
          <Badge size="1" color="gray">
            On: {accessibilitySettings.targetBackground}
          </Badge>
        </Flex>
      )}
    </Flex>
  );
};
