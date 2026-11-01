/**
 * CanvasEngine types — foundation for unified canvas state.
 * GraphCanvas still drives React Flow; this module defines the target API surface.
 * Does not replace case entity/relationship storage.
 */

export type CanvasTool = 'select' | 'hand' | 'node' | 'connect' | 'note' | 'text';

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

export type CanvasObjectKind = 'entity' | 'note' | 'text' | 'frame' | 'group';

export type CanvasObject = {
  id: string;
  kind: CanvasObjectKind;
  /** Links to Entity.id when kind === 'entity' */
  entityId?: string;
  layerId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  locked?: boolean;
};

export type CanvasEngineState = {
  viewport: CanvasViewport;
  tool: CanvasTool;
  layers: CanvasLayer[];
  objects: CanvasObject[];
  selectedIds: string[];
};

export const DEFAULT_LAYER: CanvasLayer = {
  id: 'layer-default',
  name: 'Main',
  visible: true,
  locked: false,
  order: 0,
};

export function createInitialCanvasState(): CanvasEngineState {
  return {
    viewport: { x: 0, y: 0, zoom: 1 },
    tool: 'select',
    layers: [{ ...DEFAULT_LAYER }],
    objects: [],
    selectedIds: [],
  };
}
