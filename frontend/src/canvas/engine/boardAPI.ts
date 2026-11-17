/**
 * Board drawing API for ARGUS (MIT).
 * Unique implementation of whiteboard-class tools for investigations.
 */
import { canvasEngine, CanvasEngine } from './CanvasEngine';
import type { CanvasObject, ShapeVariant } from './types';
import { DEFAULT_LAYER, STICKY_PALETTE } from './types';

type Eng = CanvasEngine & {
  state: ReturnType<CanvasEngine['getState']> & {
    drawColor?: string;
    drawWidth?: number;
    shapeVariant?: ShapeVariant;
  };
  checkpoint: () => void;
  emit: () => void;
};

const asEng = (self: CanvasEngine) => self as unknown as Eng;

CanvasEngine.prototype.setDrawStyle = function (
  this: CanvasEngine,
  partial: { color?: string; width?: number; shape?: ShapeVariant }
) {
  const e = asEng(this);
  const s = e.state;
  e.state = {
    ...s,
    drawColor: partial.color ?? s.drawColor ?? '#526C8C',
    drawWidth: partial.width ?? s.drawWidth ?? 2.5,
    shapeVariant: partial.shape ?? s.shapeVariant ?? 'rect',
  };
  e.emit();
};

CanvasEngine.prototype.addShape = function (
  this: CanvasEngine,
  x: number,
  y: number,
  width = 160,
  height = 100,
  shape?: ShapeVariant,
  label = ''
) {
  const e = asEng(this);
  const s = e.state;
  const obj: CanvasObject = {
    id: `shape-${Date.now()}`,
    kind: 'shape',
    layerId: s.layers[0]?.id || DEFAULT_LAYER.id,
    x,
    y,
    width,
    height,
    shape: shape || s.shapeVariant || 'rect',
    label,
    color: s.drawColor || '#526C8C',
    opacity: 0.92,
  };
  e.state = { ...s, objects: [...s.objects, obj] };
  e.checkpoint();
  e.emit();
  return obj;
};

CanvasEngine.prototype.addStamp = function (this: CanvasEngine, x: number, y: number, label: string) {
  const e = asEng(this);
  const s = e.state;
  const obj: CanvasObject = {
    id: `stamp-${Date.now()}`,
    kind: 'stamp',
    layerId: s.layers[0]?.id || DEFAULT_LAYER.id,
    x,
    y,
    width: 120,
    height: 36,
    label,
    color: s.drawColor || '#526C8C',
  };
  e.state = { ...s, objects: [...s.objects, obj] };
  e.checkpoint();
  e.emit();
  return obj;
};

CanvasEngine.prototype.beginStroke = function (this: CanvasEngine, x: number, y: number) {
  const e = asEng(this);
  const s = e.state;
  const id = `stroke-${Date.now()}`;
  const obj: CanvasObject = {
    id,
    kind: 'stroke',
    layerId: s.layers[0]?.id || DEFAULT_LAYER.id,
    x,
    y,
    points: [{ x, y }],
    color: s.drawColor || '#526C8C',
    strokeWidth: s.drawWidth || 2.5,
  };
  e.state = { ...s, objects: [...s.objects, obj] };
  e.emit();
  return id;
};

CanvasEngine.prototype.appendStrokePoint = function (this: CanvasEngine, id: string, x: number, y: number) {
  const e = asEng(this);
  const s = e.state;
  e.state = {
    ...s,
    objects: s.objects.map((o) => {
      if (o.id !== id || o.kind !== 'stroke' || !o.points) return o;
      const last = o.points[o.points.length - 1];
      if (last && Math.hypot(last.x - x, last.y - y) < 1.5) return o;
      return { ...o, points: [...o.points, { x, y }] };
    }),
  };
  e.emit();
};

CanvasEngine.prototype.endStroke = function (this: CanvasEngine, id: string) {
  const e = asEng(this);
  const o = e.state.objects.find((x) => x.id === id);
  if (!o || !o.points || o.points.length < 2) {
    this.removeObject(id);
    return;
  }
  e.checkpoint();
  e.emit();
};

CanvasEngine.prototype.clearWhiteboard = function (this: CanvasEngine) {
  const e = asEng(this);
  const s = e.state;
  e.state = {
    ...s,
    objects: s.objects.filter((o) => o.kind === 'entity'),
    selectedIds: [],
  };
  e.checkpoint();
  e.emit();
};

CanvasEngine.prototype.exportWhiteboardJSON = function (this: CanvasEngine) {
  return JSON.stringify({ version: 1, objects: this.getWhiteboardObjects() }, null, 2);
};

CanvasEngine.prototype.importWhiteboardJSON = function (this: CanvasEngine, raw: string) {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data.objects)) return false;
    const e = asEng(this);
    const s = e.state;
    const layerId = s.layers[0]?.id || DEFAULT_LAYER.id;
    const imported = data.objects
      .filter((o: CanvasObject) => o && o.kind && o.kind !== 'entity')
      .map((o: CanvasObject) => ({
        ...o,
        id: `${o.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        layerId,
      }));
    e.state = { ...s, objects: [...s.objects, ...imported] };
    e.checkpoint();
    e.emit();
    return true;
  } catch {
    return false;
  }
};

CanvasEngine.prototype.getWhiteboardObjects = function (this: CanvasEngine) {
  return this.getState().objects.filter((o) =>
    ['frame', 'note', 'text', 'group', 'shape', 'stroke', 'stamp'].includes(o.kind)
  );
};

void STICKY_PALETTE;
void canvasEngine;

export {};
