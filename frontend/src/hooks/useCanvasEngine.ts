import { useEffect, useState } from 'react';
import { canvasEngine, type CanvasEngineState } from '../canvas/engine';

/** Subscribe to CanvasEngine singleton state. */
export function useCanvasEngine(): CanvasEngineState {
  const [state, setState] = useState(() => canvasEngine.getState());
  useEffect(() => canvasEngine.subscribe(setState), []);
  return state;
}
