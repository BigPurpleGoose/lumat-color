import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Select,
  Dialog,
  Badge,
  Callout,
} from "@radix-ui/themes";
import { MagicWandIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import type { ColorScale } from "../types";
import {
  APCA_AUTO_FIX_PRESETS,
  recommendAPCAPreset,
} from "../utils/apcaAutoFix";

interface APCAAutoFixDialogProps {
  scale: ColorScale;
  onApply: (updatedScale: Partial<ColorScale>) => void;
}

/**
 * APCA Auto-Fix Dialog
 *
 * Provides one-click accessibility compliance with intelligent preset selection
 */
export const APCAAutoFixDialog: React.FC<APCAAutoFixDialogProps> = ({
  scale,
  onApply,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] =
    useState<string>("body-text-white");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAutoFix = async () => {
    setIsProcessing(true);

    try {
      // Get preset function
      const presetFn =
        APCA_AUTO_FIX_PRESETS[
          selectedPreset as keyof typeof APCA_AUTO_FIX_PRESETS
        ];
      if (!presetFn) {
        console.error("Invalid preset:", selectedPreset);
        return;
      }

      // Apply auto-fix with lightness steps
      const steps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 98]; // Default steps
      const result = await presetFn(scale, steps);

      if (result.success) {
        onApply(result.scale);
        setOpen(false);
      } else {
        console.error("Auto-fix failed:", result.metrics);
      }
    } catch (error) {
      console.error("Auto-fix error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRecommendedPreset = () => {
    return recommendAPCAPreset(scale, scale.targetBackground || "#FFFFFF");
  };

  const presetInfo = {
    "body-text-white": {
      description: "Body text (APCA Lc 75) on white backgrounds",
      target: "Lc 75 minimum",
    },
    "body-text-black": {
      description: "Body text (APCA Lc 75) on black backgrounds",
      target: "Lc 75 minimum",
    },
    "large-text-white": {
      description: "Large headings (APCA Lc 60) on white backgrounds",
      target: "Lc 60 minimum",
    },
    "ui-white": {
      description: "UI elements (APCA Lc 60) on white backgrounds",
      target: "Lc 60 minimum",
    },
    universal: {
      description: "Works on both light and dark backgrounds",
      target: "Lc 60/75 multi-target",
    },
    "strict-body": {
      description: "Maximum accessibility (APCA Lc 90)",
      target: "Lc 90 minimum",
    },
  };

  const recommended = getRecommendedPreset();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button size="2" variant="surface">
          <MagicWandIcon />
          APCA Auto-Fix
        </Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="500px">
        <Dialog.Title>APCA Accessibility Auto-Fix</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Automatically adjust lightness values to meet APCA contrast targets
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {/* Preset Selection */}
          <Box>
            <Text size="2" weight="medium" mb="2">
              Select Preset
            </Text>
            <Select.Root
              value={selectedPreset}
              onValueChange={setSelectedPreset}
            >
              <Select.Trigger style={{ width: "100%" }} />
              <Select.Content>
                {Object.entries(presetInfo).map(([key, info]) => (
                  <Select.Item key={key} value={key}>
                    <Flex
                      justify="between"
                      align="center"
                      gap="2"
                      style={{ width: "100%" }}
                    >
                      <Text>
                        {key
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                      {key === recommended && (
                        <Badge color="green" size="1">
                          Recommended
                        </Badge>
                      )}
                    </Flex>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Preset Info */}
          {selectedPreset && (
            <Callout.Root color="blue" size="1">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                <strong>
                  {
                    presetInfo[selectedPreset as keyof typeof presetInfo]
                      ?.description
                  }
                </strong>
                <br />
                Target:{" "}
                {presetInfo[selectedPreset as keyof typeof presetInfo]?.target}
              </Callout.Text>
            </Callout.Root>
          )}

          {/* How it Works */}
          <Box
            p="3"
            style={{
              background: "var(--gray-a2)",
              border: "1px solid var(--gray-a6)",
              borderRadius: "6px",
            }}
          >
            <Text size="2" weight="medium" mb="2">
              How it Works
            </Text>
            <Text size="1" color="gray">
              • Uses binary search to find optimal lightness values
              <br />
              • Meets APCA Lc targets (60, 75, or 90)
              <br />
              • Preserves endpoints and curve characteristics
              <br />
              • Adjusts chroma if needed (max 15% reduction)
              <br />• Completes in ~30 iterations per step
            </Text>
          </Box>

          {/* Actions */}
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleAutoFix} disabled={isProcessing}>
              <MagicWandIcon />
              {isProcessing ? "Processing..." : "Apply Auto-Fix"}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
