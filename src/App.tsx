import React, { useState } from "react";
import { Flex } from "@radix-ui/themes";
import { Sidebar } from "./components/Sidebar";
import { ScaleView } from "./components/ScaleView";
import { ControlPanel } from "./components/ControlPanel";
import { ProjectManager } from "./components/ProjectManager";
import { GlobalSettingsModal } from "./components/GlobalSettingsModal";
import { AccessibilityToolbar } from "./components/AccessibilityToolbar";
import { useAppStore } from "./store/useAppStore";

function App() {
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);

  const { getActiveScale, updateScale } = useAppStore();
  const activeScale = getActiveScale();

  // Initialize project on first load
  React.useEffect(() => {
    const { currentProjectId, projects, loadProject } = useAppStore.getState();
    if (!currentProjectId && projects.length > 0) {
      loadProject(projects[0].id);
    }
  }, []);

  return (
    <Flex
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        flexWrap: "nowrap",
      }}
    >
      {/* Left Sidebar */}
      <div
        style={{
          width: "256px",
          minWidth: "256px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #3f3f46",
        }}
      >
        <Sidebar
          onOpenProjects={() => setShowProjectManager(true)}
          onOpenGlobalSettings={() => setShowGlobalSettings(true)}
        />
      </div>

      {/* Center Workspace */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Accessibility Toolbar (sticky at top) */}
        <AccessibilityToolbar />

        {/* Main content area */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <ScaleView />
        </div>
      </div>

      {/* Right Control Panel */}
      {activeScale && (
        <div
          style={{
            width: "400px",
            minWidth: "400px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #3f3f46",
            overflow: "hidden",
          }}
        >
          <ControlPanel
            scale={activeScale}
            onUpdate={(k, v) => updateScale(activeScale.id, k, v)}
          />
        </div>
      )}

      <ProjectManager
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
      />
      <GlobalSettingsModal
        isOpen={showGlobalSettings}
        onClose={() => setShowGlobalSettings(false)}
      />
    </Flex>
  );
}

export default App;
