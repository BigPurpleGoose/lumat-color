/**
 * AnalysisView Component
 *
 * Displays color ramp analysis with:
 * - Visual pills showing target vs actual colors
 * - Delta analysis comparing intended vs actual lightness
 * - Comprehensive contrast data
 * - Gamut mapping feedback
 */

import React, { useMemo, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Card,
  Table,
  Badge,
  ScrollArea,
} from "@radix-ui/themes";
import { CopyIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { ColorScale } from "../types";
import { useAppStore } from "../store/useAppStore";
import { generateColor } from "../utils/colorEngine";
import {
  blendOKLCHOnBackground,
  getLuminance,
  hexToSRGB,
} from "../utils/opacityBlending";
import {
  compareColors,
  analyzeScaleAccuracy,
  formatDelta,
} from "../utils/deltaAnalysis";
import { getContrast, getAPCA } from "../utils/contrast";
import { MinimumOpacityCalculator } from "./MinimumOpacityCalculator";

interface AnalysisViewProps {
  scale: ColorScale;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ scale }) => {
  const { selectedBackground, getLightnessSteps, globalSettings } =
    useAppStore();
  const [copied, setCopied] = useState(false);
  const [selectedOpacityRefIndex, setSelectedOpacityRefIndex] =
    useState<number>(8);
  const [selectedMinOpacityIndex, setSelectedMinOpacityIndex] =
    useState<number>(8);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  const lightnessSteps = scale ? getLightnessSteps(scale) : [];
  const opacitySteps = globalSettings.opacitySteps || [];
  const bgLuminance = getLuminance(hexToSRGB(selectedBackground));

  // Generate colors using the scale's curves
  const generatedColors = useMemo(() => {
    if (!scale) return [];
    return lightnessSteps.map((lightnessStep) => {
      const lNormalized = lightnessStep / 100;
      return generateColor(
        lNormalized,
        scale.manualChroma,
        scale.hue,
        scale.hueCurve,
        scale.chromaCurve,
        {
          contrastMode: scale.contrastMode || "standard",
          calculateContrast: true,
          targetBackground: scale.targetBackground || "white",
          targetLc: scale.apcaTargetLc,
          targetWcagRatio: scale.wcagTargetRatio,
          chromaCompensation: scale.chromaCompensation ?? true,
        }
      );
    });
  }, [scale, lightnessSteps]);

  // Analyze each step: intended vs actual
  const colorAnalysis = useMemo(() => {
    if (!scale || generatedColors.length === 0) return [];
    return lightnessSteps
      .map((targetL, idx) => {
        const actual = generatedColors[idx];
        if (!actual) {
          return null;
        }
        // "Intended" is now the color with curves applied (what user expects)
        const intended = {
          l: targetL,
          c: actual.C, // Use the generated chroma with curves
          h: actual.H, // Use the generated hue with curves
        };
        const actualConverted = {
          l: actual.L * 100,
          c: actual.C,
          h: actual.H,
        };

        const comparison = compareColors(intended, actualConverted);

        const blendResult = blendOKLCHOnBackground(
          actual.L * 100,
          actual.C || 0,
          actual.H || 0,
          100,
          selectedBackground,
          globalSettings.blendMode || "srgb"
        );

        return {
          targetL,
          comparison,
          actual,
          blendResult,
          wcagContrast: getContrast(blendResult.luminance, bgLuminance),
          apcaContrast: getAPCA(blendResult.luminance, bgLuminance),
          gamutInfo: actual.gamutInfo,
        };
      })
      .filter(Boolean);
  }, [
    generatedColors,
    lightnessSteps,
    scale,
    selectedBackground,
    bgLuminance,
    globalSettings,
  ]);

  // Opacity demonstration: one reference color at all opacity levels
  const opacityDemonstration = useMemo(() => {
    if (generatedColors.length === 0) return [];

    const safeIndex = Math.min(
      selectedOpacityRefIndex,
      generatedColors.length - 1
    );
    const refColor = generatedColors[safeIndex];
    if (!refColor) return [];

    return opacitySteps.map((opacity) => {
      const blendResult = blendOKLCHOnBackground(
        refColor.L * 100,
        refColor.C || 0,
        refColor.H || 0,
        opacity,
        selectedBackground,
        globalSettings.blendMode || "srgb"
      );

      return {
        opacity,
        refColor,
        blendResult,
        wcagContrast: getContrast(blendResult.luminance, bgLuminance),
        apcaContrast: getAPCA(blendResult.luminance, bgLuminance),
      };
    });
  }, [
    generatedColors,
    selectedOpacityRefIndex,
    opacitySteps,
    selectedBackground,
    bgLuminance,
    globalSettings,
  ]);

  // Overall accuracy metrics
  const scaleAccuracy = useMemo(() => {
    if (colorAnalysis.length === 0) {
      return {
        averageDeltaE: 0,
        maxDeltaE: {
          intended: { l: 0, c: 0, h: 0 },
          actual: { l: 0, c: 0, h: 0 },
          delta: {
            deltaL: 0,
            deltaC: 0,
            deltaH: 0,
            deltaE: 0,
            percentError: 0,
          },
        },
        averageLightnessDelta: 0,
        maxLightnessDelta: {
          intended: { l: 0, c: 0, h: 0 },
          actual: { l: 0, c: 0, h: 0 },
          delta: {
            deltaL: 0,
            deltaC: 0,
            deltaH: 0,
            deltaE: 0,
            percentError: 0,
          },
        },
        overallQuality: "excellent" as const,
      };
    }
    return analyzeScaleAccuracy(colorAnalysis.map((a) => a!.comparison));
  }, [colorAnalysis]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Early return if no data
  if (!scale || generatedColors.length === 0) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{ height: "100%", padding: "20px" }}
      >
        <Text color="gray">No scale data available</Text>
      </Flex>
    );
  }

  return (
    <ScrollArea style={{ flex: 1 }}>
      <Flex direction="column" gap="4" p="4" style={{ paddingBottom: "80px" }}>
        {/* Info Banner */}
        <Box
          style={{
            backgroundColor: "#18181b",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid #3f3f46",
          }}
        >
          <Flex align="start" gap="3">
            <InfoCircledIcon
              style={{
                width: "20px",
                height: "20px",
                color: "#6366f1",
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
            <Flex direction="column" gap="1" style={{ flex: 1 }}>
              <Text size="2" weight="bold">
                Color Accuracy Analysis
              </Text>
              <Text size="2" color="gray">
                This view shows how accurately the color generation matches your
                intended lightness values, accounting for P3 gamut mapping and
                contrast modes.
              </Text>
            </Flex>
          </Flex>
        </Box>

        {/* Accuracy Summary */}
        <Flex gap="3" wrap="wrap">
          <Card
            style={{
              flex: "1",
              minWidth: "150px",
              backgroundColor: "#18181b",
              padding: "16px",
              border: "1px solid #3f3f46",
            }}
          >
            <Text size="1" color="gray" mb="1">
              Average Delta L*
            </Text>
            <Text size="6" weight="bold" style={{ color: "#6366f1" }}>
              {scaleAccuracy.averageLightnessDelta.toFixed(2)}
            </Text>
          </Card>
          <Card
            style={{
              flex: "1",
              minWidth: "150px",
              backgroundColor: "#18181b",
              padding: "16px",
              border: "1px solid #3f3f46",
            }}
          >
            <Text size="1" color="gray" mb="1">
              Average Delta E*
            </Text>
            <Text size="6" weight="bold" style={{ color: "#22c55e" }}>
              {scaleAccuracy.averageDeltaE.toFixed(2)}
            </Text>
          </Card>
          <Card
            style={{
              flex: "1",
              minWidth: "150px",
              backgroundColor: "#18181b",
              padding: "16px",
              border: "1px solid #3f3f46",
            }}
          >
            <Text size="1" color="gray" mb="1">
              Max Delta E*
            </Text>
            <Text size="6" weight="bold" style={{ color: "#f97316" }}>
              {scaleAccuracy.maxDeltaE.delta.deltaE.toFixed(2)}
            </Text>
          </Card>
        </Flex>

        {/* Color Pills Preview - Split Design */}
        <Box>
          <Text size="2" weight="bold" mb="3">
            Color Ramp (Intended vs Actual)
          </Text>
          <Text size="1" color="gray" mb="3">
            Top half shows intended color, bottom half shows actual after gamut
            mapping. Hover to highlight corresponding table row.
          </Text>
          <Flex gap="3" wrap="wrap">
            {colorAnalysis
              .filter((a): a is NonNullable<typeof a> => a !== null)
              .map((analysis, idx) => {
                const intendedCSS = `oklch(${analysis.comparison.intended.l}% ${analysis.comparison.intended.c} ${analysis.comparison.intended.h})`;
                const actualCSS = `oklch(${analysis.actual.L * 100}% ${
                  analysis.actual.C
                } ${analysis.actual.H})`;
                const deltaL = analysis.comparison.delta.deltaL;
                const deltaE = analysis.comparison.delta.deltaE;
                const isGood = Math.abs(deltaL) < 2.5;

                return (
                  <Flex
                    key={idx}
                    direction="column"
                    align="center"
                    gap="2"
                    onMouseEnter={() => setHighlightedRow(idx)}
                    onMouseLeave={() => setHighlightedRow(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <Text
                      size="1"
                      style={{
                        fontFamily: "monospace",
                        color: "#a1a1aa",
                        fontSize: "10px",
                      }}
                    >
                      #{idx + 1} · L{analysis.targetL}
                    </Text>

                    <Box
                      style={{
                        width: "64px",
                        height: "160px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                        border: `2px solid ${
                          highlightedRow === idx
                            ? "#6366f1"
                            : "rgba(255, 255, 255, 0.1)"
                        }`,
                        transition: "transform 0.2s, border-color 0.2s",
                        transform:
                          highlightedRow === idx ? "translateY(-4px)" : "none",
                      }}
                      onClick={() => copyToClipboard(analysis.blendResult.hex)}
                      title={`Click to copy\nTarget: L${
                        analysis.targetL
                      }\nActual: L${(analysis.actual.L * 100).toFixed(
                        1
                      )}\nΔL: ${formatDelta(deltaL)}\nΔE: ${formatDelta(
                        deltaE
                      )}`}
                    >
                      {/* Top half - Intended */}
                      <Box style={{ flex: 1, backgroundColor: intendedCSS }} />

                      {/* Bottom half - Actual */}
                      <Box style={{ flex: 1, backgroundColor: actualCSS }} />

                      {/* Divider line */}
                      <Box
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          right: 0,
                          height: "2px",
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          transform: "translateY(-1px)",
                        }}
                      />

                      {/* Delta badge */}
                      <Box
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: isGood
                            ? "rgba(34, 197, 94, 0.9)"
                            : "rgba(250, 204, 21, 0.9)",
                          color: isGood ? "#fff" : "#000",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          fontFamily: "monospace",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        ΔL {formatDelta(deltaL)}
                      </Box>
                    </Box>

                    <Flex direction="column" align="center" gap="0">
                      <Text
                        size="1"
                        style={{
                          fontFamily: "monospace",
                          color: "#71717a",
                          fontSize: "9px",
                        }}
                      >
                        Actual L{(analysis.actual.L * 100).toFixed(1)}
                      </Text>
                      <Text
                        size="1"
                        weight="bold"
                        style={{
                          fontFamily: "monospace",
                          color:
                            deltaE < 1
                              ? "#22c55e"
                              : deltaE < 2
                              ? "#60a5fa"
                              : deltaE < 5
                              ? "#facc15"
                              : "#f87171",
                          fontSize: "9px",
                        }}
                      >
                        ΔE {formatDelta(deltaE)}
                      </Text>
                    </Flex>
                  </Flex>
                );
              })}
          </Flex>
        </Box>

        {/* Opacity Blending Demonstration */}
        <Box
          style={{
            backgroundColor: "#18181b",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid #3f3f46",
          }}
        >
          <Flex direction="column" gap="3">
            <Flex align="center" justify="between">
              <Box>
                <Text size="3" weight="bold" mb="1">
                  Opacity Blending Demonstration
                </Text>
                <Text size="2" color="gray">
                  See how opacity affects the final blended color against the
                  current background. Colors are blended in linear RGB space for
                  perceptually accurate results. The resulting L* values are NOT
                  simple weighted averages due to non-linear gamma curves - this
                  is correct behavior.
                </Text>
                <Text
                  size="1"
                  mt="2"
                  style={{ color: "#facc15", lineHeight: "1.6" }}
                >
                  ⚠️ Low opacity values (≤20%) produce colors very close to the
                  background, resulting in minimal contrast. Use higher opacity
                  (≥40%) for accessible text/UI elements.
                </Text>
              </Box>
              <Flex align="center" gap="2">
                <Text size="1" color="gray">
                  Reference:
                </Text>
                <select
                  value={selectedOpacityRefIndex}
                  onChange={(e) =>
                    setSelectedOpacityRefIndex(Number(e.target.value))
                  }
                  style={{
                    backgroundColor: "#27272a",
                    color: "#a1a1aa",
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    border: "1px solid #3f3f46",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {lightnessSteps.map((step, idx) => (
                    <option key={idx} value={idx}>
                      #{idx + 1}: L{step} ({generatedColors[idx]?.hex || ""})
                    </option>
                  ))}
                </select>
              </Flex>
            </Flex>

            {/* Opacity Pills */}
            <Flex gap="2" wrap="wrap">
              {opacityDemonstration.map((item, idx) => {
                const passes =
                  item.opacity >= 40 &&
                  (item.wcagContrast >= 4.5 ||
                    Math.abs(item.apcaContrast) >= 60);
                return (
                  <Flex
                    key={idx}
                    direction="column"
                    align="center"
                    gap="1"
                    style={{ minWidth: "80px" }}
                  >
                    <Text
                      size="1"
                      style={{ fontFamily: "monospace", color: "#71717a" }}
                    >
                      {item.opacity}%
                    </Text>
                    <Box
                      style={{
                        width: "60px",
                        height: "100px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: `2px solid ${passes ? "#22c55e" : "#71717a"}`,
                        cursor: "pointer",
                      }}
                      onClick={() => copyToClipboard(item.blendResult.hex)}
                      title={`${item.opacity}% opacity\n${
                        item.blendResult.hex
                      }\nWCAG: ${item.wcagContrast.toFixed(
                        1
                      )}:1\nAPCA: Lc ${Math.abs(item.apcaContrast).toFixed(0)}`}
                    >
                      {/* Top half: solid reference */}
                      <Box
                        style={{
                          height: "50%",
                          backgroundColor: item.refColor.hex,
                        }}
                      />
                      {/* Bottom half: blended at opacity */}
                      <Box
                        style={{
                          height: "50%",
                          backgroundColor: item.blendResult.hex,
                        }}
                      />
                    </Box>
                    <Text
                      size="1"
                      style={{
                        fontFamily: "monospace",
                        fontSize: "9px",
                        color: passes ? "#22c55e" : "#71717a",
                      }}
                    >
                      L{item.blendResult.lightness.toFixed(0)}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>

            {/* Opacity Data Table */}
            <Box
              style={{
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #3f3f46",
                backgroundColor: "#09090b",
              }}
            >
              <Box
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #3f3f46",
                  backgroundColor: "#18181b",
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
                    <strong>Opacity Blending:</strong> Values are calculated
                    using linear RGB alpha compositing (industry standard). L*
                    values don't blend linearly—this is correct due to gamma
                    correction in the sRGB → Y → L* conversion. Contrast ratios
                    show if the semi-transparent element meets accessibility
                    requirements on this background.
                  </Text>
                </Flex>
              </Box>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Opacity</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Blended L*</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Hex</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>WCAG</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>APCA</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {opacityDemonstration.map((item, idx) => (
                    <Table.Row key={idx}>
                      <Table.Cell>
                        <Text
                          style={{
                            fontFamily: "monospace",
                            fontWeight: "bold",
                          }}
                        >
                          {item.opacity}%
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text style={{ fontFamily: "monospace" }}>
                          {item.blendResult.lightness.toFixed(1)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex align="center" gap="2">
                          <Box
                            style={{
                              width: "20px",
                              height: "20px",
                              backgroundColor: item.blendResult.hex,
                              borderRadius: "4px",
                              border: "1px solid #3f3f46",
                            }}
                          />
                          <Text
                            style={{
                              fontFamily: "monospace",
                              fontSize: "11px",
                            }}
                          >
                            {item.blendResult.hex}
                          </Text>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <Text
                          style={{
                            fontFamily: "monospace",
                            fontSize: "11px",
                            color:
                              item.wcagContrast >= 7
                                ? "#22c55e"
                                : item.wcagContrast >= 4.5
                                ? "#facc15"
                                : "#71717a",
                          }}
                        >
                          {item.wcagContrast.toFixed(1)}:1
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text
                          style={{
                            fontFamily: "monospace",
                            fontSize: "11px",
                            color:
                              Math.abs(item.apcaContrast) >= 75
                                ? "#22c55e"
                                : Math.abs(item.apcaContrast) >= 60
                                ? "#facc15"
                                : "#71717a",
                          }}
                        >
                          Lc {Math.abs(item.apcaContrast).toFixed(0)}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Flex>
        </Box>

        {/* Minimum Opacity Calculator */}
        <MinimumOpacityCalculator
          color={generatedColors[selectedMinOpacityIndex]}
          backgroundHex={selectedBackground}
        />

        {/* Detailed Analysis Table */}
        <Box>
          <Text size="2" weight="bold" mb="3">
            Detailed Analysis
          </Text>
          <Box
            style={{
              backgroundColor: "#18181b",
              borderRadius: "8px",
              border: "1px solid #3f3f46",
              overflow: "hidden",
            }}
          >
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Step</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Target L*</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actual L*</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>ΔL*</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>ΔC*</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>ΔE*</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Quality</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>WCAG</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>APCA</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Gamut</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {colorAnalysis
                  .filter((a): a is NonNullable<typeof a> => a !== null)
                  .map((analysis, idx) => {
                    const deltaE = analysis.comparison.delta.deltaE;
                    const quality =
                      deltaE < 1
                        ? "Excellent"
                        : deltaE < 2
                        ? "Good"
                        : deltaE < 5
                        ? "Fair"
                        : "Poor";
                    const qualityColor =
                      deltaE < 1
                        ? "#22c55e"
                        : deltaE < 2
                        ? "#60a5fa"
                        : deltaE < 5
                        ? "#facc15"
                        : "#f87171";

                    return (
                      <Table.Row
                        key={idx}
                        style={{
                          backgroundColor:
                            highlightedRow === idx
                              ? "rgba(99, 102, 241, 0.1)"
                              : "transparent",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={() => setHighlightedRow(idx)}
                        onMouseLeave={() => setHighlightedRow(null)}
                      >
                        <Table.Cell>
                          <Badge color="indigo">{idx + 1}</Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text style={{ fontFamily: "monospace" }}>
                            {analysis.targetL}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text style={{ fontFamily: "monospace" }}>
                            {(analysis.actual.L * 100).toFixed(1)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            style={{
                              fontFamily: "monospace",
                              color:
                                Math.abs(analysis.comparison.delta.deltaL) > 2
                                  ? "#f97316"
                                  : "#22c55e",
                            }}
                          >
                            {formatDelta(analysis.comparison.delta.deltaL)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            style={{
                              fontFamily: "monospace",
                              fontSize: "11px",
                            }}
                          >
                            {formatDelta(analysis.comparison.delta.deltaC)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            style={{
                              fontFamily: "monospace",
                              color:
                                analysis.comparison.delta.deltaE > 5
                                  ? "#f97316"
                                  : analysis.comparison.delta.deltaE > 2
                                  ? "#facc15"
                                  : "#22c55e",
                            }}
                          >
                            {formatDelta(analysis.comparison.delta.deltaE)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            style={{
                              backgroundColor: qualityColor,
                              color: "white",
                              fontWeight: "500",
                            }}
                          >
                            {quality}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            style={{
                              fontFamily: "monospace",
                              fontSize: "11px",
                            }}
                          >
                            {analysis.wcagContrast.toFixed(1)}:1
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            style={{
                              fontFamily: "monospace",
                              fontSize: "11px",
                            }}
                          >
                            Lc {Math.abs(analysis.apcaContrast).toFixed(0)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          {analysis.gamutInfo?.wasModified ? (
                            <Flex direction="column" gap="1">
                              <Badge color="orange" variant="soft">
                                Modified
                              </Badge>
                              {analysis.gamutInfo.chromaReduction > 0 && (
                                <Text size="1" style={{ color: "#94a3b8" }}>
                                  C↓{" "}
                                  {analysis.gamutInfo.chromaReduction.toFixed(
                                    1
                                  )}
                                  %
                                </Text>
                              )}
                              {analysis.gamutInfo.lightnessShift !== 0 && (
                                <Text size="1" style={{ color: "#94a3b8" }}>
                                  L
                                  {analysis.gamutInfo.lightnessShift > 0
                                    ? "↑"
                                    : "↓"}{" "}
                                  {Math.abs(
                                    analysis.gamutInfo.lightnessShift
                                  ).toFixed(1)}
                                </Text>
                              )}
                            </Flex>
                          ) : (
                            <Badge color="green" variant="soft">
                              In Gamut
                            </Badge>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>

        {/* Legend */}
        <Box
          style={{
            backgroundColor: "#18181b",
            borderRadius: "8px",
            padding: "12px",
            border: "1px solid #3f3f46",
          }}
        >
          <Text size="1" weight="bold" mb="2" style={{ color: "#a1a1aa" }}>
            Understanding Delta Values:
          </Text>
          <Flex direction="column" gap="1">
            <Text size="1" color="gray">
              • <strong>ΔL*</strong>: Lightness difference (target vs actual)
            </Text>
            <Text size="1" color="gray">
              • <strong>ΔC*</strong>: Chroma difference (may change due to gamut
              mapping)
            </Text>
            <Text size="1" color="gray">
              • <strong>ΔE*</strong>: Overall perceptual difference (ΔE &lt; 1
              is imperceptible)
            </Text>
            <Text size="1" color="gray">
              • <strong>Gamut Clipping</strong>: Colors adjusted to fit P3
              display gamut
            </Text>
          </Flex>
        </Box>

        {/* Copied Notification */}
        {copied && (
          <Box
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              backgroundColor: "#22c55e",
              color: "white",
              padding: "12px 16px",
              borderRadius: "8px",
              fontWeight: "500",
              zIndex: 100,
            }}
          >
            <Flex align="center" gap="2">
              <CopyIcon />
              Copied to clipboard!
            </Flex>
          </Box>
        )}
      </Flex>
    </ScrollArea>
  );
};
