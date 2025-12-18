/**
 * MatrixView Component
 *
 * Displays the lightness-opacity matrix grid showing all combinations
 * of lightness and opacity values for a color scale.
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { Box, Flex, Text, Button, Card, Popover } from "@radix-ui/themes";
import {
  InfoCircledIcon,
  EnterFullScreenIcon,
  ExitFullScreenIcon,
  GearIcon,
} from "@radix-ui/react-icons";
import { MatrixCell } from "./MatrixCell";
import { ColorScale } from "../types";
import { useAppStore } from "../store/useAppStore";
import { getLuminance, hexToSRGB } from "../utils/opacityBlending";
import { generateColor } from "../utils/colorEngine";
import {
  generateContrastMatrix,
  filterContrastPairs,
  ContrastFilterOptions,
} from "../utils/documentationExport";

interface TooltipState {
  visible: boolean;
  content: React.ReactNode;
  position: { x: number; y: number };
}

interface MatrixViewProps {
  scale: ColorScale;
}

export const MatrixView: React.FC<MatrixViewProps> = ({ scale }) => {
  const {
    globalSettings,
    selectedBackground,
    getLightnessSteps,
    accessibilitySettings,
  } = useAppStore();
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    content: null,
    position: { x: 0, y: 0 },
  });
  const [isMatching, setIsMatching] = useState(false);
  const [targetLightness, setTargetLightness] = useState(60);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showContrastInsights, setShowContrastInsights] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 0.5x to 2x
  const [cellSize, setCellSize] = useState(56); // Dynamic cell size
  const containerRef = useRef<HTMLDivElement>(null);

  // Get lightness and opacity steps
  const lightnessSteps = getLightnessSteps(scale);
  const opacitySteps = globalSettings.opacitySteps;
  const blendMode = globalSettings.blendMode || "srgb";

  // Calculate background luminance
  const bgLuminance = getLuminance(hexToSRGB(selectedBackground));

  // Generate colors for contrast matrix analysis
  const generatedColors = useMemo(() => {
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
          targetBackground: scale.targetBackground || "black",
          targetLc: scale.apcaTargetLc,
          targetWcagRatio: scale.wcagTargetRatio,
          chromaCompensation: scale.chromaCompensation ?? true,
        }
      );
    });
  }, [scale, lightnessSteps]);

  // Generate contrast matrix for documentation
  const contrastMatrix = useMemo(() => {
    return generateContrastMatrix(generatedColors);
  }, [generatedColors]);

  // Filter contrast pairs based on current threshold settings
  // Respect global accessibility toggle - if disabled, show all cells
  const filteredPairs = useMemo(() => {
    // If global indicators are off, don't filter - show all cells
    if (!accessibilitySettings.enabled) return contrastMatrix;

    // If per-scale filtering is disabled, show all
    if (!scale.contrastThreshold?.enabled) return contrastMatrix;

    const filterOptions: ContrastFilterOptions = {
      minAPCA: scale.contrastThreshold.useApca
        ? scale.contrastThreshold.minLc
        : undefined,
      minWCAG: !scale.contrastThreshold.useApca
        ? scale.contrastThreshold.minWcag
        : undefined,
      useAPCA: scale.contrastThreshold.useApca ?? true,
    };

    return filterContrastPairs(contrastMatrix, filterOptions);
  }, [contrastMatrix, scale.contrastThreshold, accessibilitySettings.enabled]);

  // Memoized handlers for performance
  const handleCellHover = useCallback(
    (data: { x: number; y: number; content: React.ReactNode }) => {
      setTooltipState({
        visible: true,
        content: data.content,
        position: { x: data.x, y: data.y },
      });
    },
    []
  );

  const handleCellLeave = useCallback(() => {
    setTooltipState({
      visible: false,
      content: null,
      position: { x: 0, y: 0 },
    });
  }, []);

  // Calculate statistics
  const contrastStats = useMemo(() => {
    const total = contrastMatrix.length;
    const passing = filteredPairs.length;
    const apcaHighContrast = contrastMatrix.filter((p) => p.apca >= 75).length;
    const wcagAAA = contrastMatrix.filter((p) => p.wcagLevel === "AAA").length;

    return {
      total,
      passing,
      passingPercent: ((passing / total) * 100).toFixed(1),
      apcaHighContrast,
      wcagAAA,
    };
  }, [contrastMatrix, filteredPairs]);

  // Copy to clipboard handler
  const copyToClipboard = useCallback((css: string) => {
    navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Zoom control handlers
  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const contrastFilterEnabled =
    accessibilitySettings.enabled &&
    (scale.contrastThreshold?.enabled || false);
  const contrastFilterType = scale.contrastThreshold?.useApca ? "apca" : "wcag";
  const contrastFilterThreshold =
    contrastFilterType === "apca"
      ? scale.contrastThreshold?.minLc || 60
      : scale.contrastThreshold?.minWcag || 4.5;

  // Calculate dynamic cell size based on container dimensions
  useEffect(() => {
    const calculateCellSize = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Account for padding, gaps, and label column
      const padding = 32; // 16px on each side
      const gap = 4;

      const numColumns = opacitySteps.length;
      const numRows = lightnessSteps.length;

      // Calculate available space (adjusted for better space utilization)
      // Note: labelColumnWidth will equal cellSize, so we calculate based on (numColumns + 1)
      const availableWidth = containerWidth - padding - gap * (numColumns + 2); // +2 for label column and extra gap
      const availableHeight =
        containerHeight - padding - 60 - gap * (numRows + 1); // Reduced reserved space

      // Calculate cell size based on both dimensions (including label column in calculation)
      const cellWidthFromWidth = Math.floor(availableWidth / (numColumns + 1));
      const cellHeightFromHeight = Math.floor(availableHeight / numRows);

      // Use the smaller dimension to ensure cells fit, with adjusted min/max constraints
      const calculatedSize = Math.max(
        40,
        Math.min(cellWidthFromWidth, cellHeightFromHeight, 120)
      );

      setCellSize(calculatedSize);
    };

    calculateCellSize();

    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(calculateCellSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [
    opacitySteps.length,
    lightnessSteps.length,
    isFullscreen,
    showContrastInsights,
  ]);

  return (
    <Box
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        ...(isFullscreen
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 50,
              backgroundColor: "#09090b",
            }
          : {}),
      }}
    >
      <Flex
        direction="column"
        gap="4"
        p="4"
        style={{
          flex: 1,
          minHeight: 0,
          maxWidth: "100%",
          overflowY: "auto",
          paddingBottom: "80px",
        }}
      >
        {/* Combined Toolbar */}
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
                {scale.name}
              </Text>{" "}
              at opacity levels on {selectedBackground}
            </Text>
          </Flex>

          {/* Essential Controls */}
          <Flex align="center" gap="3" style={{ flexWrap: "wrap" }}>
            <Flex align="center" gap="2">
              <input
                type="checkbox"
                id="match-mode"
                checked={isMatching}
                onChange={(e) => setIsMatching(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
              <Text
                as="label"
                htmlFor="match-mode"
                size="1"
                weight="medium"
                style={{ cursor: "pointer", color: "#d4d4d8" }}
              >
                Match
              </Text>
            </Flex>

            {isMatching && (
              <Flex align="center" gap="2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={targetLightness}
                  onChange={(e) => setTargetLightness(Number(e.target.value))}
                  style={{ width: "96px" }}
                />
                <Text
                  size="1"
                  weight="medium"
                  style={{
                    fontFamily: "monospace",
                    width: "32px",
                    color: "#d4d4d8",
                  }}
                >
                  L{targetLightness}
                </Text>
              </Flex>
            )}

            {/* Zoom Controls */}
            <Flex align="center" gap="2">
              <Text size="1" weight="medium" style={{ color: "#a1a1aa" }}>
                Zoom:
              </Text>
              <Button
                size="1"
                variant="soft"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                -
              </Button>
              <Text
                size="1"
                weight="bold"
                style={{
                  fontFamily: "monospace",
                  minWidth: "48px",
                  textAlign: "center",
                  color: "#d4d4d8",
                }}
              >
                {Math.round(zoomLevel * 100)}%
              </Text>
              <Button
                size="1"
                variant="soft"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2}
              >
                +
              </Button>
              <Button
                size="1"
                variant="outline"
                onClick={handleZoomReset}
                disabled={zoomLevel === 1}
              >
                Reset
              </Button>
            </Flex>
          </Flex>

          {/* Advanced Controls Popover */}
          <Popover.Root>
            <Popover.Trigger>
              <Button size="2" variant="outline">
                <GearIcon width="16" height="16" />
                Advanced
              </Button>
            </Popover.Trigger>
            <Popover.Content style={{ width: "280px" }}>
              <Flex direction="column" gap="3">
                <Text size="2" weight="bold">
                  Advanced Options
                </Text>

                {/* Show Insights Button */}
                <Button
                  size="2"
                  variant="soft"
                  onClick={() => setShowContrastInsights(!showContrastInsights)}
                  style={{ width: "100%" }}
                >
                  {showContrastInsights ? "Hide" : "Show"} Contrast Insights
                </Button>

                {/* Heatmap Toggle */}
                <Flex align="center" gap="2">
                  <input
                    type="checkbox"
                    id="heatmap-mode"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  />
                  <Text
                    as="label"
                    htmlFor="heatmap-mode"
                    size="2"
                    weight="medium"
                    style={{ cursor: "pointer", color: "#d4d4d8" }}
                  >
                    Heatmap Mode
                  </Text>
                </Flex>

                {/* Filter Info */}
                {contrastFilterEnabled && (
                  <Box>
                    <Text
                      size="1"
                      weight="medium"
                      mb="1"
                      style={{ color: "#a1a1aa" }}
                    >
                      Active Filter
                    </Text>
                    <Text
                      size="2"
                      style={{ color: "#d4d4d8", fontFamily: "monospace" }}
                    >
                      {contrastFilterType === "apca"
                        ? `APCA Lc ≥ ${contrastFilterThreshold}`
                        : `WCAG ${contrastFilterThreshold}:1`}
                    </Text>
                  </Box>
                )}
              </Flex>
            </Popover.Content>
          </Popover.Root>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              flexShrink: 0,
              padding: "8px",
              backgroundColor: "#27272a",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <ExitFullScreenIcon
                style={{ width: "20px", height: "20px", color: "#a1a1aa" }}
              />
            ) : (
              <EnterFullScreenIcon
                style={{ width: "20px", height: "20px", color: "#a1a1aa" }}
              />
            )}
          </button>
        </Flex>

        {/* Contrast Insights Panel */}
        {showContrastInsights && (
          <Box
            style={{
              backgroundColor: "#18181b",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid #3f3f46",
            }}
          >
            <Text size="3" weight="bold" mb="3">
              Contrast Analysis
            </Text>

            <Flex gap="3" wrap="wrap" mb="3">
              <Card
                style={{
                  flex: "1",
                  minWidth: "150px",
                  backgroundColor: "#27272a",
                  padding: "12px",
                }}
              >
                <Text size="6" weight="bold" style={{ color: "#6366f1" }}>
                  {contrastStats.total}
                </Text>
                <Text size="1" color="gray">
                  Total Pairs
                </Text>
              </Card>
              <Card
                style={{
                  flex: "1",
                  minWidth: "150px",
                  backgroundColor: "#27272a",
                  padding: "12px",
                }}
              >
                <Text size="6" weight="bold" style={{ color: "#22c55e" }}>
                  {contrastStats.passing}
                </Text>
                <Text size="1" color="gray">
                  Passing ({contrastStats.passingPercent}%)
                </Text>
              </Card>
              <Card
                style={{
                  flex: "1",
                  minWidth: "150px",
                  backgroundColor: "#27272a",
                  padding: "12px",
                }}
              >
                <Text size="6" weight="bold" style={{ color: "#a855f7" }}>
                  {contrastStats.apcaHighContrast}
                </Text>
                <Text size="1" color="gray">
                  APCA Lc ≥ 75
                </Text>
              </Card>
              <Card
                style={{
                  flex: "1",
                  minWidth: "150px",
                  backgroundColor: "#27272a",
                  padding: "12px",
                }}
              >
                <Text size="6" weight="bold" style={{ color: "#818cf8" }}>
                  {contrastStats.wcagAAA}
                </Text>
                <Text size="1" color="gray">
                  WCAG AAA
                </Text>
              </Card>
            </Flex>

            <Text size="1" color="gray" style={{ lineHeight: "1.6" }}>
              This contrast analysis examines all possible foreground/background
              combinations within your scale. The statistics show how many color
              pairs meet accessibility standards.
            </Text>
          </Box>
        )}

        {/* Helper Legend */}
        <Flex
          justify="center"
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            fontFamily: "monospace",
            letterSpacing: "0.1em",
            color: "#71717a",
          }}
        >
          Opacity Steps →
        </Flex>

        {/* Grid Container with Proper Overflow Handling */}
        <Box
          ref={containerRef}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            minHeight: "400px",
          }}
        >
          <Box
            style={{
              display: "inline-grid",
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
              gap: "4px",
              padding: "16px",
              minWidth: "min-content",
              gridTemplateColumns: `${cellSize}px repeat(${opacitySteps.length}, ${cellSize}px)`,
              gridAutoRows: `${cellSize}px`,
            }}
          >
            {/* Header Row */}
            <Flex
              align="center"
              justify="center"
              style={{
                fontSize: "10px",
                opacity: 0.5,
                textAlign: "center",
                lineHeight: "1.2",
                color: "#71717a",
              }}
            >
              Source
              <br />
              L↓
            </Flex>
            {opacitySteps.map((op) => (
              <Flex
                key={op}
                align="center"
                justify="center"
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  color: "#71717a",
                }}
              >
                {op}%
              </Flex>
            ))}

            {/* Matrix Rows */}
            {lightnessSteps.map((l, idx) => {
              const generatedColor = generatedColors[idx];
              if (!generatedColor) return null;

              return (
                <React.Fragment key={l}>
                  {/* Row Label */}
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      fontSize: "10px",
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      color: "#fafafa",
                    }}
                  >
                    {l}
                  </Flex>

                  {/* Cells */}
                  {opacitySteps.map((opacity) => (
                    <MatrixCell
                      key={`${l}-${opacity}`}
                      lightness={l}
                      opacity={opacity}
                      hue={generatedColor.H}
                      chroma={generatedColor.C}
                      bgHex={selectedBackground}
                      bgLuminance={bgLuminance}
                      blendMode={blendMode}
                      isMatching={isMatching}
                      targetLightness={targetLightness}
                      contrastFilterEnabled={contrastFilterEnabled}
                      contrastFilterType={contrastFilterType}
                      contrastFilterThreshold={contrastFilterThreshold}
                      showHeatmap={showHeatmap}
                      onHover={handleCellHover}
                      onLeave={handleCellLeave}
                      onClick={copyToClipboard}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </Box>
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
            Copied to clipboard!
          </Box>
        )}
      </Flex>

      {/* Tooltip */}
      {tooltipState.visible && (
        <div
          style={{
            position: "fixed",
            left: `${tooltipState.position.x + 10}px`,
            top: `${tooltipState.position.y + 10}px`,
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            padding: "12px",
            zIndex: 1000,
            pointerEvents: "none",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          {tooltipState.content}
        </div>
      )}
    </Box>
  );
};
