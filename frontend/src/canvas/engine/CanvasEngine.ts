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
  type?: string;
  x?: number;
  y?: number;
};

type Listener = () => void;

class CanvasEngine {
  private state: CanvasEngineState = createInitialCanvasState();
  private listeners = new Set<Listener>();
  private history: CanvasEngineState[] = [];
  private future: CanvasEngineState[] = [];
  private maxHistory = 40;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  getState(): CanvasEngineState {
    return this.state;
  }

  private checkpoint() {
    this.history.push(structuredClone(this.state));
    if (this.history.length > this.maxHistory) this.history.shift();
    this.future = [];
  }

  undoCanvas() {
    if (this.history.length === 0) return;
    this.future.push(structuredClone(this.state));
    this.state = this.history.pop()!;
    this.emit();
  }

  redoCanvas() {
    if (this.future.length === 0) return;
    this.history.push(structuredClone(this.state));
    this.state = this.future.pop()!;
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

  addFrame(x: number, y: number, w = 320, h = 220) {
    this.checkpoint();
    const id = `frame_${Date.now()}`;
    const obj: CanvasObject = {
      id,
      kind: 'frame',
      x,
      y,
      w,
      h,
      layerId: DEFAULT_LAYER,
      label: 'Frame',
    };
    this.state = {
      ...this.state,
      objects: [...this.state.objects, obj],
      selectedIds: [id],
    };
    this.emit();
    return id;
  }

  addNote(x: number, y: number, text = 'Sticky') {
    this.checkpoint();
    const id = `note_${Date.now()}`;
    const color = STICKY_PALETTE[Math.floor(Math.random() * STICKY_PALETTE.length)];
    const obj: CanvasObject = {
      id,
      kind: 'note',
      x,
      y,
      w: 180,
      h: 140,
      layerId: DEFAULT_LAYER,
      text,
      fill: color,
    };
    this.state = {
      ...this.state,
      objects: [...this.state.objects, obj],
      selectedIds: [id],
    };
    this.emit();
    return id;
  }

  addText(x: number, y: number, text = 'Text') {
    this.checkpoint();
    const id = `text_${Date.now()}`;
    const obj: CanvasObject = {
      id,
      kind: 'text',
      x,
      y,
      w: 160,
      h: 40,
      layerId: DEFAULT_LAYER,
      text,
    };
    this.state = {
      ...this.state,
      objects: [...this.state.objects, obj],
      selectedIds: [id],
    };
    this.emit();
    return id;
  }

  addShape(x: number, y: number, variant: ShapeVariant = 'rect') {
    this.checkpoint();
    const id = `shape_${Date.now()}`;
    const obj: CanvasObject = {
      id,
      kind: 'shape',
      x,
      y,
      w: 120,
      h: 80,
      layerId: DEFAULT_LAYER,
      shape: variant,
      fill: 'transparent',
      stroke: 'var(--accent)',
    };
    this.state = {
      ...this.state,
      objects: [...this.state.objects, obj],
      selectedIds: [id],
    };
    this.emit();
    return id;
  }

  beginStroke(x: number, y: number, color = '#f97316') {
    this.checkpoint();
    const id = `stroke_${Date.now()}`;
    const obj: CanvasObject = {
      id,
      kind: 'stroke',
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      layerId: DEFAULT_LAYER,
      points: [{ x, y }],
      stroke: color,
      strokeWidth: 2.5,
    };
    this.state = {
      ...this.state,
      objects: [...this.state.objects, obj],
      activeStrokeId: id,
    };
    this.emit();
    return id;
  }

  appendStrokePoint(x: number, y: number) {
    const id = this.state.activeStrokeId;
    if (!id) return;
    this.state = {
      ...this.state,
      objects: this.state.objects.map((o) => {
        if (o.id !== id || o.kind !== 'stroke' || !o.points) return o;
        return { ...o, points: [...o.points, { x, y }] };
      }),
    };
    this.emit();
  }

  endStroke() {
    this.state = { ...this.state, activeStrokeId: null };
    this.emit();
  }

  /** Remove freehand strokes near a point (eraser). */
  eraseNear(x: number, y: number, radius = 18) {
    const next = this.state.objects.filter((o) => {
      if (o.kind !== 'stroke' || !o.points || o.points.length === 0) return true;
      const hit = o.points.some((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        return dx * dx + dy * dy <= radius * radius;
      });
      return !hit;
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
    if (this.state.selectedIds.length === 0) return;
    this.checkpoint();
    const set = new Set(this.state.selectedIds);
    this.state = {
      ...this.state,
      objects: this.state.objects.filter((o) => !set.has(o.id)),
      selectedIds: [],
    };
    this.emit();
  }

  groupSelected() {
    const ids = this.state.selectedIds;
    if (ids.length < 2) return;
    this.checkpoint();
    const groupId = `group_${Date.now()}`;
    const children = this.state.objects.filter((o) => ids.includes(o.id));
    const xs = children.map((c) => c.x);
    const ys = children.map((c) => c.y);
    const x2 = children.map((c) => c.x + (c.w || 0));
    const y2 = children.map((c) => c.y + (c.h || 0));
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...x2);
    const maxY = Math.max(...y2);
    const group: CanvasObject = {
      id: groupId,
      kind: 'group',
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      layerId: DEFAULT_LAYER,
      childIds: ids,
    };
    this.state = {
      ...this.state,
      objects: [...this.state.objects.filter((o) => !ids.includes(o.id)), group],
      selectedIds: [groupId],
    };
    this.emit();
  }

  alignSelected(mode: AlignMode) {
    const ids = this.state.selectedIds;
    if (ids.length < 2) return;
    this.checkpoint();
    const objs = this.state.objects.filter((o) => ids.includes(o.id));
    const minX = Math.min(...objs.map((o) => o.x));
    const maxX = Math.max(...objs.map((o) => o.x + (o.w || 0)));
    const minY = Math.min(...objs.map((o) => o.y));
    const maxY = Math.max(...objs.map((o) => o.y + (o.h || 0)));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    this.state = {
      ...this.state,
      objects: this.state.objects.map((o) => {
        if (!ids.includes(o.id)) return o;
        const w = o.w || 0;
        const h = o.h || 0;
        if (mode === 'left') return { ...o, x: minX };
        if (mode === 'right') return { ...o, x: maxX - w };
        if (mode === 'top') return { ...o, y: minY };
        if (mode === 'bottom') return { ...o, y: maxY - h };
        if (mode === 'center-h') return { ...o, x: midX - w / 2 };
        if (mode === 'center-v') return { ...o, y: midY - h / 2 };
        return o;
      }),
    };
    this.emit();
  }

  moveSelected(dx: number, dy: number) {
    if (this.state.selectedIds.length === 0) return;
    const set = new Set(this.state.selectedIds);
    this.state = {
      ...this.state,
      objects: this.state.objects.map((o) =>
        set.has(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o
      ),
    };
    this.emit();
  }

  updateObject(id: string, patch: Partial<CanvasObject>) {
    this.state = {
      ...this.state,
      objects: this.state.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    };
    this.emit();
  }

  syncEntities(_entities: EntityMirror[]) {
    // optional mirror of graph entities onto canvas — reserved
  }

  getObjectsForRender(): CanvasObject[] {
    return this.state.objects.filter((o) =>
      ['frame', 'note', 'text', 'group', 'shape', 'stroke', 'stamp'].includes(o.kind)
    );
  }
}

export const canvasEngine = new CanvasEngine();
