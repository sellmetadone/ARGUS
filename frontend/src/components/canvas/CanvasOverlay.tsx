import { useCallback, useEffect, useRef, useState } from 'react';
import CanvasToolbar from './CanvasToolbar';
import EntityTypePicker from './EntityTypePicker';
import WhiteboardBar from './WhiteboardBar';
import { useStore } from '../../store/useStore';
import type { EntityType } from '../../types';
import { createEntityFromSchema } from '../../entities/entityFactory';
import { canvasEngine } from '../../canvas/engine';
import type { CanvasObject } from '../../canvas/engine';

function flowFromClient(clientX: number, clientY: number, el: Element) {
  const vp = canvasEngine.getState().viewport;
  const bounds = el.closest('.react-flow')?.getBoundingClientRect();
  if (!bounds) return null;
  return {
    x: (clientX - bounds.left - vp.x) / (vp.zoom || 1),
    y: (clientY - bounds.top - vp.y) / (vp.zoom || 1),
  };
}

export default function CanvasOverlay() {
  const addEntity = useStore((s) => s.addEntity);
  const activeCaseId = useStore((s) => s.activeCaseId);
  const setSelectedEntity = useStore((s) => s.setSelectedEntity);
  const setCanvasTool = useStore((s) => s.setCanvasTool);
  const canvasTool = useStore((s) => s.canvasTool);
  const [picker, setPicker] = useState<{
    screenX: number;
    screenY: number;
    flowX: number;
    flowY: number;
  } | null>(null);
  const [wbObjects, setWbObjects] = useState<CanvasObject[]>([]);
  const [viewport, setViewport] = useState(canvasEngine.getState().viewport);
  const strokeIdRef = useRef<string | null>(null);

  useEffect(() => {
    return canvasEngine.subscribe((s) => {
      setWbObjects(s.objects.filter((o) => o.kind !== 'entity'));
      setViewport(s.viewport);
    });
  }, []);

  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ flowX: number; flowY: number; screenX: number; screenY: number }>;
      const { flowX, flowY, screenX, screenY } = e.detail || {};
      if (typeof flowX !== 'number') return;

      // Double-click / double right-click → create entity
      if (canvasTool === 'select' || canvasTool === 'node' || canvasTool === 'hand' || canvasTool === 'connect') {
        setPicker({ screenX, screenY, flowX, flowY });
        return;
      }
      if (canvasTool === 'frame') {
        canvasEngine.addFrame(flowX - 40, flowY - 40, 320, 220, 'Frame');
        setCanvasTool('select');
        return;
      }
      if (canvasTool === 'shape') {
        if (typeof (canvasEngine as { addShape?: Function }).addShape === 'function') {
          (canvasEngine as { addShape: Function }).addShape(flowX - 80, flowY - 50, 160, 100);
        }
        setCanvasTool('select');
        return;
      }
      if (canvasTool === 'note') {
        const text = window.prompt('Note', '') ?? '';
        if (text.trim()) canvasEngine.addNote(flowX, flowY, text.trim());
        setCanvasTool('select');
        return;
      }
      if (canvasTool === 'text') {
        const text = window.prompt('Text', '') ?? '';
        if (text.trim()) canvasEngine.addText(flowX, flowY, text.trim());
        setCanvasTool('select');
        return;
      }
      if (canvasTool === 'stamp') {
        const label = window.prompt('Stamp label', 'Review') ?? '';
        if (label.trim() && typeof (canvasEngine as { addStamp?: Function }).addStamp === 'function') {
          (canvasEngine as { addStamp: Function }).addStamp(flowX, flowY, label.trim());
        }
        setCanvasTool('select');
      }
    };
    window.addEventListener('argus:pane-dblclick', handler);
    return () => window.removeEventListener('argus:pane-dblclick', handler);
  }, [canvasTool, setCanvasTool]);

  useEffect(() => {
    const placeTools = new Set(['frame', 'note', 'text', 'shape', 'stamp']);
    if (!placeTools.has(canvasTool)) return;
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (!target.closest?.('.react-flow__pane')) return;
      const flow = flowFromClient(ev.clientX, ev.clientY, target);
      if (!flow) return;
      if (canvasTool === 'frame') {
        canvasEngine.addFrame(flow.x - 40, flow.y - 40, 320, 220, 'Frame');
      } else if (canvasTool === 'shape' && typeof (canvasEngine as { addShape?: Function }).addShape === 'function') {
        (canvasEngine as { addShape: Function }).addShape(flow.x - 80, flow.y - 50, 160, 100);
      } else if (canvasTool === 'note') {
        const text = window.prompt('Note', '') ?? '';
        if (text.trim()) canvasEngine.addNote(flow.x, flow.y, text.trim());
      } else if (canvasTool === 'text') {
        const text = window.prompt('Text', '') ?? '';
        if (text.trim()) canvasEngine.addText(flow.x, flow.y, text.trim());
      } else if (canvasTool === 'stamp') {
        const label = window.prompt('Stamp label', 'Review') ?? '';
        if (label.trim() && typeof (canvasEngine as { addStamp?: Function }).addStamp === 'function') {
          (canvasEngine as { addStamp: Function }).addStamp(flow.x, flow.y, label.trim());
        }
      }
      setCanvasTool('select');
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [canvasTool, setCanvasTool]);

  useEffect(() => {
    if (canvasTool !== 'pen') return;
    const eng = canvasEngine as {
      beginStroke?: (x: number, y: number) => string;
      appendStrokePoint?: (id: string, x: number, y: number) => void;
      endStroke?: (id: string) => void;
    };
    if (!eng.beginStroke) return;
    const onDown = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (!target.closest?.('.react-flow__pane')) return;
      const flow = flowFromClient(ev.clientX, ev.clientY, target);
      if (!flow) return;
      strokeIdRef.current = eng.beginStroke!(flow.x, flow.y);
      ev.preventDefault();
    };
    const onMove = (ev: MouseEvent) => {
      if (!strokeIdRef.current) return;
      const target = document.querySelector('.react-flow');
      if (!target) return;
      const flow = flowFromClient(ev.clientX, ev.clientY, target);
      if (!flow) return;
      eng.appendStrokePoint?.(strokeIdRef.current, flow.x, flow.y);
    };
    const onUp = () => {
      if (strokeIdRef.current) {
        eng.endStroke?.(strokeIdRef.current);
        strokeIdRef.current = null;
      }
    };
    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [canvasTool]);

  const onPickType = useCallback(
    (type: EntityType) => {
      if (!picker || !activeCaseId) {
        setPicker(null);
        return;
      }
      const entity = createEntityFromSchema({
        type,
        caseId: activeCaseId,
        position: { x: picker.flowX, y: picker.flowY },
      });
      addEntity(entity);
      setSelectedEntity(entity.id);
      setCanvasTool('select');
      setPicker(null);
    },
    [picker, activeCaseId, addEntity, setSelectedEntity, setCanvasTool]
  );

  const z = viewport.zoom || 1;
  const toScreen = (x: number, y: number) => ({
    left: x * z + viewport.x,
    top: y * z + viewport.y,
  });

  return (
    <>
      <CanvasToolbar />
      <WhiteboardBar />
      {picker && (
        <EntityTypePicker
          x={picker.screenX}
          y={picker.screenY}
          onPick={onPickType}
          onClose={() => setPicker(null)}
        />
      )}
      <div className="whiteboard-layer" aria-hidden={wbObjects.length === 0}>
        {wbObjects.map((obj) => {
          if (obj.kind === 'stroke' && obj.points && obj.points.length > 1) {
            const minX = Math.min(...obj.points.map((p) => p.x));
            const minY = Math.min(...obj.points.map((p) => p.y));
            const maxX = Math.max(...obj.points.map((p) => p.x));
            const maxY = Math.max(...obj.points.map((p) => p.y));
            const pos = toScreen(minX, minY);
            const d = obj.points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x - minX) * z} ${(p.y - minY) * z}`)
              .join(' ');
            return (
              <svg
                key={obj.id}
                className="wb-stroke"
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  width: Math.max(4, (maxX - minX) * z + 4),
                  height: Math.max(4, (maxY - minY) * z + 4),
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
              >
                <path
                  d={d}
                  fill="none"
                  stroke={obj.color || '#526C8C'}
                  strokeWidth={(obj.strokeWidth || 2.5) * z}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );
          }

          const pos = toScreen(obj.x, obj.y);
          const w = (obj.width || 160) * z;
          const h = (obj.height || 80) * z;

          if (obj.kind === 'frame' || obj.kind === 'group') {
            return (
              <div
                key={obj.id}
                className={`wb-frame${obj.kind === 'group' ? ' is-group' : ''}`}
                style={{ left: pos.left, top: pos.top, width: w, height: h }}
              >
                <span className="wb-frame-label">{obj.label || (obj.kind === 'group' ? 'Group' : 'Frame')}</span>
                <button
                  type="button"
                  className="wb-frame-close"
                  title="Remove"
                  onClick={() =>
                    obj.kind === 'group' ? canvasEngine.ungroup(obj.id) : canvasEngine.removeObject(obj.id)
                  }
                >
                  ×
                </button>
              </div>
            );
          }

          if (obj.kind === 'shape') {
            const shape = obj.shape || 'rect';
            const radius = shape === 'ellipse' ? '50%' : shape === 'rounded' ? 12 : 4;
            return (
              <div
                key={obj.id}
                className={`wb-shape wb-shape-${shape}`}
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: w,
                  height: h,
                  borderColor: obj.color || '#526C8C',
                  background: `${obj.color || '#526C8C'}18`,
                  borderRadius: shape === 'ellipse' ? '50%' : radius,
                  transform: shape === 'diamond' ? 'rotate(45deg)' : undefined,
                }}
                onDoubleClick={() => {
                  const next = window.prompt('Label', obj.label || '') ?? obj.label;
                  if (next != null) canvasEngine.updateObject(obj.id, { label: next });
                }}
              >
                {obj.label && (
                  <span
                    className="wb-shape-label"
                    style={{ transform: shape === 'diamond' ? 'rotate(-45deg)' : undefined }}
                  >
                    {obj.label}
                  </span>
                )}
                <button type="button" className="wb-frame-close" onClick={() => canvasEngine.removeObject(obj.id)}>
                  ×
                </button>
              </div>
            );
          }

          if (obj.kind === 'stamp') {
            return (
              <div
                key={obj.id}
                className="wb-stamp"
                style={{
                  left: pos.left,
                  top: pos.top,
                  borderColor: obj.color || '#526C8C',
                  color: obj.color || '#526C8C',
                }}
              >
                {obj.label || 'STAMP'}
                <button type="button" className="wb-frame-close" onClick={() => canvasEngine.removeObject(obj.id)}>
                  ×
                </button>
              </div>
            );
          }

          if (obj.kind === 'note') {
            return (
              <div
                key={obj.id}
                className="wb-note"
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: w,
                  minHeight: h,
                  background: obj.color || '#fef08a',
                }}
                onDoubleClick={() => {
                  const next = window.prompt('Note', obj.label || '') ?? obj.label;
                  if (next != null) canvasEngine.updateObject(obj.id, { label: next });
                }}
              >
                <div className="wb-note-body">{obj.label}</div>
                <button type="button" className="wb-frame-close" onClick={() => canvasEngine.removeObject(obj.id)}>
                  ×
                </button>
              </div>
            );
          }

          if (obj.kind === 'text') {
            return (
              <div
                key={obj.id}
                className="wb-text"
                style={{ left: pos.left, top: pos.top, fontSize: 14 * z }}
                onDoubleClick={() => {
                  const next = window.prompt('Text', obj.label || '') ?? obj.label;
                  if (next != null) canvasEngine.updateObject(obj.id, { label: next });
                }}
              >
                {obj.label}
                <button type="button" className="wb-frame-close" onClick={() => canvasEngine.removeObject(obj.id)}>
                  ×
                </button>
              </div>
            );
          }

          return null;
        })}
      </div>
    </>
  );
}
