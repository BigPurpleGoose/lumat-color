/**
 * MinimumOpacityCalculator Component
 *
 * Exposes the calculateMinimumOpacityAPCA utility function with interactive UI
 * Allows users to find the minimum opacity needed to meet a target APCA Lc value
 */

import React, { useState, useMemo } from "react";
import { Box, Flex, Text, Slider, Badge } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { calculateMinimumOpacityAPCA } from "../utils/opacityBlending";
import { ColorResult } from "../utils/colorEngine";

interface MinimumOpacityCalculatorProps {
  color: ColorResult;
  backgroundHex: string;
}

export const MinimumOpacityCalculator: React.FC<
  MinimumOpacityCalculatorProps
> = ({ color, backgroundHex }) => {
  const [targetLc, setTargetLc] = useState<number>(60);

  // Calculate minimum opacity required
  const result = useMemo(() => {
    const minOpacity = calculateMinimumOpacityAPCA(
      color.L,
      color.C,
      color.H,
      backgroundHex,
      targetLc,
      1.0 // tolerance
    );

    return {
      minOpacity,
      canMeetTarget: minOpacity !== null,
      percentage: minOpacity ? `${minOpacity}%` : "N/A",
    };
  }, [color, backgroundHex, targetLc]);

  // APCA guidelines for reference
  const getLcGuideline = (lc: number): string => {
    if (lc >= 90) return "Body Text (minimum)";
    if (lc >= 75) return "Large Text (minimum)";
    if (lc >= 60) return "Headlines & UI (recommended)";
    if (lc >= 45) return "Placeholder Text (minimum)";
    if (lc >= 30) return "Disabled/Decorative";
    return "Insufficient for text";
  };

  const getGuidelineColor = (lc: number): string => {
    if (lc >= 90) return "#22c55e"; // Green
    if (lc >= 75) return "#3b82f6"; // Blue
    if (lc >= 60) return "#f59e0b"; // Orange
    if (lc >= 45) return "#facc15"; // Yellow
    return "#71717a"; // Gray
  };

  return (
    <Box
      style={{
        backgroundColor: "#18181b",
        borderRadius: "8px",
        padding: "16px",
        border: "1px solid #3f3f46",
      }}
    >
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex align="center" justify="between">
          <Box>
            <Text size="3" weight="bold" mb="1">
              Minimum Opacity Calculator
            </Text>
            <Text size="2" color="gray">
              Find the minimum opacity required to meet a target APCA contrast
              level (Lc)
            </Text>
          </Box>
          <Badge
            size="2"
            color={result.canMeetTarget ? "green" : "red"}
            style={{ fontFamily: "monospace", fontSize: "14px" }}
          >
            {result.canMeetTarget ? result.percentage : "Cannot Meet Target"}
          </Badge>
        </Flex>

        {/* Info Box */}
        <Box
          style={{
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #3f3f46",
            backgroundColor: "#09090b",
          }}
        >
          <Flex gap="2" align="start">
            <InfoCircledIcon
              style={{
                width: "16px",
                height: "16px",
                color: "#6366f1",
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
            <Text size="1" color="gray" style={{ lineHeight: "1.5" }}>
              <strong>APCA (Accessible Perceptual Contrast Algorithm)</strong>{" "}
              is a modern contrast method that accounts for text size, weight,
              and polarity. Use this calculator to find the minimum opacity
              needed for your color to meet accessibility requirements when
              placed on the current background.
            </Text>
          </Flex>
        </Box>

        {/* Target Lc Slider */}
        <Flex direction="column" gap="2">
          <Flex align="center" justify="between">
            <Text size="2" weight="medium">
              Target APCA Lc Value
            </Text>
            <Flex align="center" gap="3">
              <Badge
                size="2"
                color={
                  getGuidelineColor(targetLc) === "#22c55e"
                    ? "green"
                    : getGuidelineColor(targetLc) === "#3b82f6"
                    ? "blue"
                    : getGuidelineColor(targetLc) === "#f59e0b"
                    ? "orange"
                    : getGuidelineColor(targetLc) === "#facc15"
                    ? "yellow"
                    : "gray"
                }
              >
                {getLcGuideline(targetLc)}
              </Badge>
              <Text
                size="3"
                weight="bold"
                style={{
                  fontFamily: "monospace",
                  minWidth: "60px",
                  textAlign: "right",
                  color: getGuidelineColor(targetLc),
                }}
              >
                Lc {targetLc}
              </Text>
            </Flex>
          </Flex>

          <Slider
            value={[targetLc]}
            onValueChange={(value) => setTargetLc(value[0])}
            min={30}
            max={106}
            step={1}
            style={{ flexGrow: 1 }}
          />

          <Flex justify="between">
            <Text size="1" color="gray">
              Lc 30 (Decorative)
            </Text>
            <Text size="1" color="gray">
              Lc 106 (Maximum)
            </Text>
          </Flex>
        </Flex>

        {/* Result Display */}
        <Box
          style={{
            padding: "16px",
            borderRadius: "8px",
            border: result.canMeetTarget
              ? "2px solid #22c55e"
              : "2px solid #ef4444",
            backgroundColor: result.canMeetTarget
              ? "rgba(34, 197, 94, 0.05)"
              : "rgba(239, 68, 68, 0.05)",
          }}
        >
          <Flex direction="column" gap="2" align="center">
            {result.canMeetTarget ? (
              <>
                <Text size="2" color="gray">
                  Minimum opacity required:
                </Text>
                <Text
                  size="8"
                  weight="bold"
                  style={{
                    fontFamily: "monospace",
                    color: "#22c55e",
                  }}
                >
                  {result.percentage}
                </Text>
                <Text size="1" color="gray" style={{ textAlign: "center" }}>
                  Using this color at <strong>{result.percentage}</strong>{" "}
                  opacity will meet or exceed the target APCA Lc value of{" "}
                  <strong>{targetLc}</strong>
                  on the current background.
                </Text>
              </>
            ) : (
              <>
                <Text size="2" style={{ color: "#ef4444" }}>
                  Cannot Meet Target
                </Text>
                <Text size="1" color="gray" style={{ textAlign: "center" }}>
                  This color cannot achieve the target APCA Lc value of{" "}
                  <strong>{targetLc}</strong> on the current background, even at
                  100% opacity. Consider using a color with higher contrast
                  (different lightness) or adjusting the target Lc value.
                </Text>
              </>
            )}
          </Flex>
        </Box>

        {/* APCA Guidelines Reference */}
        <Box
          style={{
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #3f3f46",
            backgroundColor: "#09090b",
          }}
        >
          <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
            APCA Lc Guidelines:
          </Text>
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Box
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              />
              <Text size="1" color="gray">
                <strong>Lc 90+</strong>: Body text (minimum 12-14px)
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <Box
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                }}
              />
              <Text size="1" color="gray">
                <strong>Lc 75+</strong>: Large text (minimum 18px or 14px bold)
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <Box
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                }}
              />
              <Text size="1" color="gray">
                <strong>Lc 60+</strong>: Headlines, UI elements (recommended)
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <Box
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#facc15",
                }}
              />
              <Text size="1" color="gray">
                <strong>Lc 45+</strong>: Placeholder text, disabled elements
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <Box
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#71717a",
                }}
              />
              <Text size="1" color="gray">
                <strong>Lc 30-44</strong>: Decorative elements only (not for
                text)
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};
