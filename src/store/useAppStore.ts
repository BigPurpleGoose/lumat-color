import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, ColorScale, GlobalSettings, ViewMode, AccessibilitySettings } from '../types';
import { DEFAULT_GLOBAL_SETTINGS, DEFAULT_ACCESSIBILITY_SETTINGS } from '../utils/constants';
import { getHistoryManager } from '../utils/historyManager';
import type { HistorySnapshot } from '../utils/historyManager';

// Migration helper for backward compatibility (luma-app to lumat)
const migrateScale = (scale: any): ColorScale => ({
  ...scale,
  hueCurve: scale.hueCurve || { shift: 0, power: 1 },
  chromaCurve: scale.chromaCurve || { shift: 0, power: 1 },
  contrastMode: scale.contrastMode || 'standard',
  targetBackground: scale.targetBackground || 'white',
  apcaTolerance: scale.apcaTolerance ?? 1.5,
  // New fields with defaults
  contrastThreshold: scale.contrastThreshold || undefined,
  customLightnessSteps: scale.customLightnessSteps || undefined,
  grayscaleProfile: scale.grayscaleProfile || undefined, // New grayscale profile support
});

const migrateProject = (project: any): Project => ({
  ...project,
  scales: project.scales.map(migrateScale),
  globalSettings: project.globalSettings || undefined  // Preserve saved settings or set undefined for old projects
});

interface AppState {
  // Project Management
  projects: Project[];
  currentProjectId: string | null;

  // Global Settings
  globalSettings: GlobalSettings;
  accessibilitySettings: AccessibilitySettings;

  // Current Working State
  activeScaleId: string | null;
  viewMode: ViewMode;
  selectedBackground: string;  // Hex color for testing

  // Project Actions
  createProject: (name: string) => void;
  loadProject: (projectId: string) => void;
  saveCurrentProject: () => void;
  deleteProject: (projectId: string) => void;
  updateProjectName: (projectId: string, name: string) => void;
  importProject: (projectData: any) => { success: boolean; message: string };

  // Scale Actions
  addScale: () => void;
  removeScale: (scaleId: string) => void;
  updateScale: (scaleId: string, key: keyof ColorScale, value: any) => void;
  setActiveScale: (scaleId: string) => void;

  // Global Settings Actions
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  resetGlobalSettings: () => void;

  // Accessibility Settings Actions
  updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => void;
  resetAccessibilitySettings: () => void;

  // View Actions
  setViewMode: (mode: ViewMode) => void;
  setSelectedBackground: (color: string) => void;

  // Getters
  getCurrentProject: () => Project | null;
  getActiveScale: () => ColorScale | null;
  getLightnessSteps: (scale?: ColorScale) => number[];

  // History Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistory: () => HistorySnapshot[];
  clearHistory: () => void;
}

const createDefaultProject = (): Project => {
  const projectId = Date.now().toString();
  return {
    id: projectId,
    name: 'New Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    scales: [
      {
        id: '1',
        name: 'Cobalt',
        hue: 280,
        manualChroma: 0.21,
        hueCurve: { shift: 10, power: 1.4 },
        chromaCurve: { shift: 0, power: 1 },
        contrastMode: 'standard',
        targetBackground: 'black',
        apcaTolerance: 1.5,
      }
    ],
    globalSettings: { ...DEFAULT_GLOBAL_SETTINGS }  // Include default global settings
  };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const defaultProject = createDefaultProject();
      const historyManager = getHistoryManager();

      // Record state changes to history
      const recordHistory = (description: string) => {
        const state = get();
        historyManager.record({
          projects: state.projects,
          currentProjectId: state.currentProjectId,
          activeScaleId: state.activeScaleId,
        }, description);
      };

      return {
        // Initial State
        projects: [defaultProject],
        currentProjectId: defaultProject.id,
        activeScaleId: '1',
        viewMode: 'swatch',
        globalSettings: DEFAULT_GLOBAL_SETTINGS,
        accessibilitySettings: DEFAULT_ACCESSIBILITY_SETTINGS,
        selectedBackground: '#ffffff',

        // Project Actions
        createProject: (name: string) => {
        const newProject: Project = {
          id: Date.now().toString(),
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          scales: [
            {
              id: Date.now().toString(),
              name: 'Blue',
              hue: 260,
              manualChroma: 0.25,
              hueCurve: { shift: 0, power: 1 },
              chromaCurve: { shift: 0, power: 1 },
              contrastMode: 'standard',
              targetBackground: 'black',
              apcaTolerance: 1.5,
            }
          ],
          globalSettings: { ...get().globalSettings }  // Snapshot current global settings
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          currentProjectId: newProject.id,
          activeScaleId: newProject.scales[0].id
        }));

        recordHistory(`Created project: ${name}`);
      },

      loadProject: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        if (project) {
          set({
            currentProjectId: projectId,
            activeScaleId: project.scales[0]?.id || null,
            // Restore project's global settings if they exist (otherwise keep current global settings)
            globalSettings: project.globalSettings || get().globalSettings
          });
        }
      },

      saveCurrentProject: () => {
        const { currentProjectId, globalSettings } = get();
        if (currentProjectId) {
          set((state) => ({
            projects: state.projects.map(p =>
              p.id === currentProjectId
                ? { ...p, updatedAt: Date.now(), globalSettings: { ...globalSettings } }
                : p
            )
          }));
        }
      },

      deleteProject: (projectId: string) => {
        set((state) => {
          const newProjects = state.projects.filter(p => p.id !== projectId);
          const newCurrentId = state.currentProjectId === projectId
            ? (newProjects[0]?.id || null)
            : state.currentProjectId;

          return {
            projects: newProjects,
            currentProjectId: newCurrentId,
            activeScaleId: newProjects[0]?.scales[0]?.id || null
          };
        });
      },

      updateProjectName: (projectId: string, name: string) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === projectId ? { ...p, name, updatedAt: Date.now() } : p
          )
        }));
      },

      // Scale Actions
      addScale: () => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;

        const newScale: ColorScale = {
          id: Date.now().toString(),
          name: 'New Scale',
          hue: Math.floor(Math.random() * 360),
          manualChroma: 0.3,
          hueCurve: { shift: 0, power: 1 },
          chromaCurve: { shift: 0, power: 1 },
          contrastMode: 'standard',
          targetBackground: 'white',
          apcaTolerance: 1.5,
        };

        set((state) => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? { ...p, scales: [...p.scales, newScale], updatedAt: Date.now(), globalSettings: { ...state.globalSettings } }
              : p
          ),
          activeScaleId: newScale.id
        }));

        recordHistory(`Added scale: ${newScale.name}`);
      },

      removeScale: (scaleId: string) => {
        const { currentProjectId, activeScaleId } = get();
        if (!currentProjectId) return;

        set((state) => {
          const project = state.projects.find(p => p.id === currentProjectId);
          if (!project || project.scales.length === 1) return state;

          const newScales = project.scales.filter(s => s.id !== scaleId);
          const newActiveId = activeScaleId === scaleId ? newScales[0].id : activeScaleId;

          return {
            projects: state.projects.map(p =>
              p.id === currentProjectId
                ? { ...p, scales: newScales, updatedAt: Date.now(), globalSettings: { ...state.globalSettings } }
                : p
            ),
            activeScaleId: newActiveId
          };
        });
      },

      updateScale: (scaleId: string, key: keyof ColorScale, value: any) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;

        set((state) => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? {
                  ...p,
                  scales: p.scales.map(s =>
                    s.id === scaleId ? { ...s, [key]: value } : s
                  ),
                  updatedAt: Date.now(),
                  globalSettings: { ...state.globalSettings }  // Snapshot global settings on any scale update
                }
              : p
          )
        }));

        recordHistory(`Updated ${key}`);
      },

      setActiveScale: (scaleId: string) => {
        set({ activeScaleId: scaleId });
      },

      // View Actions
      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
      },

      setSelectedBackground: (color: string) => {
        set({ selectedBackground: color });
      },

      // Global Settings Actions
      updateGlobalSettings: (settings: Partial<GlobalSettings>) => {
        const { currentProjectId } = get();
        set((state) => {
          const newGlobalSettings = { ...state.globalSettings, ...settings };
          return {
            globalSettings: newGlobalSettings,
            // Also update the current project's settings snapshot
            projects: currentProjectId
              ? state.projects.map(p =>
                  p.id === currentProjectId
                    ? { ...p, globalSettings: { ...newGlobalSettings }, updatedAt: Date.now() }
                    : p
                )
              : state.projects
          };
        });
      },

      resetGlobalSettings: () => {
        const { currentProjectId } = get();
        set((state) => ({
          globalSettings: DEFAULT_GLOBAL_SETTINGS,
          // Also update the current project's settings snapshot
          projects: currentProjectId
            ? state.projects.map(p =>
                p.id === currentProjectId
                  ? { ...p, globalSettings: { ...DEFAULT_GLOBAL_SETTINGS }, updatedAt: Date.now() }
                  : p
              )
            : state.projects
        }));
      },

      // Accessibility Settings Actions
      updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => {
        set((state) => ({
          accessibilitySettings: {
            ...state.accessibilitySettings,
            ...settings
          }
        }));
      },

      resetAccessibilitySettings: () => {
        set({ accessibilitySettings: DEFAULT_ACCESSIBILITY_SETTINGS });
      },

      // Import Project (for migration from luma-app)
      importProject: (projectData: any) => {
        try {
          const migratedProject = migrateProject(projectData);
          migratedProject.id = Date.now().toString(); // New ID to avoid conflicts
          migratedProject.name = `${migratedProject.name} (Imported)`;
          // Ensure imported project has global settings (use current if not in import)
          if (!migratedProject.globalSettings) {
            migratedProject.globalSettings = { ...get().globalSettings };
          }

          set((state) => ({
            projects: [...state.projects, migratedProject],
            currentProjectId: migratedProject.id,
            activeScaleId: migratedProject.scales[0]?.id || null,
            // Load the imported project's global settings
            globalSettings: migratedProject.globalSettings
          }));

          return { success: true, message: 'Project imported successfully' };
        } catch (error) {
          return { success: false, message: `Import failed: ${error}` };
        }
      },

      // Getters
      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find(p => p.id === currentProjectId) || projects[0] || null;
      },

      getActiveScale: () => {
        const project = get().getCurrentProject();
        const { activeScaleId } = get();
        return project?.scales.find(s => s.id === activeScaleId) || null;
      },

      getLightnessSteps: (scale?: ColorScale) => {
        const { globalSettings } = get();
        const activeScale = scale || get().getActiveScale();

        // If scale has custom steps and overrides are allowed, use them
        if (activeScale?.customLightnessSteps && globalSettings.allowPerScaleOverride) {
          return activeScale.customLightnessSteps;
        }

        // Otherwise use global steps
        return globalSettings.lightnessSteps;
      },

      // History Actions
      undo: () => {
        const previousState = historyManager.undo();
        if (previousState) {
          set({
            projects: previousState.projects,
            currentProjectId: previousState.currentProjectId,
            activeScaleId: previousState.activeScaleId,
          });
        }
      },

      redo: () => {
        const nextState = historyManager.redo();
        if (nextState) {
          set({
            projects: nextState.projects,
            currentProjectId: nextState.currentProjectId,
            activeScaleId: nextState.activeScaleId,
          });
        }
      },

      canUndo: () => historyManager.canUndo(),
      canRedo: () => historyManager.canRedo(),
      getHistory: () => historyManager.getHistory(),
      clearHistory: () => historyManager.clear(),
    };
  },
    {
      name: 'lumat-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        activeScaleId: state.activeScaleId,
        viewMode: state.viewMode,
        globalSettings: state.globalSettings,
        selectedBackground: state.selectedBackground,
      }),
      // Migrate old data on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.projects = state.projects.map(migrateProject);
          // Ensure global settings exist (for migration from luma-app)
          if (!state.globalSettings) {
            state.globalSettings = DEFAULT_GLOBAL_SETTINGS;
          }
          // Fix missing currentProjectId (auto-load first project)
          if (!state.currentProjectId && state.projects.length > 0) {
            state.currentProjectId = state.projects[0].id;
            state.activeScaleId = state.projects[0].scales[0]?.id || null;
          }
        }
      }
    }
  )
);
