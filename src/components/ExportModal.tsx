import React, { useState, useMemo } from "react";
import {
  Dialog,
  Flex,
  Box,
  Button,
  Tabs,
  Text,
  ScrollArea,
  Badge,
  Table,
  Card,
  Grid,
  Slider,
  Switch,
} from "@radix-ui/themes";
import {
  Cross2Icon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  OpenInNewWindowIcon,
} from "@radix-ui/react-icons";
import { ColorScale } from "../types";
import { ColorResult } from "../utils/colorEngine";
import { useAppStore } from "../store/useAppStore";
import {
  generateColorMatrix,
  generateHTMLDocumentation,
  generateContrastMatrix,
  generateUsageGuidelines,
} from "../utils/documentationExport";
import { calculateAPCA, calculateWCAG } from "../utils/contrast";
import { converter } from "culori";
import { generateCSSWithFallbacks } from "../utils/cssExport";
import { BACKGROUND_PRESETS } from "../utils/constants";

type ExportFormat =
  | "css"
  | "json"
  | "markdown"
  | "tokens"
  | "svg"
  | "html"
  | "csv";
type PreviewMode =
  | "swatches"
  | "guidelines"
  | "contrast"
  | "matrix"
  | "report"
  | "code";

const toOklch = converter("oklch");

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scale: ColorScale;
  colors: ColorResult[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  scale,
  colors,
}) => {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("css");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("swatches");
  const [copied, setCopied] = useState(false);

  // Contrast filtering state
  const [useAPCAFilter, setUseAPCAFilter] = useState(true);
  const [minAPCA, setMinAPCA] = useState(30);
  const [maxAPCA, setMaxAPCA] = useState(120);
  const [minWCAG, setMinWCAG] = useState(1);
  const [maxWCAG, setMaxWCAG] = useState(21);
  const [showAllPairs, setShowAllPairs] = useState(true);

  const { getLightnessSteps } = useAppStore();

  const lightnessSteps = getLightnessSteps(scale);

  // Get background based on scale's targetBackground - memoized to update when targetBackground changes
  const bg = useMemo(() => {
    // Find the matching preset by name
    const preset = BACKGROUND_PRESETS.find(
      (p) => p.name === scale.targetBackground
    );

    // If preset found, use its color; otherwise fallback to white
    return preset ? preset.color : "#FFFFFF";
  }, [scale.targetBackground]);

  // Convert background to OKLCH - memoized to update when bg changes
  const bgColor = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bgOklch = toOklch(bg as any);
    // Better fallback: if conversion fails, default to white (L=1) instead of black (L=0)
    if (!bgOklch) return { mode: "oklch" as const, l: 1, c: 0, h: 0 };
    return {
      mode: "oklch" as const,
      l: bgOklch.l,
      c: bgOklch.c || 0,
      h: bgOklch.h || 0,
    };
  }, [bg]);

  const exportContent = useMemo(() => {
    const scaleName = scale.name.toLowerCase().replace(/\s/g, "-");

    switch (activeFormat) {
      case "css":
        return generateCSSWithFallbacks(scale, colors, lightnessSteps, {
          includeP3Fallbacks: true,
          includeComments: true,
          includeLightnessNotes: true,
        });

      case "json":
        return JSON.stringify(
          colors.reduce<
            Record<
              string,
              {
                hex: string;
                oklch: string;
                p3: string;
                lightness: number;
                chroma: number;
                hue: number;
              }
            >
          >((acc, c, i) => {
            const step = lightnessSteps[i];
            acc[`${scaleName}-${step}`] = {
              hex: c.hex,
              oklch: c.oklch,
              p3: c.cssP3,
              lightness: Math.round(c.L * 100),
              chroma: parseFloat(c.C.toFixed(4)),
              hue: parseFloat(c.H.toFixed(1)),
            };
            return acc;
          }, {}),
          null,
          2
        );

      case "markdown":
        return (
          `# ${scale.name}\n\n` +
          colors
            .map((c, i) => {
              const step = lightnessSteps[i];
              return (
                `## ${scaleName}-${step}\n` +
                `- **Hex**: ${c.hex}\n` +
                `- **OKLCH**: ${c.oklch}\n` +
                `- **P3**: ${c.cssP3}\n` +
                `- **Lightness**: ${Math.round(c.L * 100)}\n`
              );
            })
            .join("\n")
        );

      case "tokens":
        return JSON.stringify(
          colors.reduce<
            Record<
              string,
              { $type: string; $value: string; $description: string }
            >
          >((acc, c, i) => {
            const step = lightnessSteps[i];
            acc[`${scaleName}.${step}`] = {
              $type: "color",
              $value: c.hex,
              $description: `${scale.name} ${step}`,
            };
            return acc;
          }, {}),
          null,
          2
        );

      case "svg":
        return generateColorMatrix(scale, colors);

      case "html": {
        const contrastMatrix = generateContrastMatrix(colors);
        const guidelines = generateUsageGuidelines(colors, scale);
        return generateHTMLDocumentation(
          scale,
          colors,
          guidelines,
          contrastMatrix
        );
      }

      case "csv": {
        const headers = [
          "Step",
          "Lightness",
          "Hex",
          "OKLCH",
          "P3",
          "Chroma",
          "Hue",
          "WCAG (vs bg)",
          "WCAG Precise",
          "APCA (vs bg)",
          "Rounding Note",
        ].join(",");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bgOklch = toOklch(bg as any);
        if (!bgOklch) return "Error converting background color";

        const formatWCAGWithIndicator = (
          value: number
        ): { display: string; precise: string; note: string } => {
          const rounded1 = Number(value.toFixed(1));
          const rounded2 = Number(value.toFixed(2));
          const rounded3 = Number(value.toFixed(3));

          const roundedAt2 = rounded3 !== rounded2;
          const roundedAt1 = rounded2 !== rounded1;

          let display: string;
          let note: string;

          if (roundedAt2 && roundedAt1) {
            display = `${rounded1.toFixed(1)}†:1`;
            note = "Double rounded (3+ decimals → 1 decimal)";
          } else if (roundedAt1) {
            display = `${rounded1.toFixed(1)}*:1`;
            note = "Single rounded (2 decimals → 1 decimal)";
          } else {
            display = `${rounded1.toFixed(1)}:1`;
            note = "No significant rounding";
          }

          return {
            display,
            precise: `${value.toFixed(3)}:1`,
            note,
          };
        };

        const rows = colors.map((c, i) => {
          const step = lightnessSteps[i];
          const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
          const bgColor = {
            mode: "oklch" as const,
            l: bgOklch.l,
            c: bgOklch.c || 0,
            h: bgOklch.h || 0,
          };

          const wcag = calculateWCAG(colorOklch, bgColor);
          const apca = calculateAPCA(colorOklch, bgColor);
          const wcagFormatted = formatWCAGWithIndicator(wcag);

          return [
            step,
            Math.round(c.L * 100),
            c.hex,
            c.oklch,
            c.cssP3,
            c.C.toFixed(4),
            c.H.toFixed(1),
            wcagFormatted.display,
            wcagFormatted.precise,
            `Lc ${Math.abs(apca).toFixed(0)}`,
            wcagFormatted.note,
          ].join(",");
        });

        return [headers, ...rows].join("\n");
      }

      default:
        return "";
    }
  }, [activeFormat, colors, scale, lightnessSteps, bg]);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extensions: Record<ExportFormat, string> = {
      css: "css",
      json: "json",
      markdown: "md",
      tokens: "json",
      svg: "svg",
      html: "html",
      csv: "csv",
    };

    const mimeTypes: Record<ExportFormat, string> = {
      css: "text/css",
      json: "application/json",
      markdown: "text/markdown",
      tokens: "application/json",
      svg: "image/svg+xml",
      html: "text/html",
      csv: "text/csv",
    };

    const blob = new Blob([exportContent], { type: mimeTypes[activeFormat] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scale.name.toLowerCase().replace(/\s+/g, "-")}.${
      extensions[activeFormat]
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    if (activeFormat === "html" || activeFormat === "svg") {
      const blob = new Blob([exportContent], {
        type: activeFormat === "html" ? "text/html" : "image/svg+xml",
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  const renderPreview = () => {
    switch (previewMode) {
      case "swatches": {
        return (
          <Grid columns="3" gap="3" p="3">
            {colors.map((color, idx) => {
              const step = lightnessSteps[idx];
              const colorOklch = {
                mode: "oklch" as const,
                l: color.L,
                c: color.C,
                h: color.H,
              };
              const wcag = calculateWCAG(colorOklch, bgColor);
              const apca = calculateAPCA(colorOklch, bgColor);

              return (
                <Card key={idx} style={{ padding: "16px" }}>
                  <Flex direction="column" gap="3">
                    <Box
                      style={{
                        width: "100%",
                        height: "100px",
                        backgroundColor: color.hex,
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Flex justify="between" align="center">
                      <Badge size="2" color="indigo">
                        {step}
                      </Badge>
                      <Text
                        size="2"
                        weight="medium"
                        style={{ fontFamily: "monospace", color: "#a1a1aa" }}
                      >
                        L {Math.round(color.L * 100)}
                      </Text>
                    </Flex>
                    <Text
                      size="2"
                      weight="medium"
                      style={{ fontFamily: "monospace" }}
                    >
                      {color.hex}
                    </Text>
                    <Flex gap="2">
                      <Badge
                        color={
                          wcag >= 4.5 ? "green" : wcag >= 3 ? "yellow" : "gray"
                        }
                        variant="soft"
                        size="2"
                      >
                        {wcag.toFixed(1)}:1
                      </Badge>
                      <Badge
                        color={
                          Math.abs(apca) >= 60
                            ? "green"
                            : Math.abs(apca) >= 45
                            ? "yellow"
                            : "gray"
                        }
                        variant="soft"
                        size="2"
                      >
                        Lc {Math.abs(apca).toFixed(0)}
                      </Badge>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Grid>
        );
      }

      case "guidelines": {
        const guidelines = generateUsageGuidelines(colors, scale);
        return (
          <Flex direction="column" gap="3" p="3">
            {guidelines.map((guide, idx) => (
              <Card key={idx} style={{ padding: "20px" }}>
                <Flex direction="column" gap="3">
                  <Flex align="center" gap="3">
                    <Box
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: guide.color,
                        borderRadius: "6px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Text size="3" weight="bold">
                      Step {guide.step}
                    </Text>
                  </Flex>
                  <Box>
                    <Text
                      size="2"
                      weight="bold"
                      mb="2"
                      style={{ color: "#d4d4d8" }}
                    >
                      Recommendations:
                    </Text>
                    {guide.recommendations.map((rec, i) => (
                      <Text
                        key={i}
                        size="2"
                        color="gray"
                        style={{ display: "block", marginBottom: "4px" }}
                      >
                        • {rec}
                      </Text>
                    ))}
                  </Box>
                  {guide.warnings.length > 0 && (
                    <Box>
                      <Text size="2" weight="bold" mb="2" color="red">
                        Warnings:
                      </Text>
                      {guide.warnings.map((warn, i) => (
                        <Text
                          key={i}
                          size="2"
                          color="red"
                          style={{ display: "block" }}
                        >
                          ⚠️ {warn}
                        </Text>
                      ))}
                    </Box>
                  )}
                  <Flex gap="2">
                    <Text size="1" color="gray">
                      Best pairings:
                    </Text>
                    {guide.bestPairings.map((pair, i) => (
                      <Badge key={i} variant="soft" color="blue">
                        {pair}
                      </Badge>
                    ))}
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        );
      }

      case "contrast": {
        // Calculate filtered color list based on contrast criteria
        const contrastData = colors.map((color, idx) => {
          const step = lightnessSteps[idx];
          const colorOklch = {
            mode: "oklch" as const,
            l: color.L,
            c: color.C,
            h: color.H,
          };
          const wcag = calculateWCAG(colorOklch, bgColor);
          const apca = Math.abs(calculateAPCA(colorOklch, bgColor));
          const level =
            wcag >= 7
              ? "AAA"
              : wcag >= 4.5
              ? "AA"
              : wcag >= 3
              ? "AA Large"
              : "Fail";

          return { color, step, colorOklch, wcag, apca, level, idx };
        });

        // Apply filters
        const filteredData = showAllPairs
          ? contrastData
          : contrastData.filter((item) => {
              if (useAPCAFilter) {
                return item.apca >= minAPCA && item.apca <= maxAPCA;
              } else {
                return item.wcag >= minWCAG && item.wcag <= maxWCAG;
              }
            });

        return (
          <Box p="3">
            {/* Filter Controls */}
            <Card style={{ padding: "16px", marginBottom: "16px" }}>
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Text size="2" weight="bold">
                    Contrast Filters
                  </Text>
                  <Flex align="center" gap="2">
                    <Text size="2">Show All</Text>
                    <Switch
                      checked={showAllPairs}
                      onCheckedChange={setShowAllPairs}
                    />
                  </Flex>
                </Flex>

                {!showAllPairs && (
                  <>
                    <Flex gap="3" align="center">
                      <Button
                        variant={useAPCAFilter ? "solid" : "soft"}
                        size="1"
                        onClick={() => setUseAPCAFilter(true)}
                      >
                        APCA
                      </Button>
                      <Button
                        variant={!useAPCAFilter ? "solid" : "soft"}
                        size="1"
                        onClick={() => setUseAPCAFilter(false)}
                      >
                        WCAG
                      </Button>
                    </Flex>

                    {useAPCAFilter ? (
                      <>
                        <Box>
                          <Flex justify="between" mb="2">
                            <Text size="2">Min APCA: Lc {minAPCA}</Text>
                            <Text size="2">Max APCA: Lc {maxAPCA}</Text>
                          </Flex>
                          <Flex gap="3">
                            <Box style={{ flex: 1 }}>
                              <Slider
                                value={[minAPCA]}
                                onValueChange={(v) => setMinAPCA(v[0])}
                                min={0}
                                max={120}
                                step={5}
                              />
                            </Box>
                            <Box style={{ flex: 1 }}>
                              <Slider
                                value={[maxAPCA]}
                                onValueChange={(v) => setMaxAPCA(v[0])}
                                min={0}
                                max={120}
                                step={5}
                              />
                            </Box>
                          </Flex>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box>
                          <Flex justify="between" mb="2">
                            <Text size="2">
                              Min WCAG: {minWCAG.toFixed(1)}:1
                            </Text>
                            <Text size="2">
                              Max WCAG: {maxWCAG.toFixed(1)}:1
                            </Text>
                          </Flex>
                          <Flex gap="3">
                            <Box style={{ flex: 1 }}>
                              <Slider
                                value={[minWCAG]}
                                onValueChange={(v) => setMinWCAG(v[0])}
                                min={1}
                                max={21}
                                step={0.5}
                              />
                            </Box>
                            <Box style={{ flex: 1 }}>
                              <Slider
                                value={[maxWCAG]}
                                onValueChange={(v) => setMaxWCAG(v[0])}
                                min={1}
                                max={21}
                                step={0.5}
                              />
                            </Box>
                          </Flex>
                        </Box>
                      </>
                    )}

                    <Text size="2" color="gray">
                      Showing {filteredData.length} of {contrastData.length}{" "}
                      colors
                    </Text>
                  </>
                )}
              </Flex>
            </Card>

            {/* Contrast Table */}
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Pair</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Colors</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>WCAG</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>APCA</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Level</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredData.map((item) => (
                  <Table.Row key={item.idx}>
                    <Table.Cell>
                      <Text style={{ fontFamily: "monospace" }}>
                        {item.step} × BG
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2" align="center">
                        <Box
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: item.color.hex,
                            borderRadius: "4px",
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                        <Box
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: bg,
                            borderRadius: "4px",
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text style={{ fontFamily: "monospace" }}>
                        {item.wcag.toFixed(2)}:1
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text style={{ fontFamily: "monospace" }}>
                        Lc {item.apca.toFixed(0)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={
                          item.level === "AAA"
                            ? "green"
                            : item.level === "AA"
                            ? "blue"
                            : item.level === "AA Large"
                            ? "yellow"
                            : "red"
                        }
                      >
                        {item.level}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        );
      }

      case "matrix": {
        return (
          <Box p="3">
            <div
              dangerouslySetInnerHTML={{
                __html: generateColorMatrix(scale, colors),
              }}
            />
          </Box>
        );
      }

      case "report": {
        const totalColors = colors.length;
        const accessibleColors = colors.filter((c) => {
          const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
          return calculateWCAG(colorOklch, bgColor) >= 4.5;
        }).length;
        const apcaCompliant = colors.filter((c) => {
          const colorOklch = { mode: "oklch" as const, l: c.L, c: c.C, h: c.H };
          return Math.abs(calculateAPCA(colorOklch, bgColor)) >= 60;
        }).length;
        const avgChroma =
          colors.reduce((sum, c) => sum + c.C, 0) / colors.length;

        return (
          <Flex direction="column" gap="4" p="4">
            <Box>
              <Text size="5" weight="bold" mb="2">
                Accessibility Report
              </Text>
              <Text size="2" color="gray">
                Analysis of {scale.name} color scale against WCAG and APCA
                standards
              </Text>
            </Box>

            <Grid columns="2" gap="3">
              <Card style={{ padding: "16px" }}>
                <Text size="2" color="gray" mb="1">
                  Total Colors
                </Text>
                <Text size="6" weight="bold">
                  {totalColors}
                </Text>
              </Card>
              <Card style={{ padding: "16px" }}>
                <Text size="2" color="gray" mb="1">
                  WCAG AA+ Compliant
                </Text>
                <Text
                  size="6"
                  weight="bold"
                  style={{
                    color:
                      accessibleColors / totalColors > 0.5
                        ? "#22c55e"
                        : "#facc15",
                  }}
                >
                  {accessibleColors} (
                  {Math.round((accessibleColors / totalColors) * 100)}%)
                </Text>
              </Card>
              <Card style={{ padding: "16px" }}>
                <Text size="2" color="gray" mb="1">
                  APCA Compliant
                </Text>
                <Text
                  size="6"
                  weight="bold"
                  style={{
                    color:
                      apcaCompliant / totalColors > 0.5 ? "#22c55e" : "#facc15",
                  }}
                >
                  {apcaCompliant} (
                  {Math.round((apcaCompliant / totalColors) * 100)}%)
                </Text>
              </Card>
              <Card style={{ padding: "16px" }}>
                <Text size="2" color="gray" mb="1">
                  Avg Chroma
                </Text>
                <Text size="6" weight="bold">
                  {avgChroma.toFixed(3)}
                </Text>
              </Card>
            </Grid>

            <Card style={{ padding: "16px", backgroundColor: "#fef3c7" }}>
              <Text size="2" weight="bold" mb="2">
                📊 Contrast Summary
              </Text>
              <Text size="2">
                {accessibleColors} of {totalColors} colors meet WCAG AA
                standards (4.5:1) for normal text. For large text (AA Large at
                3:1), consider using additional steps.
              </Text>
            </Card>
          </Flex>
        );
      }

      case "code":
      default: {
        return (
          <Box p="3">
            <pre
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: "1.5",
                color: "#fafafa",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {exportContent}
            </pre>
          </Box>
        );
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: "800px", maxHeight: "90vh" }}>
        <Dialog.Title>Export {scale.name}</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Export your color scale in various formats for use in design tools and
          code.
        </Dialog.Description>

        <Tabs.Root
          value={activeFormat}
          onValueChange={(v) => setActiveFormat(v as ExportFormat)}
        >
          <Tabs.List>
            <Tabs.Trigger value="css">CSS</Tabs.Trigger>
            <Tabs.Trigger value="json">JSON</Tabs.Trigger>
            <Tabs.Trigger value="markdown">Markdown</Tabs.Trigger>
            <Tabs.Trigger value="tokens">Design Tokens</Tabs.Trigger>
            <Tabs.Trigger value="svg">SVG</Tabs.Trigger>
            <Tabs.Trigger value="html">HTML</Tabs.Trigger>
            <Tabs.Trigger value="csv">CSV</Tabs.Trigger>
          </Tabs.List>

          <Box mt="4">
            <Tabs.Content value="css">
              <Text size="2" color="gray" mb="3">
                CSS custom properties ready to use in your stylesheets. Includes
                both hex and OKLCH formats with P3 gamut support.
              </Text>
            </Tabs.Content>
            <Tabs.Content value="json">
              <Text size="2" color="gray" mb="3">
                JSON format with complete color data including contrast ratios,
                gamut information, and curve parameters.
              </Text>
            </Tabs.Content>
            <Tabs.Content value="markdown">
              <Text size="2" color="gray" mb="3">
                Formatted documentation with color swatches, contrast data, and
                usage guidelines.
              </Text>
            </Tabs.Content>
            <Tabs.Content value="tokens">
              <Text size="2" color="gray" mb="3">
                W3C Design Tokens format compatible with design systems and
                token tools.
              </Text>
            </Tabs.Content>
            <Tabs.Content value="svg">
              <Text size="2" color="gray" mb="3">
                Presentation-ready SVG matrix showing all opacity variations
                across lightness steps. Perfect for design reviews and
                documentation.
              </Text>
            </Tabs.Content>
            <Tabs.Content value="html">
              <Text size="2" color="gray" mb="3">
                Interactive HTML documentation with embedded styles, contrast
                matrices, and accessibility analysis. Self-contained and ready
                to share.
              </Text>
            </Tabs.Content>
            <Tabs.Content value="csv">
              <Text size="2" color="gray" mb="3">
                Comma-separated values format for use in spreadsheets, data
                analysis, and automation tools.
              </Text>
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        {/* Preview Mode Tabs */}
        <Flex gap="2" mt="4" mb="2" wrap="wrap">
          <Button
            variant={previewMode === "swatches" ? "solid" : "soft"}
            size="1"
            onClick={() => setPreviewMode("swatches")}
          >
            Swatches
          </Button>
          <Button
            variant={previewMode === "guidelines" ? "solid" : "soft"}
            size="1"
            onClick={() => setPreviewMode("guidelines")}
          >
            Guidelines
          </Button>
          <Button
            variant={previewMode === "contrast" ? "solid" : "soft"}
            size="1"
            onClick={() => setPreviewMode("contrast")}
          >
            Contrast
          </Button>
          <Button
            variant={previewMode === "matrix" ? "solid" : "soft"}
            size="1"
            onClick={() => setPreviewMode("matrix")}
          >
            Matrix
          </Button>
          <Button
            variant={previewMode === "report" ? "solid" : "soft"}
            size="1"
            onClick={() => setPreviewMode("report")}
          >
            Report
          </Button>
          <Button
            variant={previewMode === "code" ? "solid" : "soft"}
            size="1"
            onClick={() => setPreviewMode("code")}
          >
            Code
          </Button>
        </Flex>

        <Box
          mt="3"
          style={{
            backgroundColor: "#09090b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <ScrollArea style={{ height: "400px" }}>{renderPreview()}</ScrollArea>
        </Box>

        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" color="gray" onClick={onClose}>
            Close
          </Button>
          {(activeFormat === "html" || activeFormat === "svg") && (
            <Button variant="soft" onClick={handleOpenInNewTab}>
              <OpenInNewWindowIcon /> Open in New Tab
            </Button>
          )}
          <Button variant="soft" onClick={handleDownload}>
            <DownloadIcon /> Download
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <CheckIcon /> Copied!
              </>
            ) : (
              <>
                <CopyIcon /> Copy
              </>
            )}
          </Button>
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
