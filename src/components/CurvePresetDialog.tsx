import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Select,
  Dialog,
  Badge,
  ScrollArea,
} from "@radix-ui/themes";
import { MixIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import type { ColorScale } from "../types";
import {
  CURVE_PRESETS,
  PRESET_CATEGORIES,
  getPreset,
  recommendPreset,
  type CurvePreset,
} from "../utils/curvePresets";

interface CurvePresetDialogProps {
  scale: ColorScale;
  onApply: (hueCurve: any, chromaCurve: any) => void;
}

/**
 * Curve Preset Browser
 *
 * Provides instant access to 16 professionally-designed curve patterns
 */
export const CurvePresetDialog: React.FC<CurvePresetDialogProps> = ({
  scale,
  onApply,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("material-3");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const preset = getPreset(selectedPreset);
  const recommended = recommendPreset(
    scale.manualChroma || 0.25,
    scale.targetBackground || "white",
    scale.contrastMode || "standard"
  );

  const filteredPresets =
    selectedCategory === "all"
      ? Object.values(CURVE_PRESETS)
      : Object.values(CURVE_PRESETS).filter((p) => {
          const categoryPresets =
            PRESET_CATEGORIES[
              selectedCategory as keyof typeof PRESET_CATEGORIES
            ];
          return categoryPresets && categoryPresets.includes(p.name);
        });

  const handleApply = () => {
    if (preset) {
      onApply(preset.hueCurve, preset.chromaCurve);
      setOpen(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button size="2" variant="surface">
          <MixIcon />
          Curve Presets
        </Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="700px" style={{ maxHeight: "80vh" }}>
        <Dialog.Title>Curve Presets</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Apply professional curve patterns inspired by popular design systems
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {/* Category Filter */}
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: "70px" }}>
              Category:
            </Text>
            <Select.Root
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <Select.Trigger style={{ width: "200px" }} />
              <Select.Content>
                <Select.Item value="all">All Presets</Select.Item>
                {Object.keys(PRESET_CATEGORIES).map((catName) => (
                  <Select.Item key={catName} value={catName}>
                    {catName}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          {/* Preset Grid */}
          <ScrollArea style={{ maxHeight: "400px" }}>
            <Flex direction="column" gap="2">
              {filteredPresets.map((p) => (
                <Box
                  key={p.name}
                  p="3"
                  style={{
                    border: `2px solid ${
                      p.name === selectedPreset
                        ? "var(--accent-9)"
                        : "var(--gray-a6)"
                    }`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    background:
                      p.name === selectedPreset
                        ? "var(--accent-a2)"
                        : "transparent",
                  }}
                  onClick={() => setSelectedPreset(p.name)}
                >
                  <Flex justify="between" align="start" mb="2">
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="2">
                        <Text size="3" weight="bold">
                          {p.name}
                        </Text>
                        {p.name === recommended && (
                          <Badge color="green" size="1">
                            Recommended
                          </Badge>
                        )}
                      </Flex>
                      <Text size="2" color="gray">
                        {p.description}
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex direction="column" gap="1" mb="2">
                    <Text size="1" color="gray">
                      <strong>Best for:</strong> {p.bestFor.join(", ")}
                    </Text>
                    <Text size="1" color="gray">
                      <strong>Inspiration:</strong> {p.inspiration}
                    </Text>
                  </Flex>

                  {/* Curve Values */}
                  <Flex gap="4" mt="2">
                    <Box style={{ flex: 1 }}>
                      <Text size="1" weight="medium" color="gray">
                        Hue Curve
                      </Text>
                      <Text size="1" color="gray">
                        Shift: {p.hueCurve.shift.toFixed(2)}, Power:{" "}
                        {p.hueCurve.power.toFixed(2)}
                      </Text>
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text size="1" weight="medium" color="gray">
                        Chroma Curve
                      </Text>
                      <Text size="1" color="gray">
                        Shift: {p.chromaCurve.shift.toFixed(2)}, Power:{" "}
                        {p.chromaCurve.power.toFixed(2)}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Visualization */}
                  {p.visualization && (
                    <Box
                      mt="2"
                      p="2"
                      style={{
                        background: "var(--gray-a2)",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        fontSize: "10px",
                        lineHeight: "1.2",
                        whiteSpace: "pre",
                      }}
                    >
                      {p.visualization}
                    </Box>
                  )}
                </Box>
              ))}
            </Flex>
          </ScrollArea>

          {/* Info Box */}
          <Box
            p="3"
            style={{
              background: "var(--blue-a2)",
              border: "1px solid var(--blue-a6)",
              borderRadius: "6px",
            }}
          >
            <Flex align="start" gap="2">
              <InfoCircledIcon style={{ marginTop: "2px" }} />
              <Text size="1" color="gray">
                <strong>Tip:</strong> Presets provide instant access to
                professionally-tuned curves. You can fine-tune the values after
                applying using the curve controls.
              </Text>
            </Flex>
          </Box>

          {/* Actions */}
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleApply}>
              <MixIcon />
              Apply Preset
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
