import React, { useState } from "react";
import {
  Flex,
  Box,
  Text,
  Button,
  ScrollArea,
  TextField,
  Heading,
} from "@radix-ui/themes";
import {
  PlusIcon,
  TrashIcon,
  GearIcon,
  FileIcon,
  SymbolIcon,
  Share2Icon,
} from "@radix-ui/react-icons";
import { useAppStore } from "../store/useAppStore";
import { ProjectExportDialog } from "./ProjectExportDialog";

interface SidebarProps {
  onOpenProjects: () => void;
  onOpenGlobalSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenProjects,
  onOpenGlobalSettings,
}) => {
  const {
    getCurrentProject,
    activeScaleId,
    setActiveScale,
    addScale,
    removeScale,
    updateScale,
  } = useAppStore();

  const [showProjectExport, setShowProjectExport] = useState(false);

  const project = getCurrentProject();
  const scales = project?.scales || [];

  return (
    <Flex
      direction="column"
      style={{
        width: "256px",
        height: "100%",
      }}
    >
      {/* Header */}
      <Box
        p="4"
        style={{
          borderBottom: "1px solid #3f3f46",
        }}
      >
        <Heading
          size="4"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "white",
          }}
        >
          <SymbolIcon width={20} height={20} color="#6366f1" />
          lumat
        </Heading>
        <Text size="1" color="gray" style={{ marginTop: "0.25rem" }}>
          Color Scale Designer
        </Text>
      </Box>

      {/* Project Selector */}
      <Box
        p="3"
        style={{
          borderBottom: "1px solid #3f3f46",
          backgroundColor: "rgba(24, 24, 27, 0.5)",
        }}
      >
        <Button
          variant="soft"
          color="gray"
          style={{
            width: "100%",
            justifyContent: "flex-start",
            padding: "0.75rem",
          }}
          onClick={onOpenProjects}
        >
          <FileIcon width={16} height={16} />
          <Flex direction="column" align="start" gap="1" style={{ flex: 1 }}>
            <Text size="2" weight="medium">
              {project?.name || "No Project"}
            </Text>
            <Text size="1" color="gray">
              Click to manage projects
            </Text>
          </Flex>
        </Button>
      </Box>

      {/* Scales List */}
      <ScrollArea style={{ flex: 1 }}>
        <Box
          p="2"
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          {scales.map((scale) => (
            <Box
              key={scale.id}
              onClick={() => setActiveScale(scale.id)}
              className="sidebar-scale-item"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.375rem",
                cursor: "pointer",
                backgroundColor:
                  activeScaleId === scale.id ? "#27272a" : "transparent",
                color: activeScaleId === scale.id ? "white" : "#a1a1aa",
                transition: "all 0.2s",
              }}
            >
              <Flex align="center" gap="3">
                <Box
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: `oklch(60% 0.2 ${scale.hue})`,
                  }}
                />
                {activeScaleId === scale.id ? (
                  <TextField.Root
                    size="2"
                    value={scale.name}
                    onChange={(e) =>
                      updateScale(scale.id, "name", e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "6rem",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "white",
                    }}
                  />
                ) : (
                  <Text size="2">{scale.name}</Text>
                )}
              </Flex>
              {scales.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeScale(scale.id);
                  }}
                  style={{
                    opacity: 0,
                    color: "#a1a1aa",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                  }}
                  className="scale-delete-btn"
                >
                  <TrashIcon width={14} height={14} />
                </button>
              )}
            </Box>
          ))}
        </Box>
      </ScrollArea>

      {/* Footer Actions */}
      <Flex
        direction="column"
        gap="2"
        p="4"
        style={{
          borderTop: "1px solid #3f3f46",
        }}
      >
        <Button
          variant="soft"
          color="gray"
          style={{ width: "100%" }}
          onClick={addScale}
        >
          <PlusIcon width={16} height={16} />
          New Scale
        </Button>
        <Button
          variant="soft"
          color="gray"
          style={{ width: "100%" }}
          onClick={() => setShowProjectExport(true)}
          disabled={!project || scales.length === 0}
          title="Export all scales in this project"
        >
          <Share2Icon width={16} height={16} />
          Export All Scales
        </Button>
        <Button
          variant="soft"
          color="gray"
          style={{ width: "100%" }}
          onClick={onOpenGlobalSettings}
          title="Configure global lightness and opacity scales"
        >
          <GearIcon width={16} height={16} />
          Global Settings
        </Button>
      </Flex>

      {/* Project Export Dialog */}
      <ProjectExportDialog
        isOpen={showProjectExport}
        onClose={() => setShowProjectExport(false)}
      />
    </Flex>
  );
};
