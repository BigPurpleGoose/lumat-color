/**
 * Undo/Redo History Management
 *
 * Provides comprehensive state history tracking with keyboard shortcuts
 * for safer experimentation and iterative design workflows.
 *
 * Features:
 * - Unlimited undo/redo with configurable max history
 * - Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
 * - State snapshotting with minimal memory footprint
 * - Debounced automatic snapshots
 * - Change descriptions for history UI
 */

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  description: string;
  state: any;
}

export interface HistoryState {
  past: HistorySnapshot[];
  present: HistorySnapshot | null;
  future: HistorySnapshot[];
  maxHistory: number;
  isRecording: boolean;
}

export interface HistoryActions {
  undo: () => void;
  redo: () => void;
  record: (state: any, description: string) => void;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistory: () => HistorySnapshot[];
}

/**
 * History Manager Configuration
 */
export const HISTORY_CONFIG = {
  MAX_HISTORY: 50,
  DEBOUNCE_MS: 300,
  AUTO_SNAPSHOT: true,
  PERSIST_TO_STORAGE: false, // Can enable for localStorage persistence
  STORAGE_KEY: 'lumat_history',
};

/**
 * Create initial history state
 */
export function createInitialHistoryState(): HistoryState {
  return {
    past: [],
    present: null,
    future: [],
    maxHistory: HISTORY_CONFIG.MAX_HISTORY,
    isRecording: true,
  };
}

/**
 * History Manager Class
 *
 * Manages undo/redo state with debouncing and persistence
 */
export class HistoryManager {
  private state: HistoryState;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<(state: HistoryState) => void> = new Set();
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(initialState?: HistoryState) {
    this.state = initialState || createInitialHistoryState();
    this.setupKeyboardShortcuts();
  }

  /**
   * Record a new state snapshot
   */
  record(state: any, description: string, immediate = false): void {
    if (!this.state.isRecording) return;

    const recordFn = () => {
      const snapshot: HistorySnapshot = {
        id: `snapshot_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        description,
        state: this.cloneState(state),
      };

      // Add to history
      this.state.past.push(this.state.present || snapshot);
      this.state.present = snapshot;
      this.state.future = []; // Clear future on new action

      // Trim history if exceeds max
      if (this.state.past.length > this.state.maxHistory) {
        this.state.past = this.state.past.slice(-this.state.maxHistory);
      }

      this.notifyListeners();

      // Persist if enabled
      if (HISTORY_CONFIG.PERSIST_TO_STORAGE) {
        this.persistToStorage();
      }
    };

    if (immediate || !HISTORY_CONFIG.AUTO_SNAPSHOT) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      recordFn();
    } else {
      // Debounce automatic snapshots
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(recordFn, HISTORY_CONFIG.DEBOUNCE_MS);
    }
  }

  /**
   * Undo last action
   */
  undo(): any | null {
    if (!this.canUndo()) return null;

    const previous = this.state.past.pop();
    if (previous && this.state.present) {
      this.state.future.unshift(this.state.present);
      this.state.present = previous;
      this.notifyListeners();
      return previous.state;
    }

    return null;
  }

  /**
   * Redo last undone action
   */
  redo(): any | null {
    if (!this.canRedo()) return null;

    const next = this.state.future.shift();
    if (next && this.state.present) {
      this.state.past.push(this.state.present);
      this.state.present = next;
      this.notifyListeners();
      return next.state;
    }

    return null;
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.state.past.length > 0;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.state.future.length > 0;
  }

  /**
   * Get full history
   */
  getHistory(): HistorySnapshot[] {
    return [
      ...this.state.past,
      ...(this.state.present ? [this.state.present] : []),
      ...this.state.future,
    ];
  }

  /**
   * Get history state
   */
  getState(): HistoryState {
    return this.state;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.state.past = [];
    this.state.future = [];
    this.state.present = null;
    this.notifyListeners();

    if (HISTORY_CONFIG.PERSIST_TO_STORAGE) {
      localStorage.removeItem(HISTORY_CONFIG.STORAGE_KEY);
    }
  }

  /**
   * Pause recording
   */
  pause(): void {
    this.state.isRecording = false;
  }

  /**
   * Resume recording
   */
  resume(): void {
    this.state.isRecording = true;
  }

  /**
   * Subscribe to history changes
   */
  subscribe(listener: (state: HistoryState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    if (typeof window === 'undefined') return;

    this.keyboardHandler = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + Z = Undo
      if (modKey && event.key === 'z' && !event.shiftKey) {
        if (this.canUndo()) {
          event.preventDefault();
          this.undo();
        }
      }

      // Cmd/Ctrl + Shift + Z = Redo
      if (modKey && event.key === 'z' && event.shiftKey) {
        if (this.canRedo()) {
          event.preventDefault();
          this.redo();
        }
      }

      // Cmd/Ctrl + Y = Redo (alternative)
      if (modKey && event.key === 'y') {
        if (this.canRedo()) {
          event.preventDefault();
          this.redo();
        }
      }
    };

    window.addEventListener('keydown', this.keyboardHandler);
  }

  /**
   * Cleanup keyboard shortcuts
   */
  destroy(): void {
    if (this.keyboardHandler) {
      window.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.listeners.clear();
  }

  /**
   * Clone state to prevent mutations
   */
  private cloneState(state: any): any {
    try {
      return JSON.parse(JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to clone state:', error);
      return state;
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Persist to localStorage
   */
  private persistToStorage(): void {
    try {
      const data = {
        past: this.state.past.slice(-10), // Only save last 10
        present: this.state.present,
      };
      localStorage.setItem(HISTORY_CONFIG.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist history:', error);
    }
  }

  /**
   * Load from localStorage
   */
  static loadFromStorage(): HistoryState | null {
    if (!HISTORY_CONFIG.PERSIST_TO_STORAGE) return null;

    try {
      const data = localStorage.getItem(HISTORY_CONFIG.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          past: parsed.past || [],
          present: parsed.present || null,
          future: [],
          maxHistory: HISTORY_CONFIG.MAX_HISTORY,
          isRecording: true,
        };
      }
    } catch (error) {
      console.warn('Failed to load history:', error);
    }

    return null;
  }
}

/**
 * Singleton instance
 */
let historyManager: HistoryManager | null = null;

/**
 * Get or create history manager instance
 */
export function getHistoryManager(): HistoryManager {
  if (!historyManager) {
    const savedState = HistoryManager.loadFromStorage();
    historyManager = new HistoryManager(savedState || undefined);
  }
  return historyManager;
}

/**
 * React hook for undo/redo (optional, for UI integration)
 */
export function useHistory() {
  const manager = getHistoryManager();

  return {
    undo: () => manager.undo(),
    redo: () => manager.redo(),
    canUndo: manager.canUndo(),
    canRedo: manager.canRedo(),
    record: (state: any, description: string) => manager.record(state, description),
    clear: () => manager.clear(),
    history: manager.getHistory(),
  };
}
