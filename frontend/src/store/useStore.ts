import { create } from 'zustand';
import type { Case, Entity, Relationship, TimelineEvent, EntityType } from '../types';
import { caseRepository } from '../core/storage/caseRepository';
import { getInitialCaseData } from '../core/storage/initState';

const boot = getInitialCaseData();

export type ThemeMode = 'dark' | 'light' | 'amoled';
export type WorkspaceLayout = 'osint' | 'infrastructure' | 'forensics' | 'geosint' | 'custom';
export type CanvasTool = 'select' | 'hand' | 'node' | 'connect' | 'note' | 'text' | 'frame';

export interface AppearanceSettings {
  accentColor: string;
  theme: ThemeMode;
  preset: string;
  uiScale: number;
  fontFamily: string;
  borderRadius: number;
  transparency: number;
  animations: boolean;
  language: string;
  graphBg: string;
  graphDots: string;
  edgeColor: string;
  wallpaper: string;
  wallpaperUrl: string;
  entityColors: Partial<Record<EntityType, string>>;
}

export interface GraphSettings {
  nodeSize: number;
  edgeStyle: string;
  edgeVariant: string;
  showLabels: boolean;
  edgeThickness: number;
  autoLayout: boolean;
  visibleTypes: EntityType[];
  enable3d: boolean;
  backgroundVariant: string;
  focusMode: boolean;
  layoutPreset: string;
  snapToGrid: boolean;
  gridSize: number;
}

export interface PanelVisibility {
  leftPanel: boolean;
  rightPanel: boolean;
  bottomPanel: boolean;
  map: boolean;
  timeline: boolean;
  analytics: boolean;
  evidence: boolean;
  correlation: boolean;
  ai: boolean;
  settings: boolean;
  search: boolean;
  tutorial: boolean;
  maltego: boolean;
}

export interface HistoryEntry {
  label: string;
  timestamp: number;
}

export interface AppState {
  cases: Case[];
  activeCaseId: string | null;
  setActiveCase: (id: string | null) => void;
  addCase: (c: Case) => void;
  removeCase: (id: string) => void;
  renameCase: (id: string, name: string) => void;
  clearCaseData: (caseId: string) => void;
  entities: Entity[];
  relationships: Relationship[];
  selectedEntityId: string | null;
  selectedEntityIds: string[];
  setSelectedEntities: (ids: string[]) => void;
  selectedRelationshipId: string | null;
  setSelectedEntity: (id: string | null) => void;
  setSelectedRelationship: (id: string | null) => void;
  addEntity: (e: Entity) => void;
  updateEntity: (id: string, data: Partial<Entity>) => void;
  removeEntity: (id: string) => void;
  updateEntityPosition: (id: string, position: { x: number; y: number }) => void;
  addRelationship: (r: Relationship) => void;
  updateRelationship: (id: string, data: Partial<Relationship>) => void;
  removeRelationship: (id: string) => void;
  pinnedNodeIds: string[];
  togglePinNode: (id: string) => void;
  typeFilters: EntityType[];
  setTypeFilters: (types: EntityType[]) => void;
  graphSearchQuery: string;
  setGraphSearchQuery: (q: string) => void;
  highlightedPath: string[];
  setHighlightedPath: (path: string[]) => void;
  expandNode: (id: string) => void;
  timeline: TimelineEvent[];
  selectedTimelineEventId: string | null;
  setSelectedTimelineEvent: (id: string | null) => void;
  history: HistoryEntry[];
  historyIndex: number;
  pushHistory: (label: string) => void;
  undo: () => void;
  redo: () => void;
  appearance: AppearanceSettings;
  setAppearance: (partial: Partial<AppearanceSettings>) => void;
  graphSettings: GraphSettings;
  setGraphSettings: (partial: Partial<GraphSettings>) => void;
  workspace: WorkspaceLayout;
  setWorkspace: (w: WorkspaceLayout) => void;
  panels: PanelVisibility;
  setPanel: (key: keyof PanelVisibility, value: boolean) => void;
  togglePanel: (key: keyof PanelVisibility) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  showWelcome: boolean;
  setShowWelcome: (v: boolean) => void;
  canvasTool: CanvasTool;
  setCanvasTool: (t: CanvasTool) => void;
  shodanApiKey: string;
  setShodanApiKey: (k: string) => void;
  webSearchQuery: string;
  setWebSearchQuery: (q: string) => void;
  webSearchHistory: string[];
  addWebSearchHistory: (q: string) => void;
  getEntitiesForCase: (caseId: string) => Entity[];
  getRelationshipsForCase: (caseId: string) => Relationship[];
  getTimelineForCase: (caseId: string) => TimelineEvent[];
  findPaths: (fromId: string, toId: string) => string[][];
  exportGraph: (format: 'json' | 'csv' | 'graphml') => string;
  importGraph: (json: string) => void;
}

// NOTE: Full implementation is in the repository ZIP artifact ARGUS-whiteboard-mit.zip
// This stub should not ship — if you see this, restore from ZIP.
export const useStore = create<AppState>(() => ({} as AppState));
