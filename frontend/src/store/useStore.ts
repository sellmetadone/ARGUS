import { create } from 'zustand';
import type { Case, Entity, Relationship, TimelineEvent, EntityType } from '../types';
import { caseRepository } from '../core/storage/caseRepository';
import { getInitialCaseData } from '../core/storage/initState';

const boot = getInitialCaseData();

export type ThemeMode = 'dark' | 'light' | 'amoled';
export type WorkspaceLayout = 'osint' | 'infrastructure' | 'forensics' | 'geosint' | 'custom';
export type CanvasTool = 'select' | 'hand' | 'node' | 'connect' | 'note' | 'text' | 'frame' | 'shape' | 'pen' | 'stamp' | 'eraser';

export interface AppearanceSettings {
  accentColor: string;
  theme: ThemeMode;
  preset: string;
  uiScale: number;
  fontFamily: string;
  borderRadius: number;
  transparency: number;
  animations: boolean;
  language: import('../i18n/locales').LangCode;
  graphBg: string;
  graphDots: string;
  edgeColor: string;
  wallpaper: string;
  wallpaperUrl: string;
  entityColors: Record<string, string>;
}

export interface GraphSettings {
  nodeSize: number;
  edgeStyle: 'smoothstep' | 'bezier' | 'straight' | 'step' | 'simplebezier';
  edgeVariant: 'solid' | 'dashed' | 'animated' | 'thick';
  showLabels: boolean;
  edgeThickness: number;
  autoLayout: boolean;
  visibleTypes: EntityType[];
  enable3d: boolean;
  backgroundVariant: 'dots' | 'lines' | 'cross' | 'none';
  focusMode: boolean;
  layoutPreset: 'force' | 'radial' | 'grid' | 'hierarchy';
  snapToGrid: boolean;
  gridSize: number;
}

export interface PanelVisibility {
  sidebar: boolean;
  rightPanel: boolean;
  timeline: boolean;
  map: boolean;
  search: boolean;
  settings: boolean;
  maltego: boolean;
  tutorial: boolean;
  analytics: boolean;
  evidence: boolean;
  correlation: boolean;
  ai: boolean;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  label: string;
  entities: Entity[];
  relationships: Relationship[];
}

interface AppState {
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
  addTimelineEvent: (e: TimelineEvent) => void;
  updateTimelineEvent: (id: string, data: Partial<TimelineEvent>) => void;
  removeTimelineEvent: (id: string) => void;
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

const ALL_TYPES: EntityType[] = [
  'ip', 'ipv6', 'domain', 'subdomain', 'asn', 'cidr', 'nameserver', 'mx',
  'dns_record', 'certificate', 'certificate_fingerprint', 'url', 'website',
  'technology', 'http_header', 'favicon_hash', 'hosting_provider',
  'coordinates', 'city', 'country', 'geolocation', 'address',
  'person', 'organization', 'company', 'email', 'phone',
  'username', 'social_account', 'wallet', 'hash', 'file', 'document',
  'note', 'evidence',
];

const defaultAppearance: AppearanceSettings = {
  accentColor: '#526C8C',
  theme: 'light',
  preset: 'Argus Light',
  uiScale: 1,
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 6,
  transparency: 1,
  animations: true,
  language: 'ru',
  graphBg: '#FCFCFB',
  graphDots: '#E7E8E5',
  edgeColor: '#94a3b8',
  wallpaper: 'dots',
  wallpaperUrl: '',
  entityColors: {},
};

const defaultGraphSettings: GraphSettings = {
  nodeSize: 1,
  edgeStyle: 'smoothstep',
  edgeVariant: 'solid',
  showLabels: true,
  edgeThickness: 1.5,
  autoLayout: false,
  visibleTypes: ALL_TYPES,
  enable3d: false,
  backgroundVariant: 'dots',
  focusMode: true,
  layoutPreset: 'force',
  snapToGrid: false,
  gridSize: 20,
};

let historyTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleHistory(get: () => AppState, label: string) {
  if (historyTimer) clearTimeout(historyTimer);
  historyTimer = setTimeout(() => {
    historyTimer = null;
    get().pushHistory(label);
  }, 400);
}

function persistActiveCase(get: () => AppState) {
  try {
    const s = get();
    if (!s.activeCaseId) return;
    const c = s.cases.find((x) => x.id === s.activeCaseId);
    if (!c) return;
    caseRepository.save(caseRepository.fromState(c, s.entities, s.relationships, s.timeline));
  } catch (e) {
    console.warn('[Argus] persist failed', e);
  }
}

export const useStore = create<AppState>((set, get) => ({
  cases: boot.cases,
  activeCaseId: boot.activeCaseId,
  setActiveCase: (id) =>
    set({
      activeCaseId: id,
      selectedEntityId: null,
      selectedEntityIds: [],
      selectedRelationshipId: null,
      highlightedPath: [],
      graphSearchQuery: '',
    }),
  addCase: (c) => set((s) => ({ cases: [...s.cases, c] })),
  removeCase: (id) => {
    get().pushHistory(`Remove case ${id}`);
    const removedEntityIds = new Set(get().entities.filter((e) => e.caseId === id).map((e) => e.id));
    set((s) => {
      const cases = s.cases.filter((c) => c.id !== id);
      const activeCaseId = s.activeCaseId === id ? cases[0]?.id ?? null : s.activeCaseId;
      return {
        cases,
        activeCaseId,
        entities: s.entities.filter((e) => e.caseId !== id),
        relationships: s.relationships.filter((r) => r.caseId !== id),
        timeline: s.timeline.filter((ev) => ev.caseId !== id),
        selectedEntityId: null,
        selectedEntityIds: [],
        selectedRelationshipId: null,
        selectedTimelineEventId: null,
        highlightedPath: [],
        pinnedNodeIds: s.pinnedNodeIds.filter((pid) => !removedEntityIds.has(pid)),
      };
    });
    try { caseRepository.remove(id); } catch {}
  },
  renameCase: (id, name) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === id ? { ...c, name, updatedAt: new Date().toISOString() } : c
      ),
    })),
  clearCaseData: (caseId) => {
    get().pushHistory(`Clear case ${caseId}`);
    const removedEntityIds = new Set(get().entities.filter((e) => e.caseId === caseId).map((e) => e.id));
    set((s) => ({
      entities: s.entities.filter((e) => e.caseId !== caseId),
      relationships: s.relationships.filter((r) => r.caseId !== caseId),
      timeline: s.timeline.filter((ev) => ev.caseId !== caseId),
      cases: s.cases.map((c) =>
        c.id === caseId ? { ...c, updatedAt: new Date().toISOString() } : c
      ),
      selectedEntityId: null,
      selectedEntityIds: [],
      selectedRelationshipId: null,
      selectedTimelineEventId: null,
      highlightedPath: [],
      pinnedNodeIds: s.pinnedNodeIds.filter((pid) => !removedEntityIds.has(pid)),
    }));
    persistActiveCase(get);
  },
  entities: boot.entities,
  relationships: boot.relationships,
  selectedEntityId: null,
  selectedEntityIds: [],
  selectedRelationshipId: null,
  setSelectedEntity: (id) =>
    set({
      selectedEntityId: id,
      selectedEntityIds: id ? [id] : [],
      selectedRelationshipId: null,
      panels: { ...get().panels, rightPanel: !!id },
    }),
  setSelectedEntities: (ids) =>
    set({
      selectedEntityIds: ids,
      selectedEntityId: ids[0] ?? null,
      selectedRelationshipId: null,
      panels: { ...get().panels, rightPanel: ids.length === 1 },
    }),
  setSelectedRelationship: (id) =>
    set({
      selectedRelationshipId: id,
      selectedEntityId: null,
      selectedEntityIds: [],
      panels: { ...get().panels, rightPanel: !!id },
    }),
  addEntity: (e) => {
    get().pushHistory(`Add entity ${e.label}`);
    set((s) => ({ entities: [...s.entities, e] }));
  },
  updateEntity: (id, data) => {
    set((s) => ({
      entities: s.entities.map((e) => (e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e)),
    }));
    scheduleHistory(get, `Update entity ${id}`);
  },
  updateEntityPosition: (id, position) => {
    set((s) => ({
      entities: s.entities.map((e) =>
        e.id === id ? { ...e, position, updatedAt: new Date().toISOString() } : e
      ),
    }));
  },
  removeEntity: (id) => {
    get().pushHistory('Remove entity');
    set((s) => ({
      entities: s.entities.filter((e) => e.id !== id),
      relationships: s.relationships.filter((r) => r.sourceId !== id && r.targetId !== id),
      selectedEntityId: s.selectedEntityId === id ? null : s.selectedEntityId,
      selectedEntityIds: s.selectedEntityIds.filter((x) => x !== id),
      pinnedNodeIds: s.pinnedNodeIds.filter((pid) => pid !== id),
      highlightedPath: s.highlightedPath.filter((hid) => hid !== id),
    }));
  },
  addRelationship: (r) => {
    get().pushHistory(`Add relationship ${r.type}`);
    set((s) => ({ relationships: [...s.relationships, r] }));
  },
  updateRelationship: (id, data) => {
    set((s) => ({
      relationships: s.relationships.map((r) =>
        r.id === id
          ? {
              ...r,
              ...data,
              properties: data.properties ? { ...r.properties, ...data.properties } : r.properties,
              updatedAt: new Date().toISOString(),
            }
          : r
      ),
    }));
    scheduleHistory(get, `Update relationship ${id}`);
  },
  removeRelationship: (id) => {
    get().pushHistory('Remove relationship');
    set((s) => ({
      relationships: s.relationships.filter((r) => r.id !== id),
      selectedRelationshipId: s.selectedRelationshipId === id ? null : s.selectedRelationshipId,
    }));
  },
  pinnedNodeIds: [],
  togglePinNode: (id) =>
    set((s) => ({
      pinnedNodeIds: s.pinnedNodeIds.includes(id)
        ? s.pinnedNodeIds.filter((x) => x !== id)
        : [...s.pinnedNodeIds, id],
    })),
  typeFilters: ALL_TYPES,
  setTypeFilters: (types) => set({ typeFilters: types }),
  graphSearchQuery: '',
  setGraphSearchQuery: (q) => set({ graphSearchQuery: q }),
  highlightedPath: [],
  setHighlightedPath: (path) => set({ highlightedPath: path }),
  expandNode: (id) => {
    const rels = get().relationships.filter((r) => r.sourceId === id || r.targetId === id);
    const neighborIds = rels.map((r) => (r.sourceId === id ? r.targetId : r.sourceId));
    set({ highlightedPath: [id, ...neighborIds], selectedEntityId: id, selectedEntityIds: [id] });
  },
  timeline: boot.timeline || [],
  addTimelineEvent: (e) => set((s) => ({ timeline: [...s.timeline, e] })),
  updateTimelineEvent: (id, data) =>
    set((s) => ({
      timeline: s.timeline.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  removeTimelineEvent: (id) =>
    set((s) => ({ timeline: s.timeline.filter((t) => t.id !== id) })),
  selectedTimelineEventId: null,
  setSelectedTimelineEvent: (id) => set({ selectedTimelineEventId: id }),
  history: [],
  historyIndex: -1,
  pushHistory: (label) => {
    const s = get();
    const entry: HistoryEntry = {
      id: `h-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      entities: JSON.parse(JSON.stringify(s.entities)),
      relationships: JSON.parse(JSON.stringify(s.relationships)),
    };
    const history = s.history.slice(0, s.historyIndex + 1).concat(entry).slice(-50);
    set({ history, historyIndex: history.length - 1 });
  },
  undo: () => {
    const s = get();
    if (s.historyIndex <= 0) return;
    const i = s.historyIndex - 1;
    const h = s.history[i];
    set({ entities: h.entities, relationships: h.relationships, historyIndex: i });
  },
  redo: () => {
    const s = get();
    if (s.historyIndex >= s.history.length - 1) return;
    const i = s.historyIndex + 1;
    const h = s.history[i];
    set({ entities: h.entities, relationships: h.relationships, historyIndex: i });
  },
  appearance: { ...defaultAppearance, ...(boot as { appearance?: AppearanceSettings }).appearance },
  setAppearance: (partial) => set((s) => ({ appearance: { ...s.appearance, ...partial } })),
  graphSettings: { ...defaultGraphSettings },
  setGraphSettings: (partial) => set((s) => ({ graphSettings: { ...s.graphSettings, ...partial } })),
  workspace: 'osint',
  setWorkspace: (w) => set({ workspace: w }),
  panels: {
    sidebar: true,
    rightPanel: false,
    timeline: false,
    map: false,
    search: false,
    settings: false,
    maltego: false,
    tutorial: false,
    analytics: false,
    evidence: false,
    correlation: false,
    ai: false,
  },
  setPanel: (key, value) => set((s) => ({ panels: { ...s.panels, [key]: value } })),
  togglePanel: (key) => set((s) => ({ panels: { ...s.panels, [key]: !s.panels[key] } })),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  showWelcome: true,
  setShowWelcome: (v) => set({ showWelcome: v }),
  canvasTool: 'select',
  setCanvasTool: (t) => set({ canvasTool: t }),
  shodanApiKey: '',
  setShodanApiKey: (k) => set({ shodanApiKey: k }),
  webSearchQuery: '',
  setWebSearchQuery: (q) => set({ webSearchQuery: q }),
  webSearchHistory: [],
  addWebSearchHistory: (q) =>
    set((s) => ({
      webSearchHistory: [q, ...s.webSearchHistory.filter((x) => x !== q)].slice(0, 20),
    })),
  getEntitiesForCase: (caseId) => get().entities.filter((e) => e.caseId === caseId),
  getRelationshipsForCase: (caseId) => get().relationships.filter((r) => r.caseId === caseId),
  getTimelineForCase: (caseId) => get().timeline.filter((t) => t.caseId === caseId),
  findPaths: (fromId, toId) => {
    const rels = get().relationships;
    const paths: string[][] = [];
    const dfs = (cur: string, target: string, path: string[], seen: Set<string>) => {
      if (path.length > 6) return;
      if (cur === target && path.length > 1) {
        paths.push([...path]);
        return;
      }
      for (const r of rels) {
        const next = r.sourceId === cur ? r.targetId : r.targetId === cur ? r.sourceId : null;
        if (next && !seen.has(next)) {
          seen.add(next);
          path.push(next);
          dfs(next, target, path, seen);
          path.pop();
          seen.delete(next);
        }
      }
    };
    dfs(fromId, toId, [fromId], new Set([fromId]));
    return paths.slice(0, 20);
  },
  exportGraph: (format) => {
    const s = get();
    const entities = s.activeCaseId ? s.entities.filter((e) => e.caseId === s.activeCaseId) : s.entities;
    const relationships = s.activeCaseId
      ? s.relationships.filter((r) => r.caseId === s.activeCaseId)
      : s.relationships;
    if (format === 'json') return JSON.stringify({ entities, relationships }, null, 2);
    if (format === 'csv') {
      const rows = ['id,type,label', ...entities.map((e) => `${e.id},${e.type},"${(e.label || '').replace(/"/g, '""')}"`)];
      return rows.join('\n');
    }
    return `<?xml version="1.0"?><graphml><graph>${entities.map((e) => `<node id="${e.id}"/>`).join('')}${relationships.map((r) => `<edge source="${r.sourceId}" target="${r.targetId}"/>`).join('')}</graph></graphml>`;
  },
  importGraph: (json) => {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data.entities) || !Array.isArray(data.relationships)) return;
      get().pushHistory('Import graph');
      set((s) => ({
        entities: [...s.entities, ...data.entities],
        relationships: [...s.relationships, ...data.relationships],
      }));
    } catch (e) {
      console.warn('[Argus] import failed', e);
    }
  },
}));
