import React from "react";
import { Box, Flex, Text, Button } from "@radix-ui/themes";
import { ColorScale } from "../types";

interface CurveControlsProps {
  scale: ColorScale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (key: keyof ColorScale, value: any) => void;
}

export const CurveControls: React.FC<CurveControlsProps> = ({
  scale,
  onUpdate,
}) => {
  const updateHueCurve = (key: "shift" | "power", value: number) => {
    onUpdate("hueCurve", { ...scale.hueCurve, [key]: value });
  };

  const updateChromaCurve = (key: "shift" | "power", value: number) => {
    onUpdate("chromaCurve", { ...scale.chromaCurve, [key]: value });
  };

  const resetCurves = () => {
    onUpdate("hueCurve", { shift: 0, power: 1 });
    onUpdate("chromaCurve", { shift: 0, power: 1 });
  };

  const hasNonDefaultCurves =
    scale.hueCurve.shift !== 0 ||
    scale.hueCurve.power !== 1 ||
    scale.chromaCurve.shift !== 0 ||
    scale.chromaCurve.power !== 1;

  return (
    <Flex direction="column" gap="4">
      {/* Hue Curve Controls */}
      <Flex direction="column" gap="3">
        <Text
          size="2"
          weight="medium"
          style={{
            color: "#d4d4d8",
          }}
        >
          Hue Curve
        </Text>

        {/* Hue Shift */}
        <Box>
          <Flex justify="between" mb="2">
            <Text size="1" style={{ color: "#a1a1aa" }}>
              Hue Shift (at darkest)
            </Text>
            <Text
              size="1"
              style={{
                fontFamily: "monospace",
                color: "#fafafa",
                fontWeight: 600,
              }}
            >
              {scale.hueCurve.shift > 0 ? "+" : ""}
              {scale.hueCurve.shift}°
            </Text>
          </Flex>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={scale.hueCurve.shift}
            onChange={(e) => updateHueCurve("shift", parseInt(e.target.value))}
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#27272a",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          />
          <Text size="1" color="gray" mt="1" style={{ fontSize: "10px" }}>
            Positive shifts towards warmer hues (red), negative towards cooler
            (blue)
          </Text>
        </Box>

        {/* Hue Power */}
        <Box>
          <Flex justify="between" mb="2">
            <Text size="1" style={{ color: "#a1a1aa" }}>
              Hue Curve Power
            </Text>
            <Text
              size="1"
              style={{
                fontFamily: "monospace",
                color: "#fafafa",
                fontWeight: 600,
              }}
            >
              {scale.hueCurve.power.toFixed(2)}
            </Text>
          </Flex>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={scale.hueCurve.power}
            onChange={(e) =>
              updateHueCurve("power", parseFloat(e.target.value))
            }
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#27272a",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          />
          <Text size="1" color="gray" mt="1" style={{ fontSize: "10px" }}>
            &lt;1.0 = shift affects darks more | 1.0 = linear | &gt;1.0 = shift
            affects lights more
          </Text>
        </Box>
      </Flex>

      {/* Chroma Curve Controls */}
      <Flex
        direction="column"
        gap="3"
        pt="3"
        style={{ borderTop: "1px solid #3f3f46" }}
      >
        <Text
          size="2"
          weight="medium"
          style={{
            color: "#d4d4d8",
          }}
        >
          Chroma Curve
        </Text>

        {/* Chroma Shift */}
        <Box>
          <Flex justify="between" mb="2">
            <Text size="1" style={{ color: "#a1a1aa" }}>
              Chroma Shift (at darkest)
            </Text>
            <Text
              size="1"
              style={{
                fontFamily: "monospace",
                color: "#fafafa",
                fontWeight: 600,
              }}
            >
              {scale.chromaCurve.shift > 0 ? "+" : ""}
              {scale.chromaCurve.shift.toFixed(3)}
            </Text>
          </Flex>
          <input
            type="range"
            min="-0.2"
            max="0.2"
            step="0.01"
            value={scale.chromaCurve.shift}
            onChange={(e) =>
              updateChromaCurve("shift", parseFloat(e.target.value))
            }
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#27272a",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          />
          <Text size="1" color="gray" mt="1" style={{ fontSize: "10px" }}>
            Positive increases saturation in darks, negative decreases it
          </Text>
        </Box>

        {/* Chroma Power */}
        <Box>
          <Flex justify="between" mb="2">
            <Text size="1" style={{ color: "#a1a1aa" }}>
              Chroma Curve Power
            </Text>
            <Text
              size="1"
              style={{
                fontFamily: "monospace",
                color: "#fafafa",
                fontWeight: 600,
              }}
            >
              {scale.chromaCurve.power.toFixed(2)}
            </Text>
          </Flex>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={scale.chromaCurve.power}
            onChange={(e) =>
              updateChromaCurve("power", parseFloat(e.target.value))
            }
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#27272a",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          />
          <Text size="1" color="gray" mt="1" style={{ fontSize: "10px" }}>
            Controls how the chroma shift is distributed across the lightness
            range
          </Text>
        </Box>
      </Flex>

      {/* Preset Buttons */}
      <Flex
        direction="column"
        gap="2"
        pt="3"
        style={{ borderTop: "1px solid #3f3f46" }}
      >
        <Text size="1" weight="medium" style={{ color: "#a1a1aa" }}>
          Quick Presets
        </Text>
        <Flex gap="2" wrap="wrap">
          <Button
            size="1"
            variant="soft"
            onClick={() => {
              updateHueCurve("shift", 20);
              updateHueCurve("power", 0.7);
            }}
          >
            Warm Darks
          </Button>
          <Button
            size="1"
            variant="soft"
            onClick={() => {
              updateHueCurve("shift", -30);
              updateHueCurve("power", 1.5);
            }}
          >
            Cool Lights
          </Button>
          <Button
            size="1"
            variant="soft"
            onClick={() => {
              updateChromaCurve("shift", 0.05);
              updateChromaCurve("power", 0.8);
            }}
          >
            Vibrant Darks
          </Button>
          <Button
            size="1"
            variant="soft"
            onClick={() => {
              updateChromaCurve("shift", -0.1);
              updateChromaCurve("power", 1.3);
            }}
          >
            Muted Lights
          </Button>
        </Flex>
      </Flex>

      {/* Reset Button */}
      {hasNonDefaultCurves && (
        <Box pt="2" style={{ borderTop: "1px solid #3f3f46" }}>
          <Button
            variant="soft"
            color="gray"
            style={{ width: "100%" }}
            onClick={resetCurves}
          >
            Reset to Defaults
          </Button>
        </Box>
      )}
    </Flex>
  );
};
