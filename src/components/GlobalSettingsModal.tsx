import React, { useState } from "react";
import {
  Dialog,
  Flex,
  Box,
  Button,
  Text,
  Heading,
  Checkbox,
  ScrollArea,
  Popover,
  SegmentedControl,
  Callout,
  Badge,
} from "@radix-ui/themes";
import {
  Cross2Icon,
  PlusIcon,
  TrashIcon,
  ResetIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { useAppStore } from "../store/useAppStore";
import { DEFAULT_GLOBAL_SETTINGS } from "../utils/constants";

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { globalSettings, updateGlobalSettings, resetGlobalSettings } =
    useAppStore();

  const [lightnessSteps, setLightnessSteps] = useState(
    globalSettings.lightnessSteps
  );
  const [opacitySteps, setOpacitySteps] = useState(globalSettings.opacitySteps);
  const [enforceGlobalLightness, setEnforceGlobalLightness] = useState(
    globalSettings.enforceGlobalLightness
  );
  const [allowPerScaleOverride, setAllowPerScaleOverride] = useState(
    globalSettings.allowPerScaleOverride
  );
  const [blendMode, setBlendMode] = useState<"srgb" | "linear">(
    globalSettings.blendMode || "srgb"
  );

  const handleSave = () => {
    updateGlobalSettings({
      lightnessSteps: lightnessSteps.sort((a, b) => b - a), // Descending order
      opacitySteps: opacitySteps.sort((a, b) => b - a),
      enforceGlobalLightness,
      allowPerScaleOverride,
      blendMode,
    });
    onClose();
  };

  const handleReset = () => {
    if (
      confirm(
        "Reset to default global settings? This will affect all projects."
      )
    ) {
      resetGlobalSettings();
      setLightnessSteps(DEFAULT_GLOBAL_SETTINGS.lightnessSteps);
      setOpacitySteps(DEFAULT_GLOBAL_SETTINGS.opacitySteps);
      setEnforceGlobalLightness(DEFAULT_GLOBAL_SETTINGS.enforceGlobalLightness);
      setAllowPerScaleOverride(DEFAULT_GLOBAL_SETTINGS.allowPerScaleOverride);
      setBlendMode(DEFAULT_GLOBAL_SETTINGS.blendMode);
    }
  };

  const addLightnessStep = () => {
    const newValue = 50;
    setLightnessSteps([...lightnessSteps, newValue].sort((a, b) => b - a));
  };

  const removeLightnessStep = (index: number) => {
    setLightnessSteps(lightnessSteps.filter((_, i) => i !== index));
  };

  const updateLightnessStep = (index: number, value: number) => {
    const newSteps = [...lightnessSteps];
    newSteps[index] = Math.max(0, Math.min(100, value));
    setLightnessSteps(newSteps.sort((a, b) => b - a));
  };

  const addOpacityStep = () => {
    const newValue = 50;
    setOpacitySteps([...opacitySteps, newValue].sort((a, b) => b - a));
  };

  const removeOpacityStep = (index: number) => {
    setOpacitySteps(opacitySteps.filter((_, i) => i !== index));
  };

  const updateOpacityStep = (index: number, value: number) => {
    const newSteps = [...opacitySteps];
    newSteps[index] = Math.max(0, Math.min(100, value));
    setOpacitySteps(newSteps.sort((a, b) => b - a));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: "700px", maxHeight: "90vh" }}>
        <Dialog.Title>Global Settings</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Configure shared lightness and opacity scales for all color systems
        </Dialog.Description>

        <ScrollArea style={{ height: "500px" }}>
          <Flex direction="column" gap="5">
            {/* Enforcement Options */}
            <Box
              p="4"
              style={{
                backgroundColor: "#18181b",
                borderRadius: "8px",
                border: "1px solid #3f3f46",
              }}
            >
              <Heading size="4" mb="4">
                Enforcement
              </Heading>

              <Flex direction="column" gap="4">
                <label
                  style={{ display: "flex", gap: "12px", cursor: "pointer" }}
                >
                  <Checkbox
                    checked={enforceGlobalLightness}
                    onCheckedChange={(checked) =>
                      setEnforceGlobalLightness(checked as boolean)
                    }
                  />
                  <Box style={{ flex: 1 }}>
                    <Text size="2" weight="medium" style={{ display: "block" }}>
                      Enforce Global Lightness Scale
                    </Text>
                    <Text
                      size="1"
                      color="gray"
                      style={{ display: "block", marginTop: "4px" }}
                    >
                      All color scales will use the same lightness steps,
                      ensuring consistent naming and contrast patterns across
                      your design system.
                    </Text>
                  </Box>
                </label>

                <label
                  style={{
                    display: "flex",
                    gap: "12px",
                    cursor: "pointer",
                    opacity: enforceGlobalLightness ? 1 : 0.5,
                  }}
                >
                  <Checkbox
                    checked={allowPerScaleOverride}
                    onCheckedChange={(checked) =>
                      setAllowPerScaleOverride(checked as boolean)
                    }
                    disabled={!enforceGlobalLightness}
                  />
                  <Box style={{ flex: 1 }}>
                    <Text size="2" weight="medium" style={{ display: "block" }}>
                      Allow Per-Scale Override
                    </Text>
                    <Text
                      size="1"
                      color="gray"
                      style={{ display: "block", marginTop: "4px" }}
                    >
                      Individual scales can define custom lightness steps if
                      needed.
                    </Text>
                  </Box>
                </label>
              </Flex>
            </Box>

            {/* Opacity Blending Mode */}
            <Box
              p="4"
              style={{
                backgroundColor: "#18181b",
                borderRadius: "8px",
                border: "1px solid #3f3f46",
              }}
            >
              <Flex justify="between" align="center" mb="3">
                <Heading size="4">Opacity Blending</Heading>
                <Popover.Root>
                  <Popover.Trigger>
                    <Button size="1" variant="ghost">
                      <InfoCircledIcon />
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content style={{ maxWidth: "420px" }}>
                    <Flex direction="column" gap="3">
                      <Heading size="3">Blending Mode Comparison</Heading>

                      <Box>
                        <Text
                          size="2"
                          weight="bold"
                          style={{ display: "block", marginBottom: "4px" }}
                        >
                          sRGB (Standard) — Recommended
                        </Text>
                        <Text
                          size="2"
                          color="gray"
                          style={{ display: "block", marginBottom: "8px" }}
                        >
                          Matches CSS alpha compositing and Figma's default
                          behavior. Creates a smoother, more gradual visual
                          progression through opacity levels.
                        </Text>
                        <Callout.Root size="1" color="green">
                          <Callout.Text>
                            <strong>Best for:</strong> Design consistency,
                            matching Figma mockups, predictable opacity behavior
                          </Callout.Text>
                        </Callout.Root>
                      </Box>

                      <Box>
                        <Text
                          size="2"
                          weight="bold"
                          style={{ display: "block", marginBottom: "4px" }}
                        >
                          Linear RGB (Scientific)
                        </Text>
                        <Text
                          size="2"
                          color="gray"
                          style={{ display: "block", marginBottom: "8px" }}
                        >
                          Physically accurate light mixing. Converts to linear
                          space before blending, creating a faster, more
                          aggressive progression through mid-opacity values.
                        </Text>
                        <Callout.Root size="1" color="blue">
                          <Callout.Text>
                            <strong>Best for:</strong> Scientific applications,
                            physical simulation, photography workflows
                          </Callout.Text>
                        </Callout.Root>
                      </Box>

                      <Box pt="2" style={{ borderTop: "1px solid #3f3f46" }}>
                        <Text size="1" color="gray">
                          <strong>Key difference:</strong> At 50% opacity on
                          white, a dark color will appear ~2-3 L* units lighter
                          in Linear mode due to gamma correction curves.
                        </Text>
                      </Box>
                    </Flex>
                  </Popover.Content>
                </Popover.Root>
              </Flex>

              <SegmentedControl.Root
                value={blendMode}
                onValueChange={(value) =>
                  setBlendMode(value as "srgb" | "linear")
                }
              >
                <SegmentedControl.Item value="srgb">
                  <Flex align="center" gap="2">
                    <Text>sRGB</Text>
                    <Badge size="1" color="green">
                      Figma/CSS
                    </Badge>
                  </Flex>
                </SegmentedControl.Item>
                <SegmentedControl.Item value="linear">
                  <Flex align="center" gap="2">
                    <Text>Linear</Text>
                    <Badge size="1" color="blue">
                      Scientific
                    </Badge>
                  </Flex>
                </SegmentedControl.Item>
              </SegmentedControl.Root>

              <Text
                size="1"
                color="gray"
                style={{ display: "block", marginTop: "12px" }}
              >
                Current mode:{" "}
                <strong
                  style={{
                    color: blendMode === "srgb" ? "#22c55e" : "#3b82f6",
                  }}
                >
                  {blendMode === "srgb"
                    ? "sRGB (Standard)"
                    : "Linear RGB (Scientific)"}
                </strong>
              </Text>
            </Box>

            {/* Lightness Steps */}
            <Box
              p="4"
              style={{
                backgroundColor: "#18181b",
                borderRadius: "8px",
                border: "1px solid #3f3f46",
              }}
            >
              <Flex justify="between" align="center" mb="4">
                <Heading size="4">Lightness Steps</Heading>
                <Button onClick={addLightnessStep} size="2" variant="soft">
                  <PlusIcon /> Add Step
                </Button>
              </Flex>

              <Flex wrap="wrap" gap="2" mb="3">
                {lightnessSteps.map((value, index) => (
                  <Flex key={index} align="center" gap="1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) =>
                        updateLightnessStep(index, Number(e.target.value))
                      }
                      style={{
                        width: "72px",
                        padding: "6px 8px",
                        backgroundColor: "#27272a",
                        border: "1px solid #3f3f46",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "white",
                        fontFamily: "monospace",
                      }}
                    />
                    <Button
                      onClick={() => removeLightnessStep(index)}
                      variant="ghost"
                      color="red"
                      size="1"
                      title="Remove step"
                    >
                      <TrashIcon />
                    </Button>
                  </Flex>
                ))}
              </Flex>

              <Flex align="start" gap="2">
                <InfoCircledIcon
                  width="16"
                  height="16"
                  style={{ flexShrink: 0, marginTop: "2px", color: "#a1a1aa" }}
                />
                <Text size="1" color="gray">
                  Current: {lightnessSteps.length} steps from L
                  {Math.max(...lightnessSteps)} to L
                  {Math.min(...lightnessSteps)}
                </Text>
              </Flex>
            </Box>

            {/* Opacity Steps */}
            <Box
              p="4"
              style={{
                backgroundColor: "#18181b",
                borderRadius: "8px",
                border: "1px solid #3f3f46",
              }}
            >
              <Flex justify="between" align="center" mb="4">
                <Heading size="4">Opacity Steps (for Matrix View)</Heading>
                <Button onClick={addOpacityStep} size="2" variant="soft">
                  <PlusIcon /> Add Step
                </Button>
              </Flex>

              <Flex wrap="wrap" gap="2" mb="3">
                {opacitySteps.map((value, index) => (
                  <Flex key={index} align="center" gap="1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) =>
                        updateOpacityStep(index, Number(e.target.value))
                      }
                      style={{
                        width: "72px",
                        padding: "6px 8px",
                        backgroundColor: "#27272a",
                        border: "1px solid #3f3f46",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "white",
                        fontFamily: "monospace",
                      }}
                    />
                    <Button
                      onClick={() => removeOpacityStep(index)}
                      variant="ghost"
                      color="red"
                      size="1"
                      title="Remove step"
                    >
                      <TrashIcon />
                    </Button>
                  </Flex>
                ))}
              </Flex>

              <Flex align="start" gap="2">
                <InfoCircledIcon
                  width="16"
                  height="16"
                  style={{ flexShrink: 0, marginTop: "2px", color: "#a1a1aa" }}
                />
                <Text size="1" color="gray">
                  Current: {opacitySteps.length} steps from{" "}
                  {Math.max(...opacitySteps)}% to {Math.min(...opacitySteps)}%
                </Text>
              </Flex>
            </Box>
          </Flex>
        </ScrollArea>

        {/* Footer */}
        <Flex gap="3" mt="5" justify="between">
          <Button onClick={handleReset} variant="soft" color="gray" size="2">
            <ResetIcon /> Reset to Defaults
          </Button>

          <Flex gap="2">
            <Button variant="soft" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </Flex>
        </Flex>

        <Dialog.Close>
          <button
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a1a1aa",
            }}
            aria-label="Close"
          >
            <Cross2Icon width="20" height="20" />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};
