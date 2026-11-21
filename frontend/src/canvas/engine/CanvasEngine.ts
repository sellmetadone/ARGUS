import {
  createInitialCanvasState,
  DEFAULT_LAYER,
  STICKY_PALETTE,
  type AlignMode,
  type CanvasEngineState,
  type CanvasLayer,
  type CanvasObject,
  type CanvasTool,
  type CanvasViewport,
  type ShapeVariant,
} from './types';

export type EntityMirror = {
  id: string;
  label?: string;
  x: number;
  y: number;
  locked?: boolean;
};

/**
 * ARGUS CanvasEngine — single class for board layout, whiteboard objects, history.
 * React Flow remains the entity graph renderer; this engine mirrors layout + board tools.
 */
export class CanvasEngine {
  private state: CanvasEngineState;
  private listeners = new Set<(s: CanvasEngineState) => void>();
  private viewportRaf = 0;
  private history: CanvasEngineState[] = [];
  private historyIndex = -1;

  constructor(initial?: CanvasEngineState) {
    this.state = initial || createInitialCanvasState();
    this.pushHistorySilent();
  }

  getState(): CanvasEngineState {
    return this.state;
  }

  subscribe(fn: (s: CanvasEngineState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snap = this.state;
    this.listeners.forEach((fn) => fn(snap));
  }

  private pushHistorySilent() {
    const snap = JSON.parse(JSON.stringify(this.state)) as CanvasEngineState;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snap);
    if (this.history.length > 40) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  private checkpoint() {
    this.pushHistorySilent();
  }

  undoCanvas() {
    if (this.historyIndex <= 0) return;
    this.historyIndex -= 1;
    this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex])) as CanvasEngineState;
    this.emit();
  }

  redoCanvas() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex += 1;
    this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex])) as CanvasEngineState;
    this.emit();
  }

  setCase(caseId: string | null) {
    if (this.state.caseId === caseId) return;
    this.state = {
      ...createInitialCanvasState(caseId),
      viewport: this.state.viewport,
      tool: this.state.tool,
      drawColor: this.state.drawColor,
      drawWidth: this.state.drawWidth,
      shapeVariant: this.state.shapeVariant,
    };
    this.history = [];
    this.historyIndex = -1;
    this.pushHistorySilent();
    this.emit();
  }

  setTool(tool: CanvasTool) {
    this.state = { ...this.state, tool };
    this.emit();
  }

  setViewport(vp: Partial<CanvasViewport>) {
    this.state = { ...this.state, viewport: { ...this.state.viewport, ...vp } };
    this.emit();
  }

  setDrawStyle(partial: { color?: string; width?: number; shape?: ShapeVariant }) {
    this.state = {
      ...this.state,
      drawColor: partial.color ?? this.state.drawColor,
      drawWidth: partial.width ?? this.state.drawWidth,
      shapeVariant: partial.shape ?? this.state.shapeVariant,
    };
    this.emit();
  }

  addNote(x: number, y: number, text = 'Sticky', color?: string) {
    this.checkpoint();
    const id = `note_${Date.now()}`;
    const obj: CanvasObject = {
      id,
      kind: 'note',
      layerId: DEFAULT_LAYER.id,
      x,
      y,
      width: 180,
      height: 96,
      label: text,
      color: color || STICKY_PALETTE[Math.floor(Math.random() * STICKY_PALETTE.length)],
    };
    this.state = { ...this.state, objects: [...this.state.objects, obj], selectedIds: [id] };
    this.emit();
    return id;
  }

  addText(x: number, y: number, text = 'Text') {
    this.checkpoint();
    const id = `text_${Date.now()}`;
    const obj: CanvasObject = {
      id,
      kind: 'text',
      layerId: DEFAULT_LAYER.id,
      x,
      y,
      width: 200,
      height: 32,
      label: text,
    };
    this.state = { ...this.state, objects: [...this.state.objects, obj], selectedIds: [id] };
    this.emit();
    return id;
  }

  addFrame(x: number, y: number, width = 320, height = 220, label = 'Frame') {
    this.checkpoint();
    const id = `frame_${Date.now()}`;
    const obj: CanvasObject = {
      id,
      kind: 'frame',
      layerId: DEFAULT_LAYER.id,
      x,
      y,
      width,
      height,
      label,
    };
    this.state = { ...this.state, objects: [...this.state.objects, obj], selectedIds: [id] };
    this.emit();
    return id;
  }

  addShape(x: number, y: number, width = 160, height = 100, shape?: ShapeVariant) {
    this.checkpoint();
    const id = `shape_${Date.now()}`;
    const obj: CanvasObject = {
      id,
      kind: 'shape',
      layerId: DEFAULT_LAYER.id,
      x,
      y,
      width,
      height,
      shape: shape || this.state.shapeVariant,
      color: this.state.drawColor,
    };
    this.state = { ...this.state, objects: [...this.state.objects, obj], selectedIds: [id] };
    this.emit();
    return id;
  }

  beginStroke(x: number, y: number) {
    this.checkpoint();
    const id = `stroke_${Date.now()}`;
    const obj: CanvasObject = {
      id,
      kind: 'stroke',
      layerId: DEFAULT_LAYER.id,
      x: 0,
      y: 0,
      points: [{ x, y }],
      color: this.state.drawColor,
      strokeWidth: this.state.drawWidth,
    };
    this.state = { ...this.state, objects: [...this.state.objects, obj], selectedIds: [id] };
    this.emit();
    return id;
  }

  appendStrokePoint(id: string, x: number, y: number) {
    this.state = {
      ...this.state,
      objects: this.state.objects.map((o) =>
        o.id === id && o.kind === 'stroke' && o.points
          ? { ...o, points: [...o.points, { x, y }] }
          : o
      ),
    };
    this.emit();
  }

  endStroke() {
    this.emit();
  }

  eraseNear(x: number, y: number, radius = 18) {
    const r2 = radius * radius;
    const next = this.state.objects.filter((o) => {
      if (o.kind !== 'stroke' || !o.points?.length) return true;
      return !o.points.some((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        return dx * dx + dy * dy <= r2;
      });
    });
    if (next.length === this.state.objects.length) return;
    this.checkpoint();
    this.state = { ...this.state, objects: next };
    this.emit();
  }

  select(ids: string[]) {
    this.state = { ...this.state, selectedIds: ids };
    this.emit();
  }

  clearSelection() {
    this.state = { ...this.state, selectedIds: [] };
    this.emit();
  }

  deleteSelected() {
    if (!this.state.selectedIds.length) return;
    this.checkpoint();
    const set = new Set(this.state.selectedIds);
    this.state = {
      ...this.state,
      objects: this.state.objects.filter((o) => !set.has(o.id) || o.locked),
      selectedIds: [],
    };
    this.emit();
  }

  groupSelected(memberEntityIds: string[], label = 'Group'): CanvasObject | null {
    if (memberEntityIds.length < 2) return null;
    this.checkpoint();
    const entities = memberEntityIds
      .map((id) => this.state.objects.find((o) => o.entityId === id || o.id === id))
      .filter(Boolean) as CanvasObject[];
    const fallback = memberEntityIds.map((id, i) => ({
      id,
      x: 100 + i * 40,
      y: 100 + i * 20,
      width: 180,
      height: 72,
    }));
    const items = entities.length ? entities : fallback;
    const minX = Math.min(...items.map((e) => e.x)) - 16;
    const minY = Math.min(...items.map((e) => e.y)) - 28;
    const maxX = Math.max(...items.map((e) => e.x + (e.width || 180)));
    const maxY = Math.max(...items.map((e) => e.y + (e.height || 72)));
    const id = `group_${Date.now()}`;
    const group: CanvasObject = {
      id,
      kind: 'group',
      layerId: DEFAULT_LAYER.id,
      x: minX,
      y: minY,
      width: maxX - minX + 32,
      height: maxY - minY + 44,
      label,
      memberIds: memberEntityIds,
    };
    this.state = {
      ...this.state,
      objects: [...this.state.objects, group],
      selectedIds: [id],
    };
    this.emit();
    return group;
  }

  computeAlign(
    items: { id: string; x: number; y: number; width?: number; height?: number }[],
    mode: AlignMode
  ): Record<string, { x: number; y: number }> {
    if (items.length < 2) return {};
    const w = (it: (typeof items)[0]) => it.width ?? 180;
    const h = (it: (typeof items)[0]) => it.height ?? 72;
    const minX = Math.min(...items.map((i) => i.x));
    const maxX = Math.max(...items.map((i) => i.x + w(i)));
    const minY = Math.min(...items.map((i) => i.y));
    const maxY = Math.max(...items.map((i) => i.y + h(i)));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const out: Record<string, { x: number; y: number }> = {};
    if (mode === 'distribute-h') {
      const sorted = [...items].sort((a, b) => a.x - b.x);
      const span = maxX - minX - sorted.reduce((s, i) => s + w(i), 0);
      const gap = span / (sorted.length - 1);
      let cursor = minX;
      for (const it of sorted) {
        out[it.id] = { x: cursor, y: it.y };
        cursor += w(it) + gap;
      }
      return out;
    }
    if (mode === 'distribute-v') {
      const sorted = [...items].sort((a, b) => a.y - b.y);
      const span = maxY - minY - sorted.reduce((s, i) => s + h(i), 0);
      const gap = span / (sorted.length - 1);
      let cursor = minY;
      for (const it of sorted) {
        out[it.id] = { x: it.x, y: cursor };
        cursor += h(it) + gap;
      }
      return out;
    }
    for (const it of items) {
      let x = it.x;
      let y = it.y;
      if (mode === 'left') x = minX;
      if (mode === 'right') x = maxX - w(it);
      if (mode === 'center') x = midX - w(it) / 2;
      if (mode === 'top') y = minY;
      if (mode === 'bottom') y = maxY - h(it);
      if (mode === 'middle') y = midY - h(it) / 2;
      out[it.id] = { x, y };
    }
    return out;
  }

  bringToFront(id: string) {
    const idx = this.state.objects.findIndex((o) => o.id === id);
    if (idx < 0) return;
    this.checkpoint();
    const objects = [...this.state.objects];
    const [item] = objects.splice(idx, 1);
    objects.push(item);
    this.state = { ...this.state, objects };
    this.emit();
  }

  sendToBack(id: string) {
    const idx = this.state.objects.findIndex((o) => o.id === id);
    if (idx < 0) return;
    this.checkpoint();
    const objects = [...this.state.objects];
    const [item] = objects.splice(idx, 1);
    objects.unshift(item);
    this.state = { ...this.state, objects };
    this.emit();
  }

  clearWhiteboard() {
    this.checkpoint();
    this.state = {
      ...this.state,
      objects: this.state.objects.filter((o) => o.kind === 'entity'),
      selectedIds: [],
    };
    this.emit();
  }

  exportWhiteboardJSON(): string {
    return JSON.stringify(
      { version: 1, objects: this.getWhiteboardObjects(), layers: this.state.layers },
      null,
      2
    );
  }

  syncEntities(entities: EntityMirror[]) {
    const byId = new Map(entities.map((e) => [e.id, e]));
    let objects = this.state.objects.filter((o) => o.kind !== 'entity' || byId.has(o.entityId || ''));
    for (const e of entities) {
      const existing = objects.find((o) => o.entityId === e.id);
      if (existing) {
        objects = objects.map((o) =>
          o.entityId === e.id
            ? { ...o, x: e.x, y: e.y, label: e.label ?? o.label, locked: e.locked ?? o.locked }
            : o
        );
      } else {
        objects = [
          ...objects,
          {
            id: `obj-${e.id}`,
            kind: 'entity' as const,
            entityId: e.id,
            layerId: DEFAULT_LAYER.id,
            x: e.x,
            y: e.y,
            label: e.label,
            locked: e.locked,
            width: 180,
            height: 72,
          },
        ];
      }
    }
    this.state = {
      ...this.state,
      objects,
      entityCount: objects.filter((o) => o.kind === 'entity').length,
    };
    this.emit();
  }

  upsertEntityObject(entityId: string, x: number, y: number, label?: string) {
    let objects = this.state.objects;
    const existing = objects.find((o) => o.entityId === entityId);
    if (existing) {
      objects = objects.map((o) =>
        o.entityId === entityId ? { ...o, x, y, label: label ?? o.label } : o
      );
    } else {
      objects = [
        ...objects,
        {
          id: `obj-${entityId}`,
          kind: 'entity',
          entityId,
          layerId: DEFAULT_LAYER.id,
          x,
          y,
          label,
          width: 180,
          height: 72,
        },
      ];
    }
    this.state = {
      ...this.state,
      objects,
      entityCount: objects.filter((o) => o.kind === 'entity').length,
    };
    this.emit();
  }

  removeByEntityId(entityId: string) {
    this.state = {
      ...this.state,
      objects: this.state.objects.filter((o) => o.entityId !== entityId),
      selectedIds: this.state.selectedIds.filter((id) => id !== `obj-${entityId}` && id !== entityId),
      entityCount: this.state.objects.filter((o) => o.kind === 'entity' && o.entityId !== entityId).length,
    };
    this.emit();
  }

  getObjectByEntityId(entityId: string): CanvasObject | undefined {
    return this.state.objects.find((o) => o.entityId === entityId);
  }

  /** Duplicate selected board objects (offset). Miro-like Ctrl+D */
  duplicateSelected(ids?: string[]): string[] {
    const sel = ids?.length ? ids : this.state.selectedIds;
    if (!sel.length) return [];
    this.checkpoint();
    const created: string[] = [];
    const clones: CanvasObject[] = [];
    for (const id of sel) {
      const o = this.state.objects.find((x) => x.id === id);
      if (!o || o.kind === 'entity') continue;
      const nid = `${o.kind}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      clones.push({
        ...JSON.parse(JSON.stringify(o)),
        id: nid,
        x: o.x + 24,
        y: o.y + 24,
        locked: false,
      });
      created.push(nid);
    }
    if (!clones.length) return [];
    this.state = {
      ...this.state,
      objects: [...this.state.objects, ...clones],
      selectedIds: created,
    };
    this.emit();
    return created;
  }

  setLocked(ids: string[], locked: boolean) {
    if (!ids.length) return;
    this.checkpoint();
    const set = new Set(ids);
    this.state = {
      ...this.state,
      objects: this.state.objects.map((o) => (set.has(o.id) ? { ...o, locked } : o)),
    };
    this.emit();
  }

  toggleLockSelected() {
    const ids = this.state.selectedIds;
    if (!ids.length) return;
    const anyUnlocked = ids.some((id) => {
      const o = this.state.objects.find((x) => x.id === id);
      return o && !o.locked;
    });
    this.setLocked(ids, anyUnlocked);
  }

  selectAllWhiteboard() {
    const ids = this.getWhiteboardObjects().filter((o) => !o.locked).map((o) => o.id);
    this.state = { ...this.state, selectedIds: ids };
    this.emit();
  }

  getWhiteboardObjects(): CanvasObject[] {
    return this.state.objects.filter((o) =>
      ['frame', 'note', 'text', 'group', 'shape', 'stroke', 'stamp'].includes(o.kind)
    );
  }
}

export const canvasEngine = new CanvasEngine();
