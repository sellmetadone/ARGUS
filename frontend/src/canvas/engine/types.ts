/**
 * ARGUS CanvasEngine types — original investigation board model (MIT).
 * Inspired by common whiteboard workflows; not derived from proprietary code.
 */

export type CanvasTool =
  | 'select'
  | 'hand'
  | 'node'
  | 'connect'
  | 'note'
  | 'text'
  | 'frame'
  | 'shape'
  | 'pen'
  | 'stamp'
  | 'eraser';

export type CanvasViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type CanvasLayer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
};

/** Board object kinds used by the investigation overlay */
export type CanvasObjectKind =
  | 'entity'
  | 'note'
  | 'text'
  | 'frame'
  | 'group'
  | 'shape'
  | 'stroke'
  | 'stamp';

export type ShapeVariant = 'rect' | 'ellipse' | 'diamond' | 'rounded';

export type CanvasObject = {
  id: string;
  kind: CanvasObjectKind;
  entityId?: string;
  layerId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  locked?: boolean;
  memberIds?: string[];
  color?: string;
  shape?: ShapeVariant;
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  opacity?: number;
};

export type AlignMode =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'distribute-h'
  | 'distribute-v';

export type CanvasEngineState = {
  caseId: string | null;
  viewport: CanvasViewport;
  tool: CanvasTool;
  layers: CanvasLayer[];
  objects: CanvasObject[];
  selectedIds: string[];
  entityCount: number;
  drawColor: string;
  drawWidth: number;
  shapeVariant: ShapeVariant;
};

export const DEFAULT_LAYER: CanvasLayer = {
  id: 'layer-default',
  name: 'Main',
  visible: true,
  locked: false,
  order: 0,
};

export const STICKY_PALETTE = [
  '#fef08a',
  '#fdba74',
  '#f9a8d4',
  '#a5b4fc',
  '#86efac',
  '#7dd3fc',
  '#e2e8f0',
];

export function createInitialCanvasState(caseId: string | null = null): CanvasEngineState {
  return {
    caseId,
    viewport: { x: 0, y: 0, zoom: 1 },
    tool: 'select',
    layers: [{ ...DEFAULT_LAYER }],
    objects: [],
    selectedIds: [],
    entityCount: 0,
    drawColor: '#526C8C',
    drawWidth: 2.5,
    shapeVariant: 'rect',
  };
}
