import {
  createInitialCanvasState,
  DEFAULT_LAYER,
  type AlignMode,
  type CanvasEngineState,
  type CanvasLayer,
  type CanvasObject,
  type CanvasTool,
  type CanvasViewport,
} from './types';

export type EntityMirror = {
  id: string;
  label?: string;
  x: number;
  y: number;
  locked?: boolean;
};

/**
 * In-memory CanvasEngine — layout mirror + layers + notes/frames/groups + history.
 * React Flow remains the primary graph renderer for entities.
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
      tool: this.state.tool,
      viewport: this.state.viewport,
    };
    this.checkpoint();
    this.emit();
  }

  setTool(tool: CanvasTool) {
    if (this.state.tool === tool) return;
    this.state = { ...this.state, tool };
    this.emit();
  }

  setViewport(viewport: Partial<CanvasViewport>, immediate = false) {
    const next = { ...this.state.viewport, ...viewport };
    const apply = () => {
      this.state = { ...this.state, viewport: next };
      this.emit();
    };
    if (immediate) {
      if (this.viewportRaf) cancelAnimationFrame(this.viewportRaf);
      apply();
      return;
    }
    if (this.viewportRaf) cancelAnimationFrame(this.viewportRaf);
    this.viewportRaf = requestAnimationFrame(apply);
  }

  select(ids: string[]) {
    const same =
      ids.length === this.state.selectedIds.length && ids.every((id, i) => id === this.state.selectedIds[i]);
    if (same) return;
    this.state = { ...this.state, selectedIds: [...ids] };
    this.emit();
  }

  addLayer(name: string): CanvasLayer {
    const layer: CanvasLayer = {
      id: `layer-${Date.now()}`,
      name,
      visible: true,
      locked: false,
      order: this.state.layers.length,
    };
    this.state = { ...this.state, layers: [...this.state.layers, layer] };
    this.checkpoint();
    this.emit();
    return layer;
  }

  setLayerVisible(layerId: string, visible: boolean) {
    this.state = {
      ...this.state,
      layers: this.state.layers.map((l) => (l.id === layerId ? { ...l, visible } : l)),
    };
    this.emit();
  }

  addNote(x: number, y: number, text: string) {
    const layerId = this.state.layers[0]?.id || DEFAULT_LAYER.id;
    const obj: CanvasObject = {
      id: `note-${Date.now()}`,
      kind: 'note',
      layerId,
      x,
      y,
      label: text,
      width: 180,
      height: 80,
    };
    this.state = { ...this.state, objects: [...this.state.objects, obj] };
    this.checkpoint();
    this.emit();
    return obj;
  }

  addText(x: number, y: number, text: string) {
    const layerId = this.state.layers[0]?.id || DEFAULT_LAYER.id;
    const obj: CanvasObject = {
      id: `text-${Date.now()}`,
      kind: 'text',
      layerId,
      x,
      y,
      label: text,
      width: 200,
      height: 32,
    };
    this.state = { ...this.state, objects: [...this.state.objects, obj] };
    this.checkpoint();
    this.emit();
    return obj;
  }

  addFrame(x: number, y: number, width = 320, height = 220, label = 'Frame') {
    const layerId = this.state.layers[0]?.id || DEFAULT_LAYER.id;
    const obj: CanvasObject = {
      id: `frame-${Date.now()}`,
      kind: 'frame',
      layerId,
      x,
      y,
      width,
      height,
      label,
      color: '#526C8C',
    };
    this.state = { ...this.state, objects: [...this.state.objects, obj] };
    this.checkpoint();
    this.emit();
    return obj;
  }

  updateObject(id: string, patch: Partial<CanvasObject>) {
    this.state = {
      ...this.state,
      objects: this.state.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    };
    this.checkpoint();
    this.emit();
  }

  removeObject(id: string) {
    this.state = {
      ...this.state,
      objects: this.state.objects.filter((o) => o.id !== id),
      selectedIds: this.state.selectedIds.filter((sid) => sid !== id),
    };
    this.checkpoint();
    this.emit();
  }

  groupSelected(memberEntityIds: string[], label = 'Group'): CanvasObject | null {
    if (memberEntityIds.length < 2) return null;
    const entities = this.state.objects.filter(
      (o) => o.kind === 'entity' && o.entityId && memberEntityIds.includes(o.entityId)
    );
    if (entities.length < 2) return null;
    const minX = Math.min(...entities.map((e) => e.x));
    const minY = Math.min(...entities.map((e) => e.y));
    const maxX = Math.max(...entities.map((e) => e.x + (e.width || 180)));
    const maxY = Math.max(...entities.map((e) => e.y + (e.height || 72)));
    const layerId = this.state.layers[0]?.id || DEFAULT_LAYER.id;
    const group: CanvasObject = {
      id: `group-${Date.now()}`,
      kind: 'group',
      layerId,
      x: minX - 16,
      y: minY - 28,
      width: maxX - minX + 32,
      height: maxY - minY + 44,
      label,
      memberIds: [...memberEntityIds],
      color: '#64748b',
    };
    this.state = { ...this.state, objects: [...this.state.objects, group] };
    this.checkpoint();
    this.emit();
    return group;
  }

  ungroup(groupId: string) {
    this.state = {
      ...this.state,
      objects: this.state.objects.filter((o) => o.id !== groupId),
      selectedIds: this.state.selectedIds.filter((id) => id !== groupId),
    };
    this.checkpoint();
    this.emit();
  }

  computeAlign(
    items: { id: string; x: number; y: number; width?: number; height?: number }[],
    mode: AlignMode
  ): Record<string, { x: number; y: number }> {
    if (items.length < 2) return {};
    const w = (it: (typeof items)[0]) => it.width ?? 180;
    const h = (it: (typeof items)[0]) => it.height ?? 72;
    const result: Record<string, { x: number; y: number }> = {};

    if (mode === 'left') {
      const v = Math.min(...items.map((i) => i.x));
      items.forEach((i) => {
        result[i.id] = { x: v, y: i.y };
      });
    } else if (mode === 'right') {
      const v = Math.max(...items.map((i) => i.x + w(i)));
      items.forEach((i) => {
        result[i.id] = { x: v - w(i), y: i.y };
      });
    } else if (mode === 'center') {
      const minX = Math.min(...items.map((i) => i.x));
      const maxX = Math.max(...items.map((i) => i.x + w(i)));
      const mid = (minX + maxX) / 2;
      items.forEach((i) => {
        result[i.id] = { x: mid - w(i) / 2, y: i.y };
      });
    } else if (mode === 'top') {
      const v = Math.min(...items.map((i) => i.y));
      items.forEach((i) => {
        result[i.id] = { x: i.x, y: v };
      });
    } else if (mode === 'bottom') {
      const v = Math.max(...items.map((i) => i.y + h(i)));
      items.forEach((i) => {
        result[i.id] = { x: i.x, y: v - h(i) };
      });
    } else if (mode === 'middle') {
      const minY = Math.min(...items.map((i) => i.y));
      const maxY = Math.max(...items.map((i) => i.y + h(i)));
      const mid = (minY + maxY) / 2;
      items.forEach((i) => {
        result[i.id] = { x: i.x, y: mid - h(i) / 2 };
      });
    } else if (mode === 'distribute-h') {
      const sorted = [...items].sort((a, b) => a.x - b.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const span = last.x - first.x;
      const step = span / (sorted.length - 1);
      sorted.forEach((i, idx) => {
        result[i.id] = { x: first.x + step * idx, y: i.y };
      });
    } else if (mode === 'distribute-v') {
      const sorted = [...items].sort((a, b) => a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const span = last.y - first.y;
      const step = span / (sorted.length - 1);
      sorted.forEach((i, idx) => {
        result[i.id] = { x: i.x, y: first.y + step * idx };
      });
    }
    return result;
  }

  syncEntities(entities: EntityMirror[]) {
    const layerId = this.state.layers[0]?.id || DEFAULT_LAYER.id;
    const nonEntity = this.state.objects.filter((o) => o.kind !== 'entity');
    const objects: CanvasObject[] = [
      ...nonEntity,
      ...entities.map((e) => ({
        id: `obj-${e.id}`,
        kind: 'entity' as const,
        entityId: e.id,
        layerId,
        x: e.x,
        y: e.y,
        label: e.label,
        locked: e.locked,
        width: 180,
        height: 72,
      })),
    ];
    this.state = {
      ...this.state,
      objects,
      entityCount: entities.length,
    };
    this.emit();
  }

  upsertEntityObject(entityId: string, x: number, y: number, label?: string) {
    const layerId = this.state.layers[0]?.id || DEFAULT_LAYER.id;
    const existing = this.state.objects.find((o) => o.entityId === entityId);
    let objects: CanvasObject[];
    if (existing) {
      objects = this.state.objects.map((o) =>
        o.entityId === entityId ? { ...o, x, y, label: label ?? o.label } : o
      );
    } else {
      objects = [
        ...this.state.objects,
        {
          id: `obj-${entityId}`,
          kind: 'entity',
          entityId,
          layerId,
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

  getWhiteboardObjects(): CanvasObject[] {
    return this.state.objects.filter((o) => o.kind === 'frame' || o.kind === 'note' || o.kind === 'text' || o.kind === 'group');
  }
}

export const canvasEngine = new CanvasEngine();
