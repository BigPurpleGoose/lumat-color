import React from "react";
import { Box, Flex, Text, Button, ScrollArea, Badge } from "@radix-ui/themes";
import { ResetIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useAppStore } from "../store/useAppStore";

/**
 * History Panel Component
 *
 * Displays undo/redo history with visual timeline
 * Shows keyboard shortcuts and action descriptions
 */
export const HistoryPanel: React.FC = () => {
  const { undo, redo, canUndo, canRedo, getHistory, clearHistory } =
    useAppStore();
  const history = getHistory();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box p="4">
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex justify="between" align="center">
          <Text size="2" weight="bold">
            History
          </Text>
          <Flex gap="2">
            <Button
              size="1"
              variant="soft"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              <ResetIcon />
              Clear
            </Button>
          </Flex>
        </Flex>

        {/* Undo/Redo Controls */}
        <Flex gap="2">
          <Button
            size="2"
            variant="surface"
            onClick={undo}
            disabled={!canUndo()}
            style={{ flex: 1 }}
          >
            <ResetIcon />
            Undo
            <Badge ml="2" color="gray">
              ⌘Z
            </Badge>
          </Button>
          <Button
            size="2"
            variant="surface"
            onClick={redo}
            disabled={!canRedo()}
            style={{ flex: 1 }}
          >
            <ReloadIcon />
            Redo
            <Badge ml="2" color="gray">
              ⌘⇧Z
            </Badge>
          </Button>
        </Flex>

        {/* History Timeline */}
        <ScrollArea style={{ maxHeight: "300px" }}>
          {history.length === 0 ? (
            <Text size="2" color="gray">
              No history yet. Make changes to see them here.
            </Text>
          ) : (
            <Flex direction="column" gap="2">
              {history
                .slice()
                .reverse()
                .map((snapshot, index) => (
                  <Box
                    key={snapshot.id}
                    p="2"
                    style={{
                      border: "1px solid var(--gray-a6)",
                      borderRadius: "6px",
                      opacity: index === 0 ? 1 : 0.6,
                    }}
                  >
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">
                        {snapshot.description}
                      </Text>
                      <Text size="1" color="gray">
                        {formatTime(snapshot.timestamp)}
                      </Text>
                    </Flex>
                  </Box>
                ))}
            </Flex>
          )}
        </ScrollArea>

        {/* Tips */}
        <Box
          p="2"
          style={{
            background: "var(--accent-a2)",
            border: "1px solid var(--accent-a6)",
            borderRadius: "6px",
          }}
        >
          <Text size="1" color="gray">
            💡 <strong>Tip:</strong> Use ⌘Z to undo, ⌘⇧Z to redo, or ⌘Y for redo
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};
