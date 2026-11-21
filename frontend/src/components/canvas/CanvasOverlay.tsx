import { useCallback, useEffect, useRef, useState } from 'react';
import CanvasToolbar from './CanvasToolbar';
import EntityTypePicker from './EntityTypePicker';
import { canvasEngine } from '../../canvas/engine/CanvasEngine';
import type { CanvasObject } from '../../canvas/engine/types';
import { useStore } from '../../store/useStore';

type PickerState = { screenX: number; screenY: number; flowX: number; flowY: number } | null;

export default function CanvasOverlay() {
  const canvasTool = useStore((s) => s.canvasTool);
  const setCanvasTool = useStore((s) => s.setCanvasTool);
  const [objects, setObjects] = useState<CanvasObject[]>(() => canvasEngine.getObjectsForRender());
  const [picker, setPicker] = useState<PickerState>(null);
  const dragRef = useRef<{ mode: 'pen' | 'eraser' | null; lastX: number; lastY: number }>({
    mode: null,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    return canvasEngine.subscribe(() => {
      setObjects(canvasEngine.getObjectsForRender());
    });
  }, []);

  // Double-click / double right-click → create entity
  useEffect(() => {
    const onCanvasDbl = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const { flowX, flowY, screenX, screenY } = detail;
      if (typeof flowX !== 'number') return;

      if (canvasTool === 'select' || canvasTool === 'node' || canvasTool === 'hand' || canvasTool === 'connect') {
        setPicker({ screenX, screenY, flowX, flowY });
        return;
      }
      if (canvasTool === 'frame') {
        canvasEngine.addFrame(flowX, flowY);
        return;
      }
      if (canvasTool === 'sticky') {
        canvasEngine.addNote(flowX, flowY);
        return;
      }
      if (canvasTool === 'text') {
        canvasEngine.addText(flowX, flowY);
        return;
      }
    };
    window.addEventListener('argus:canvas-dblclick', onCanvasDbl as EventListener);
    return () => window.removeEventListener('argus:canvas-dblclick', onCanvasDbl as EventListener);
  }, [canvasTool]);

  // Pen / eraser drag
  useEffect(() => {
    const onDown = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const { flowX, flowY } = detail;
      if (typeof flowX !== 'number') return;
      if (canvasTool === 'pen') {
        dragRef.current = { mode: 'pen', lastX: flowX, lastY: flowY };
        canvasEngine.beginStroke(flowX, flowY);
      } else if (canvasTool === 'eraser') {
        dragRef.current = { mode: 'eraser', lastX: flowX, lastY: flowY };
        canvasEngine.eraseNear(flowX, flowY, 22);
      }
    };
    const onMove = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const { flowX, flowY } = detail;
      if (typeof flowX !== 'number') return;
      const d = dragRef.current;
      if (d.mode === 'pen') {
        canvasEngine.appendStrokePoint(flowX, flowY);
      } else if (d.mode === 'eraser') {
        canvasEngine.eraseNear(flowX, flowY, 22);
      }
    };
    const onUp = () => {
      if (dragRef.current.mode === 'pen') canvasEngine.endStroke();
      dragRef.current.mode = null;
    };
    window.addEventListener('argus:canvas-pointerdown', onDown as EventListener);
    window.addEventListener('argus:canvas-pointermove', onMove as EventListener);
    window.addEventListener('argus:canvas-pointerup', onUp as EventListener);
    return () => {
      window.removeEventListener('argus:canvas-pointerdown', onDown as EventListener);
      window.removeEventListener('argus:canvas-pointermove', onMove as EventListener);
      window.removeEventListener('argus:canvas-pointerup', onUp as EventListener);
    };
  }, [canvasTool]);

  // Keyboard shortcuts (Miro-like)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (ev.target as HTMLElement)?.isContentEditable) return;

      if (ev.ctrlKey || ev.metaKey) {
        if (ev.key === 'z' && !ev.shiftKey) {
          ev.preventDefault();
          canvasEngine.undoCanvas();
          return;
        }
        if ((ev.key === 'z' && ev.shiftKey) || ev.key === 'y') {
          ev.preventDefault();
          canvasEngine.redoCanvas();
          return;
        }
      }

      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        canvasEngine.deleteSelected();
        return;
      }

      const map: Record<string, string> = {
        v: 'select',
        h: 'hand',
        n: 'node',
        f: 'frame',
        p: 'pen',
        e: 'eraser',
        s: 'sticky',
        t: 'text',
        c: 'connect',
      };
      const tool = map[ev.key.toLowerCase()];
      if (tool) {
        ev.preventDefault();
        setCanvasTool(tool as any);
        canvasEngine.setTool(tool as any);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCanvasTool]);

  const onPickerClose = useCallback(() => setPicker(null), []);

  return (
    <>
      <CanvasToolbar />
      {picker && (
        <EntityTypePicker
          screenX={picker.screenX}
          screenY={picker.screenY}
          flowX={picker.flowX}
          flowY={picker.flowY}
          onClose={onPickerClose}
        />
      )}
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {objects.map((o) => {
          if (o.kind === 'stroke' && o.points && o.points.length > 1) {
            const d = o.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            return (
              <svg
                key={o.id}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                <path
                  d={d}
                  fill="none"
                  stroke={o.stroke || '#f97316'}
                  strokeWidth={o.strokeWidth || 2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );
          }
          if (o.kind === 'note' || o.kind === 'frame' || o.kind === 'text' || o.kind === 'shape') {
            return (
              <div
                key={o.id}
                className="absolute rounded border border-black/20 shadow-sm text-xs p-2 pointer-events-auto"
                style={{
                  left: o.x,
                  top: o.y,
                  width: o.w,
                  height: o.h,
                  background: o.fill || (o.kind === 'note' ? '#fef08a' : 'transparent'),
                }}
              >
                {o.text || o.label || o.kind}
              </div>
            );
          }
          return null;
        })}
      </div>
    </>
  );
}
