import { useCallback, useEffect, useState } from 'react';
import CanvasToolbar from './CanvasToolbar';
import EntityTypePicker from './EntityTypePicker';
import WhiteboardBar from './WhiteboardBar';
import { useStore } from '../../store/useStore';
import type { EntityType } from '../../types';
import { createEntityFromSchema } from '../../entities/entityFactory';
import { canvasEngine } from '../../canvas/engine';
import type { CanvasObject } from '../../canvas/engine';

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

  useEffect(() => {
    return canvasEngine.subscribe((s) => {
      setWbObjects(s.objects.filter((o) => o.kind === 'frame' || o.kind === 'note' || o.kind === 'text' || o.kind === 'group'));
      setViewport(s.viewport);
    });
  }, []);

  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ flowX: number; flowY: number; screenX: number; screenY: number }>;
      const { flowX, flowY, screenX, screenY } = e.detail || {};
      if (typeof flowX !== 'number') return;

      if (canvasTool === 'node') {
        setPicker({ screenX, screenY, flowX, flowY });
        return;
      }
      if (canvasTool === 'frame') {
        canvasEngine.addFrame(flowX - 40, flowY - 40, 320, 220, 'Frame');
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
    };
    window.addEventListener('argus:pane-dblclick', handler);
    return () => window.removeEventListener('argus:pane-dblclick', handler);
  }, [canvasTool, setCanvasTool]);

  useEffect(() => {
    if (canvasTool !== 'frame' && canvasTool !== 'note' && canvasTool !== 'text') return;
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (!target.closest?.('.react-flow__pane')) return;
      const vp = canvasEngine.getState().viewport;
      const bounds = target.closest('.react-flow')?.getBoundingClientRect();
      if (!bounds) return;
      const flowX = (ev.clientX - bounds.left - vp.x) / (vp.zoom || 1);
      const flowY = (ev.clientY - bounds.top - vp.y) / (vp.zoom || 1);
      if (canvasTool === 'frame') {
        canvasEngine.addFrame(flowX - 40, flowY - 40, 320, 220, 'Frame');
        setCanvasTool('select');
      } else if (canvasTool === 'note') {
        const text = window.prompt('Note', '') ?? '';
        if (text.trim()) canvasEngine.addNote(flowX, flowY, text.trim());
        setCanvasTool('select');
      } else if (canvasTool === 'text') {
        const text = window.prompt('Text', '') ?? '';
        if (text.trim()) canvasEngine.addText(flowX, flowY, text.trim());
        setCanvasTool('select');
      }
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [canvasTool, setCanvasTool]);

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
          const pos = toScreen(obj.x, obj.y);
          if (obj.kind === 'frame' || obj.kind === 'group') {
            return (
              <div
                key={obj.id}
                className={`wb-frame${obj.kind === 'group' ? ' is-group' : ''}`}
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: (obj.width || 320) * z,
                  height: (obj.height || 220) * z,
                  borderColor: obj.color || 'var(--accent)',
                }}
              >
                <span className="wb-frame-label">{obj.label || (obj.kind === 'group' ? 'Group' : 'Frame')}</span>
                <button
                  type="button"
                  className="wb-frame-close"
                  title="Remove"
                  onClick={() => canvasEngine.removeObject(obj.id)}
                >
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
                style={{ left: pos.left, top: pos.top, width: (obj.width || 180) * z }}
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
              <div key={obj.id} className="wb-text" style={{ left: pos.left, top: pos.top, fontSize: 14 * z }}>
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
