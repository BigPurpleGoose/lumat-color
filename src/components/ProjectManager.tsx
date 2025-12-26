import React, { useState } from "react";
import {
  Dialog,
  Flex,
  Box,
  Button,
  TextField,
  Text,
  Card,
  Badge,
  ScrollArea,
} from "@radix-ui/themes";
import {
  Cross2Icon,
  PlusIcon,
  TrashIcon,
  DownloadIcon,
  UploadIcon,
  FileIcon,
  Share2Icon,
} from "@radix-ui/react-icons";
import { useAppStore } from "../store/useAppStore";
import { Project } from "../types";
import { ProjectExportDialog } from "./ProjectExportDialog";

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    projects,
    currentProjectId,
    createProject,
    loadProject,
    deleteProject,
    updateProjectName,
  } = useAppStore();

  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showProjectExport, setShowProjectExport] = useState(false);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProjectInput(false);
    }
  };

  const handleRenameProject = (projectId: string) => {
    if (editingName.trim()) {
      updateProjectName(projectId, editingName.trim());
      setEditingProjectId(null);
      setEditingName("");
    }
  };

  const handleExportProject = (project: Project) => {
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Use timestamp in filename to ensure uniqueness
    a.download = `${project.name.replace(
      /\s/g,
      "_"
    )}_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportProject = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const project = JSON.parse(
              event.target?.result as string
            ) as Project;
            project.id = Date.now().toString();
            project.createdAt = Date.now();
            project.updatedAt = Date.now();

            useAppStore.setState((state) => {
              // Ensure imported project has global settings
              if (!project.globalSettings) {
                project.globalSettings = { ...state.globalSettings };
              }

              return {
                projects: [...state.projects, project],
                currentProjectId: project.id,
                activeScaleId: project.scales[0]?.id || null,
                // Load the imported project's global settings
                globalSettings: project.globalSettings,
              };
            });
          } catch {
            alert("Failed to import project. Invalid file format.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: "600px" }}>
        <Dialog.Title>Project Manager</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Manage your color scale projects. Create, rename, export, or import
          projects.
        </Dialog.Description>

        {/* Actions */}
        <Flex gap="2" mb="4" wrap="wrap">
          <Button
            onClick={() => setShowNewProjectInput(true)}
            size="2"
            variant="soft"
          >
            <PlusIcon /> New Project
          </Button>
          <Button onClick={handleImportProject} size="2" variant="soft">
            <UploadIcon /> Import
          </Button>
          <Button
            onClick={() => setShowProjectExport(true)}
            size="2"
            variant="soft"
            disabled={!currentProjectId}
          >
            <Share2Icon /> Export All Scales
          </Button>
        </Flex>

        {/* New Project Input */}
        {showNewProjectInput && (
          <Box mb="4">
            <Flex gap="2">
              <TextField.Root
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateProject();
                  if (e.key === "Escape") {
                    setShowNewProjectInput(false);
                    setNewProjectName("");
                  }
                }}
                style={{ flex: 1 }}
                autoFocus
              />
              <Button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                Create
              </Button>
              <Button
                variant="soft"
                color="gray"
                onClick={() => {
                  setShowNewProjectInput(false);
                  setNewProjectName("");
                }}
              >
                Cancel
              </Button>
            </Flex>
          </Box>
        )}

        {/* Projects List */}
        <ScrollArea style={{ height: "400px" }}>
          <Flex direction="column" gap="3">
            {projects.length === 0 ? (
              <Box
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  color: "#71717a",
                }}
              >
                <FileIcon
                  style={{
                    width: "48px",
                    height: "48px",
                    margin: "0 auto 16px",
                    opacity: 0.5,
                  }}
                />
                <Text size="2">
                  No projects yet. Create one to get started!
                </Text>
              </Box>
            ) : (
              projects.map((project) => (
                <Card
                  key={project.id}
                  style={{
                    backgroundColor:
                      project.id === currentProjectId ? "#18181b" : "#09090b",
                    border: `1px solid ${
                      project.id === currentProjectId ? "#6366f1" : "#3f3f46"
                    }`,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (editingProjectId !== project.id) {
                      loadProject(project.id);
                    }
                  }}
                >
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="start">
                      {editingProjectId === project.id ? (
                        <Flex gap="2" style={{ flex: 1 }}>
                          <TextField.Root
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleRenameProject(project.id);
                              if (e.key === "Escape") {
                                setEditingProjectId(null);
                                setEditingName("");
                              }
                            }}
                            style={{ flex: 1 }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            size="1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameProject(project.id);
                            }}
                          >
                            Save
                          </Button>
                        </Flex>
                      ) : (
                        <Flex direction="column" gap="1" style={{ flex: 1 }}>
                          <Flex align="center" gap="2">
                            <Text size="3" weight="bold">
                              {project.name}
                            </Text>
                            {project.id === currentProjectId && (
                              <Badge color="indigo" variant="soft">
                                Active
                              </Badge>
                            )}
                          </Flex>
                          <Text size="1" color="gray">
                            {project.scales.length} scale
                            {project.scales.length !== 1 ? "s" : ""} • Updated{" "}
                            {formatDate(project.updatedAt)}
                          </Text>
                        </Flex>
                      )}

                      {editingProjectId !== project.id && (
                        <Flex gap="1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProjectId(project.id);
                              setEditingName(project.name);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              padding: "4px",
                              cursor: "pointer",
                              color: "#a1a1aa",
                            }}
                            title="Rename"
                          >
                            Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportProject(project);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              padding: "4px",
                              cursor: "pointer",
                              color: "#a1a1aa",
                            }}
                            title="Export"
                          >
                            <DownloadIcon />
                          </button>
                          {projects.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    `Delete project "${project.name}"? This cannot be undone.`
                                  )
                                ) {
                                  deleteProject(project.id);
                                }
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                padding: "4px",
                                cursor: "pointer",
                                color: "#f87171",
                              }}
                              title="Delete"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </Flex>
                      )}
                    </Flex>
                  </Flex>
                </Card>
              ))
            )}
          </Flex>
        </ScrollArea>

        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" onClick={onClose}>
            Close
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

      {/* Project Export Dialog */}
      <ProjectExportDialog
        isOpen={showProjectExport}
        onClose={() => setShowProjectExport(false)}
      />
    </Dialog.Root>
  );
};
