import React from "react";
import { Card, Flex, Text, Badge, Button } from "@radix-ui/themes";
import { CheckIcon } from "@radix-ui/react-icons";
import type { ColorResult } from "../utils/colorEngine";
import { evaluateSwatchContrast } from "../utils/contrastValidator";
import { useAppStore } from "../store/useAppStore";

interface SwatchProps {
  color: ColorResult;
  step: number;
}

export const Swatch: React.FC<SwatchProps> = ({ color, step }) => {
  const [copied, setCopied] = React.useState(false);
  const hasContrast = !!color.contrast;

  // Get global accessibility settings
  const accessibilitySettings = useAppStore(
    (state) => state.accessibilitySettings
  );

  // Progressive enhancement: evaluate threshold if enabled
  const thresholdResult = React.useMemo(() => {
    if (
      !accessibilitySettings.enabled ||
      !color.contrast ||
      !color.targetBackground
    )
      return null;

    // Convert global settings to ContrastThreshold format
    const threshold = {
      enabled: accessibilitySettings.enabled,
      minLc: accessibilitySettings.minLc,
      minWcag: accessibilitySettings.minWcag,
      useApca: accessibilitySettings.useApca,
    };

    return evaluateSwatchContrast(color, color.targetBackground, threshold);
  }, [accessibilitySettings, color]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Flex direction="column" gap="2">
      <Card
        style={{
          height: "5rem",
          width: "100%",
          backgroundColor: color.cssP3,
          position: "relative",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          cursor: "pointer",
        }}
        className="swatch-card"
      >
        <Badge
          size="2"
          style={{
            position: "absolute",
            top: "0.5rem",
            left: "0.5rem",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(8px)",
            color: "rgba(255, 255, 255, 0.95)",
            fontWeight: 600,
          }}
        >
          {step}
        </Badge>

        {/* Pass/Fail indicator */}
        {thresholdResult && (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: thresholdResult.passes
                ? "#22c55e"
                : "rgba(239, 68, 68, 0.8)",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
            }}
            title={
              thresholdResult.passes
                ? `Passes ${accessibilitySettings.useApca ? "APCA" : "WCAG"} (${
                    thresholdResult.delta > 0 ? "+" : ""
                  }${thresholdResult.delta.toFixed(1)})`
                : `Fails ${
                    accessibilitySettings.useApca ? "APCA" : "WCAG"
                  } (${thresholdResult.delta.toFixed(1)})`
            }
          />
        )}

        <Flex
          align="center"
          justify="center"
          gap="2"
          className="swatch-overlay"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(2px)",
            borderRadius: "0.75rem",
          }}
        >
          <Button
            size="2"
            variant="solid"
            color="gray"
            highContrast
            onClick={() => copyToClipboard(color.oklch)}
            title="Copy OKLCH"
            style={{ fontWeight: "bold" }}
          >
            OKLCH
          </Button>
          <Button
            size="2"
            variant="solid"
            onClick={() => copyToClipboard(color.hex)}
            title="Copy Hex"
            style={{ fontWeight: "bold" }}
          >
            HEX
          </Button>
        </Flex>
      </Card>

      <Flex direction="column" gap="2" px="1">
        <Flex justify="between" align="center">
          <Text
            size="2"
            style={{
              fontFamily: "monospace",
              color: "#d4d4d8",
              fontWeight: 500,
            }}
          >
            L{Math.round(color.L * 100)}
          </Text>
          <Text
            size="2"
            style={{
              fontFamily: "monospace",
              color: "#a1a1aa",
              fontWeight: 500,
            }}
          >
            C{color.C.toFixed(3)}
          </Text>
        </Flex>
        {hasContrast &&
          color.contrast &&
          (() => {
            // Use precise specific contrast if available, otherwise fall back to general contrast
            const apcaValue =
              color.specificContrast?.apca ?? color.contrast.apca.onWhite;
            const wcagValue =
              color.specificContrast?.wcag ?? color.contrast.wcag.onWhite;
            const bgLabel = color.targetBackground || "canvas-bg";

            // Format WCAG with rounding indicators
            const formatWCAG = (value: number): string => {
              const rounded1 = Number(value.toFixed(1));
              const rounded2 = Number(value.toFixed(2));
              const rounded3 = Number(value.toFixed(3));

              const roundedAt2 = rounded3 !== rounded2;
              const roundedAt1 = rounded2 !== rounded1;

              if (roundedAt2 && roundedAt1) {
                return `${rounded1.toFixed(1)}†:1`;
              } else if (roundedAt1) {
                return `${rounded1.toFixed(1)}*:1`;
              } else {
                return `${rounded1.toFixed(1)}:1`;
              }
            };

            return (
              <Flex justify="between" align="center">
                <Text
                  size="2"
                  style={{
                    fontFamily: "monospace",
                    color: "#d4d4d8",
                    fontWeight: 500,
                  }}
                  title={`APCA Lc vs ${bgLabel}`}
                >
                  Lc{apcaValue.toFixed(1)}
                </Text>
                <Text
                  size="2"
                  style={{
                    fontFamily: "monospace",
                    color: "#d4d4d8",
                    fontWeight: 500,
                  }}
                  title={`WCAG ${
                    color.contrast.meetsAA ? "AA Pass" : "Fails"
                  } (precise: ${wcagValue.toFixed(3)}:1)`}
                >
                  {formatWCAG(wcagValue)}
                </Text>
              </Flex>
            );
          })()}
        <Flex justify="between" align="center">
          <Text
            size="2"
            style={{
              fontFamily: "monospace",
              color: "#71717a",
              fontWeight: 500,
            }}
          >
            {color.hex}
          </Text>
          {copied && (
            <Flex align="center" gap="1">
              <CheckIcon width={14} height={14} color="#22c55e" />
              <Text size="2" weight="bold" color="green">
                Copied
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};
