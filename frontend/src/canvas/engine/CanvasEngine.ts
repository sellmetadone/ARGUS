import {
  createInitialCanvasState,
  DEFAULT_LAYER,
  type CanvasEngineState,
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
 * In-memory CanvasEngine. React Flow remains the renderer;
 * this class is the single place for viewport / tool / object mirror.
 */
export class CanvasEngine {
  private state: CanvasEngineState;
  private listeners = new Set<(s: CanvasEngineState) => void>();
  private viewportRaf = 0;

  constructor(initial?: CanvasEngineState) {
    this.state = initial || createInitialCanvasState();
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

  /** Switch investigation — clears object mirror for previous case. */
  setCase(caseId: string | null) {
    if (this.state.caseId === caseId) return;
    this.state = {
      ...createInitialCanvasState(caseId),
      tool: this.state.tool,
      viewport: this.state.viewport,
    };
    this.emit();
  }

  setTool(tool: CanvasTool) {
    if (this.state.tool === tool) return;
    this.state = { ...this.state, tool };
    this.emit();
  }

  /** Debounced viewport writes (pan/zoom fire often). */
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

  /** Full replace of entity mirrors for active case (structure sync). */
  syncEntities(entities: EntityMirror[]) {
    const layerId = this.state.layers[0]?.id || DEFAULT_LAYER.id;
    const objects: CanvasObject[] = entities.map((e) => ({
      id: `obj-${e.id}`,
      kind: 'entity' as const,
      entityId: e.id,
      layerId,
      x: e.x,
      y: e.y,
      label: e.label,
      locked: e.locked,
    }));
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
    this.state = { ...this.state, objects, entityCount: objects.filter((o) => o.kind === 'entity').length };
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
