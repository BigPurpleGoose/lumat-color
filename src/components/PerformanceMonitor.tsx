import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Badge, ScrollArea } from "@radix-ui/themes";
import { ActivityLogIcon } from "@radix-ui/react-icons";

interface PerformanceMetric {
  id: string;
  operation: string;
  duration: number;
  timestamp: number;
}

/**
 * Performance Monitor Component
 *
 * Tracks and displays performance metrics for color generation operations
 */
export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for performance events
    const handlePerformanceEvent = (event: CustomEvent) => {
      const metric: PerformanceMetric = {
        id: `metric_${Date.now()}_${Math.random()}`,
        operation: event.detail.operation,
        duration: event.detail.duration,
        timestamp: Date.now(),
      };

      setMetrics((prev) => [...prev.slice(-19), metric]); // Keep last 20
    };

    window.addEventListener(
      "performance-metric" as any,
      handlePerformanceEvent
    );

    return () => {
      window.removeEventListener(
        "performance-metric" as any,
        handlePerformanceEvent
      );
    };
  }, []);

  const getAverageDuration = () => {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  };

  const getOperationStats = () => {
    const stats: Record<string, { count: number; avgDuration: number }> = {};

    metrics.forEach((metric) => {
      if (!stats[metric.operation]) {
        stats[metric.operation] = { count: 0, avgDuration: 0 };
      }
      stats[metric.operation].count++;
    });

    Object.keys(stats).forEach((operation) => {
      const operationMetrics = metrics.filter((m) => m.operation === operation);
      const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
      stats[operation].avgDuration = total / operationMetrics.length;
    });

    return stats;
  };

  const getDurationColor = (duration: number) => {
    if (duration < 5) return "green";
    if (duration < 20) return "yellow";
    return "red";
  };

  if (!isVisible) {
    return (
      <Box
        p="2"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "var(--gray-a2)",
          border: "1px solid var(--gray-a6)",
          borderRadius: "8px",
          cursor: "pointer",
          zIndex: 1000,
        }}
        onClick={() => setIsVisible(true)}
      >
        <Flex align="center" gap="2">
          <ActivityLogIcon />
          <Text size="1" weight="medium">
            Performance
          </Text>
          <Badge color="gray" size="1">
            {metrics.length}
          </Badge>
        </Flex>
      </Box>
    );
  }

  const stats = getOperationStats();

  return (
    <Box
      p="3"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "400px",
        maxHeight: "500px",
        background: "var(--gray-1)",
        border: "1px solid var(--gray-a6)",
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        zIndex: 1000,
      }}
    >
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <ActivityLogIcon />
            <Text size="2" weight="bold">
              Performance Monitor
            </Text>
          </Flex>
          <Text
            size="1"
            style={{ cursor: "pointer" }}
            onClick={() => setIsVisible(false)}
          >
            ✕
          </Text>
        </Flex>

        {/* Summary Stats */}
        <Flex gap="3">
          <Box
            p="2"
            style={{
              flex: 1,
              background: "var(--accent-a2)",
              border: "1px solid var(--accent-a6)",
              borderRadius: "6px",
            }}
          >
            <Text size="1" color="gray" weight="medium">
              Avg Duration
            </Text>
            <Text size="3" weight="bold">
              {getAverageDuration().toFixed(2)}ms
            </Text>
          </Box>
          <Box
            p="2"
            style={{
              flex: 1,
              background: "var(--accent-a2)",
              border: "1px solid var(--accent-a6)",
              borderRadius: "6px",
            }}
          >
            <Text size="1" color="gray" weight="medium">
              Operations
            </Text>
            <Text size="3" weight="bold">
              {metrics.length}
            </Text>
          </Box>
        </Flex>

        {/* Operation Breakdown */}
        <Box>
          <Text size="2" weight="medium" mb="2">
            By Operation
          </Text>
          <Flex direction="column" gap="1">
            {Object.entries(stats).map(([operation, stat]) => (
              <Flex key={operation} justify="between" align="center">
                <Text size="1">{operation}</Text>
                <Flex align="center" gap="2">
                  <Badge color="gray" size="1">
                    {stat.count}×
                  </Badge>
                  <Badge color={getDurationColor(stat.avgDuration)} size="1">
                    {stat.avgDuration.toFixed(1)}ms
                  </Badge>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </Box>

        {/* Recent Metrics */}
        <Box>
          <Text size="2" weight="medium" mb="2">
            Recent Operations
          </Text>
          <ScrollArea style={{ maxHeight: "200px" }}>
            <Flex direction="column" gap="1">
              {metrics
                .slice()
                .reverse()
                .map((metric) => (
                  <Flex key={metric.id} justify="between" align="center">
                    <Text size="1" color="gray">
                      {metric.operation}
                    </Text>
                    <Badge color={getDurationColor(metric.duration)} size="1">
                      {metric.duration.toFixed(2)}ms
                    </Badge>
                  </Flex>
                ))}
            </Flex>
          </ScrollArea>
        </Box>

        {/* Performance Tips */}
        <Box
          p="2"
          style={{
            background: "var(--blue-a2)",
            border: "1px solid var(--blue-a6)",
            borderRadius: "6px",
          }}
        >
          <Text size="1" color="gray">
            💡 <strong>Performance Tips:</strong>
            <br />
            • Green (&lt;5ms): Excellent
            <br />
            • Yellow (5-20ms): Good
            <br />• Red (&gt;20ms): Consider optimization
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

/**
 * Performance tracking utility
 */
export const trackPerformance = (operation: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;

  // Dispatch custom event
  window.dispatchEvent(
    new CustomEvent("performance-metric", {
      detail: { operation, duration },
    })
  );

  return duration;
};

/**
 * Async performance tracking utility
 */
export const trackPerformanceAsync = async <T,>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  // Dispatch custom event
  window.dispatchEvent(
    new CustomEvent("performance-metric", {
      detail: { operation, duration },
    })
  );

  return result;
};
