import React, { useMemo, memo } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { ColorResult } from "../utils/colorEngine";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface GradientVisualizationProps {
  colors: ColorResult[];
  mode: "linear" | "animated";
  onModeChange: (mode: "linear" | "animated") => void;
}

/**
 * Linear Gradient Visualization
 * 172º angled gradient for checking color transitions
 */
export const LinearGradient = memo<{ colors: ColorResult[] }>(({ colors }) => {
  const gradientString = useMemo(
    () => colors.map((c) => c.cssP3).join(", "),
    [colors]
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "0.75rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        background: `linear-gradient(172deg, ${gradientString})`,
      }}
    />
  );
});

LinearGradient.displayName = "LinearGradient";

/**
 * Animated Gradient Visualization
 * CSS-animated diagonal gradient with smooth position transitions
 */
export const AnimatedGradient = memo<{
  colors: ColorResult[];
  animate: boolean;
}>(({ colors, animate }) => {
  const gradientString = useMemo(
    () => colors.map((c) => c.cssP3).join(", "),
    [colors]
  );

  const keyframesId = React.useId().replace(/:/g, "");

  return (
    <>
      <style>
        {`
            @keyframes BackgroundGradient${keyframesId} {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}
      </style>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "0.75rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          background: `linear-gradient(132deg, ${gradientString})`,
          backgroundSize: "400% 400%",
          animation: animate
            ? `BackgroundGradient${keyframesId} 15s ease infinite`
            : "none",
        }}
      />
    </>
  );
});

AnimatedGradient.displayName = "AnimatedGradient";

/**
 * Main Gradient Visualization Component
 * Toolbar with mode controls and visualization area
 */
export const GradientVisualization: React.FC<GradientVisualizationProps> = memo(
  ({ colors, mode, onModeChange }) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = !prefersReducedMotion;

    const modeLabels = {
      linear: "Linear",
      animated: "Animated",
    };

    return (
      <Box style={{ width: "100%" }}>
        {/* Toolbar */}
        <Flex
          align="center"
          justify="between"
          gap="3"
          style={{
            backgroundColor: "#18181b",
            borderRadius: "8px",
            padding: "10px 12px",
            border: "1px solid #3f3f46",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          {/* Info Section */}
          <Flex align="center" gap="2" style={{ flex: "1", minWidth: "200px" }}>
            <InfoCircledIcon
              style={{
                width: "16px",
                height: "16px",
                color: "#6366f1",
                flexShrink: 0,
              }}
            />
            <Text size="1" color="gray">
              <Text as="span" weight="medium" style={{ color: "#d4d4d8" }}>
                {colors.length} Colors
              </Text>{" "}
              • {modeLabels[mode]} gradient
            </Text>
          </Flex>

          {/* Mode Controls */}
          <Flex align="center" gap="2" style={{ flexWrap: "wrap" }}>
            {(["linear", "animated"] as const).map((m) => (
              <Button
                key={m}
                size="2"
                variant={mode === m ? "solid" : "soft"}
                onClick={() => onModeChange(m)}
              >
                {modeLabels[m]}
              </Button>
            ))}
          </Flex>
        </Flex>

        {/* Visualization Area */}
        <Box style={{ width: "100%", aspectRatio: "7/5", display: "flex" }}>
          {mode === "animated" && (
            <AnimatedGradient colors={colors} animate={shouldAnimate} />
          )}
          {mode === "linear" && <LinearGradient colors={colors} />}
        </Box>
      </Box>
    );
  }
);

GradientVisualization.displayName = "GradientVisualization";
