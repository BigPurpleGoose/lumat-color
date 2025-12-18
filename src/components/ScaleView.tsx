import React, { useMemo, useState, lazy, Suspense } from "react";
import { Flex, Tabs, Button, Box, Text, Grid, Spinner } from "@radix-ui/themes";
import { useAppStore } from "../store/useAppStore";
import { generateColor } from "../utils/colorEngine";
import { Swatch } from "./Swatch";
import { GradientVisualization } from "./GradientVisualization";
import { ErrorBoundary } from "./ErrorBoundary";
import type { ViewMode } from "../types";

// Lazy load heavy components for better code splitting
const MatrixView = lazy(() =>
  import("./MatrixView").then((m) => ({ default: m.MatrixView }))
);
const AnalysisView = lazy(() => import("./AnalysisView"));
const AdvancedExportDialog = lazy(() =>
  import("./AdvancedExportDialog").then((m) => ({
    default: m.AdvancedExportDialog,
  }))
);

export const ScaleView: React.FC = () => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [gradientMode, setGradientMode] = useState<"linear" | "animated">(
    "linear"
  );
  const {
    getActiveScale,
    viewMode,
    setViewMode,
    getLightnessSteps,
    accessibilitySettings,
  } = useAppStore();

  const activeScale = getActiveScale();

  // Memoize lightnessSteps to prevent unnecessary recalculations
  const lightnessSteps = useMemo(
    () => (activeScale ? getLightnessSteps(activeScale) : []),
    [activeScale, getLightnessSteps]
  );

  // Compute Colors Memoized - recalculates when activeScale, lightnessSteps, or accessibilitySettings.targetBackground change
  // This ensures colors regenerate when the global target background changes
  const generatedColors = useMemo(() => {
    if (!activeScale) return [];
    return lightnessSteps.map((lightnessStep) => {
      const lNormalized = lightnessStep / 100;
      return generateColor(
        lNormalized,
        activeScale.manualChroma,
        activeScale.hue,
        activeScale.hueCurve,
        activeScale.chromaCurve,
        {
          contrastMode: activeScale.contrastMode || "standard",
          calculateContrast: true,
          targetBackground: accessibilitySettings.targetBackground,
          targetLc: activeScale.apcaTargetLc,
          targetWcagRatio: activeScale.wcagTargetRatio,
          chromaCompensation: activeScale.chromaCompensation ?? true,
        }
      );
    });
  }, [activeScale, lightnessSteps, accessibilitySettings.targetBackground]);

  if (!activeScale) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        style={{ height: "100%" }}
      >
        <Text size="3" color="gray">
          Select or create a scale to begin
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" style={{ height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Flex
        justify="between"
        align="center"
        p="4"
        style={{ borderBottom: "1px solid #3f3f46" }}
      >
        <Text size="5" weight="bold">
          {activeScale.name}
        </Text>
        <Flex gap="2">
          <Button
            size="2"
            variant="soft"
            onClick={() => setShowExportModal(true)}
          >
            Export
          </Button>
        </Flex>
      </Flex>

      {/* Tabs */}
      <Tabs.Root
        value={viewMode || "swatch"}
        onValueChange={(v) => setViewMode(v as ViewMode)}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Tabs.List>
          <Tabs.Trigger value="swatch">Swatch</Tabs.Trigger>
          <Tabs.Trigger value="gradient">Gradient</Tabs.Trigger>
          <Tabs.Trigger value="matrix">Matrix</Tabs.Trigger>
          <Tabs.Trigger value="analysis">Analysis</Tabs.Trigger>
        </Tabs.List>

        <Box
          p="4"
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Tabs.Content
            value="swatch"
            style={{ flex: 1, minHeight: 0, overflow: "auto" }}
          >
            <Grid columns="repeat(auto-fill, minmax(120px, 1fr))" gap="4">
              {generatedColors.map((color, index) => (
                <Swatch
                  key={index}
                  color={color}
                  step={lightnessSteps[index]}
                />
              ))}
            </Grid>
          </Tabs.Content>

          <Tabs.Content
            value="gradient"
            style={{ flex: 1, minHeight: 0, overflow: "auto" }}
          >
            <Flex
              direction="column"
              align="center"
              gap="4"
              style={{
                width: "100%",
                maxWidth: "80rem",
                margin: "0 auto",
                padding: "1rem",
                boxSizing: "border-box",
              }}
            >
              {/* GradientVisualization now includes its own toolbar */}
              <GradientVisualization
                colors={generatedColors}
                mode={gradientMode}
                onModeChange={setGradientMode}
              />

              {/* Description */}
              <Text
                align="center"
                color="gray"
                size="2"
                style={{
                  marginTop: "0.5rem",
                  maxWidth: "600px",
                  lineHeight: "1.6",
                }}
              >
                {gradientMode === "linear" &&
                  "Check for banding (Bezold–Brücke artifacts). P3 OKLCH should minimize this significantly compared to HSL. Smooth transitions indicate proper perceptual uniformity."}
                {gradientMode === "animated" &&
                  "Diagonal gradient with smooth animated position transitions. Observe how colors flow naturally across the viewport."}
              </Text>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="matrix" style={{ flex: 1, minHeight: 0 }}>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <Flex
                    justify="center"
                    align="center"
                    style={{ height: "100%" }}
                  >
                    <Spinner size="3" />
                  </Flex>
                }
              >
                <MatrixView scale={activeScale} />
              </Suspense>
            </ErrorBoundary>
          </Tabs.Content>

          <Tabs.Content value="analysis" style={{ flex: 1, minHeight: 0 }}>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <Flex
                    justify="center"
                    align="center"
                    style={{ height: "100%" }}
                  >
                    <Spinner size="3" />
                  </Flex>
                }
              >
                <AnalysisView scale={activeScale} />
              </Suspense>
            </ErrorBoundary>
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {/* Export Dialog */}
      <Suspense fallback={null}>
        <AdvancedExportDialog
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          scale={activeScale}
          colors={generatedColors}
        />
      </Suspense>
    </Flex>
  );
};
