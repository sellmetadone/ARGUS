import {
  createInitialCanvasState,
  DEFAULT_LAYER,
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
 * In-memory CanvasEngine — layout mirror + layers + notes + lightweight history.
 * React Flow remains the primary graph renderer.
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
}

export const canvasEngine = new CanvasEngine();
