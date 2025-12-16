/**
 * MatrixCell Component
 *
 * Renders a single cell in the lightness-opacity matrix.
 * Displays color with alpha blending on background and provides hover tooltips.
 */

import React, { useCallback, useMemo } from "react";
import { blendOKLCHOnBackground } from "../utils/opacityBlending";
import { calculateUnifiedContrastFromLuminance } from "../utils/contrastUnified";

interface MatrixCellProps {
  lightness: number;
  opacity: number;
  hue: number;
  chroma: number;
  bgHex: string;
  bgLuminance: number;
  blendMode?: "srgb" | "linear";
  isMatching?: boolean;
  targetLightness?: number;
  contrastFilterEnabled?: boolean;
  contrastFilterType?: "wcag" | "apca";
  contrastFilterThreshold?: number;
  showHeatmap?: boolean;
  onHover: (data: { x: number; y: number; content: React.ReactNode }) => void;
  onLeave: () => void;
  onClick: (css: string) => void;
}

export const MatrixCell: React.FC<MatrixCellProps> = React.memo(
  ({
    lightness,
    opacity,
    hue,
    chroma,
    bgHex,
    bgLuminance,
    blendMode = "srgb",
    isMatching = false,
    targetLightness = 50,
    contrastFilterEnabled = false,
    contrastFilterType = "wcag",
    contrastFilterThreshold = 4.5,
    showHeatmap = false,
    onHover,
    onLeave,
    onClick,
  }) => {
    // Calculate blended result
    const blendResult = useMemo(() => {
      return blendOKLCHOnBackground(
        lightness,
        chroma,
        hue,
        opacity,
        bgHex,
        blendMode
      );
    }, [lightness, chroma, hue, opacity, bgHex, blendMode]);

    // Calculate contrast using unified utility
    const { wcagContrast, apcaContrast } = useMemo(() => {
      const result = calculateUnifiedContrastFromLuminance(
        blendResult.luminance,
        bgLuminance
      );
      return { wcagContrast: result.wcag, apcaContrast: result.apca };
    }, [blendResult.luminance, bgLuminance]);

    // Determine if cell should be dimmed (match mode)
    const isDimmed =
      isMatching && Math.abs(blendResult.lightness - targetLightness) > 3;

    // Contrast filter evaluation
    const contrastValue =
      contrastFilterType === "wcag" ? wcagContrast : apcaContrast;
    const passesContrast = contrastValue >= contrastFilterThreshold;

    // WCAG compliance levels
    const wcagAAA = wcagContrast >= 7.0;
    const wcagAANormal = wcagContrast >= 4.5;

    // APCA compliance levels (apcaContrast is already absolute from unified utility)
    const apcaGold = apcaContrast >= 90;
    const apcaSilver = apcaContrast >= 75;
    const apcaBronze = apcaContrast >= 60;

    // Heatmap color calculation
    const getHeatmapColor = () => {
      if (!showHeatmap) return null;

      const value = contrastFilterType === "apca" ? apcaContrast : wcagContrast;
      const threshold = contrastFilterThreshold;
      const ratio = value / threshold;

      if (ratio >= 1.5) return "rgba(34, 197, 94, 0.7)"; // Green - excellent
      if (ratio >= 1.0) return "rgba(59, 130, 246, 0.6)"; // Blue - pass
      if (ratio >= 0.8) return "rgba(251, 191, 36, 0.6)"; // Yellow - warning
      return "rgba(239, 68, 68, 0.7)"; // Red - fail
    };

    const heatmapColor = getHeatmapColor();

    // Generate CSS string for display
    const colorCSS = `oklch(${lightness}% ${chroma} ${hue} / ${opacity}%)`;

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent) => {
        requestAnimationFrame(() => {
          onHover({
            x: e.clientX || 0,
            y: e.clientY || 0,
            content: (
              <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "#a1a1aa" }}>Source:</span>
                  <span style={{ color: "#fafafa" }}>L{lightness}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "#a1a1aa" }}>Opacity:</span>
                  <span style={{ color: "#fafafa" }}>{opacity}%</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "#a1a1aa" }}>Result L*:</span>
                  <span style={{ color: "#fafafa", fontWeight: "bold" }}>
                    {blendResult.lightness.toFixed(1)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "#a1a1aa" }}>Hex:</span>
                  <span
                    style={{
                      color: "#fafafa",
                      fontFamily: "monospace",
                      fontSize: "10px",
                    }}
                  >
                    {blendResult.hex}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    borderTop: "1px solid #3f3f46",
                    paddingTop: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#71717a",
                      marginBottom: "4px",
                    }}
                  >
                    Contrast
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "#a1a1aa" }}>WCAG:</span>
                    <span style={{ color: "#fafafa", fontWeight: "bold" }}>
                      {wcagContrast.toFixed(2)}:1
                      {wcagAAA && (
                        <span
                          style={{
                            marginLeft: "4px",
                            fontSize: "8px",
                            color: "#22c55e",
                          }}
                        >
                          AAA
                        </span>
                      )}
                      {!wcagAAA && wcagAANormal && (
                        <span
                          style={{
                            marginLeft: "4px",
                            fontSize: "8px",
                            color: "#3b82f6",
                          }}
                        >
                          AA
                        </span>
                      )}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <span style={{ color: "#a1a1aa" }}>APCA:</span>
                    <span style={{ color: "#fafafa", fontWeight: "bold" }}>
                      Lc {apcaContrast.toFixed(0)}
                      {apcaGold && (
                        <span
                          style={{
                            marginLeft: "4px",
                            fontSize: "8px",
                            color: "#facc15",
                          }}
                        >
                          GOLD
                        </span>
                      )}
                      {!apcaGold && apcaSilver && (
                        <span
                          style={{
                            marginLeft: "4px",
                            fontSize: "8px",
                            color: "#a1a1aa",
                          }}
                        >
                          SILVER
                        </span>
                      )}
                      {!apcaGold && !apcaSilver && apcaBronze && (
                        <span
                          style={{
                            marginLeft: "4px",
                            fontSize: "8px",
                            color: "#f97316",
                          }}
                        >
                          BRONZE
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ),
          });
        });
      },
      [
        lightness,
        opacity,
        blendResult,
        wcagContrast,
        apcaContrast,
        wcagAAA,
        wcagAANormal,
        apcaGold,
        apcaSilver,
        apcaBronze,
        onHover,
      ]
    );

    const handleClick = useCallback(() => {
      onClick(colorCSS);
    }, [colorCSS, onClick]);

    return (
      <div
        onClick={handleClick}
        style={{
          position: "relative",
          aspectRatio: "1",
          backgroundColor: blendResult.hex,
          borderRadius: "4px",
          cursor: "pointer",
          opacity: isDimmed
            ? 0.25
            : contrastFilterEnabled && !passesContrast
            ? 0.3
            : 1,
          transition: "opacity 0.15s, transform 0.1s",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.transform = "scale(1.1)";
          target.style.zIndex = "10";
          handleMouseEnter(e);
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.transform = "scale(1)";
          target.style.zIndex = "1";
          onLeave();
        }}
      >
        {heatmapColor && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: heatmapColor,
              borderRadius: "4px",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    );
  }
);

MatrixCell.displayName = "MatrixCell";
