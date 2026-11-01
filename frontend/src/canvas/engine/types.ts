/**
 * CanvasEngine types — unified canvas state surface.
 * Case data remains in Zustand; engine mirrors layout/selection/viewport for tools.
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
  caseId: string | null;
  viewport: CanvasViewport;
  tool: CanvasTool;
  layers: CanvasLayer[];
  objects: CanvasObject[];
  selectedIds: string[];
  /** entity ids currently mirrored */
  entityCount: number;
};

export const DEFAULT_LAYER: CanvasLayer = {
  id: 'layer-default',
  name: 'Main',
  visible: true,
  locked: false,
  order: 0,
};

export function createInitialCanvasState(caseId: string | null = null): CanvasEngineState {
  return {
    caseId,
    viewport: { x: 0, y: 0, zoom: 1 },
    tool: 'select',
    layers: [{ ...DEFAULT_LAYER }],
    objects: [],
    selectedIds: [],
    entityCount: 0,
  };
}
