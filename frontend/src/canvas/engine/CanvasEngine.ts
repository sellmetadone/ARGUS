import {
  createInitialCanvasState,
  type CanvasEngineState,
  type CanvasObject,
  type CanvasTool,
  type CanvasViewport,
} from './types';

/**
 * Lightweight in-memory CanvasEngine.
 * Synchronize entity positions via upsertEntityObject; React Flow remains the renderer for now.
 */
export class CanvasEngine {
  private state: CanvasEngineState;
  private listeners = new Set<(s: CanvasEngineState) => void>();

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

  setTool(tool: CanvasTool) {
    this.state = { ...this.state, tool };
    this.emit();
  }

  setViewport(viewport: Partial<CanvasViewport>) {
    this.state = { ...this.state, viewport: { ...this.state.viewport, ...viewport } };
    this.emit();
  }

  select(ids: string[]) {
    this.state = { ...this.state, selectedIds: [...ids] };
    this.emit();
  }

  upsertEntityObject(entityId: string, x: number, y: number, label?: string) {
    const layerId = this.state.layers[0]?.id || 'layer-default';
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
    this.state = { ...this.state, objects };
    this.emit();
  }

  removeByEntityId(entityId: string) {
    this.state = {
      ...this.state,
      objects: this.state.objects.filter((o) => o.entityId !== entityId),
      selectedIds: this.state.selectedIds.filter((id) => id !== `obj-${entityId}`),
    };
    this.emit();
  }
}

/** Shared singleton for optional integration */
export const canvasEngine = new CanvasEngine();
