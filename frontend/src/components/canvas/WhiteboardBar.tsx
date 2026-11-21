import { useCallback, useEffect, useState } from 'react';
import {
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Group, Frame, Trash2, Download, Square, Circle, Diamond, Undo2, Redo2,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { canvasEngine, type AlignMode, type ShapeVariant, STICKY_PALETTE } from '../../canvas/engine';
import { useT } from '../../i18n/useT';

const ALIGN: { mode: AlignMode; icon: React.ReactNode; title: string }[] = [
  { mode: 'left', icon: <AlignLeft size={14} />, title: 'align_left' },
  { mode: 'center', icon: <AlignCenter size={14} />, title: 'align_center' },
  { mode: 'right', icon: <AlignRight size={14} />, title: 'align_right' },
  { mode: 'top', icon: <AlignStartVertical size={14} />, title: 'align_top' },
  { mode: 'middle', icon: <AlignCenterVertical size={14} />, title: 'align_middle' },
  { mode: 'bottom', icon: <AlignEndVertical size={14} />, title: 'align_bottom' },
  { mode: 'distribute-h', icon: <AlignCenter size={14} />, title: 'align_distribute_h' },
  { mode: 'distribute-v', icon: <AlignCenterVertical size={14} />, title: 'align_distribute_v' },
];

const SHAPES: { id: ShapeVariant; icon: React.ReactNode }[] = [
  { id: 'rect', icon: <Square size={14} /> },
  { id: 'rounded', icon: <Square size={14} style={{ borderRadius: 4 }} /> },
  { id: 'ellipse', icon: <Circle size={14} /> },
  { id: 'diamond', icon: <Diamond size={14} /> },
];

export default function WhiteboardBar() {
  const t = useT();
  const selectedEntityIds = useStore((s) => s.selectedEntityIds);
  const entities = useStore((s) => s.entities);
  const updateEntityPosition = useStore((s) => s.updateEntityPosition);
  const pushHistory = useStore((s) => s.pushHistory);
  const canvasTool = useStore((s) => s.canvasTool);
  const [engineTick, setEngineTick] = useState(0);
  const draw = canvasEngine.getState();

  useEffect(() => canvasEngine.subscribe(() => setEngineTick((n) => n + 1)), []);

  const multi = selectedEntityIds.length >= 2;
  const wbCount = canvasEngine.getWhiteboardObjects().length;
  void engineTick;

  const applyAlign = useCallback(
    (mode: AlignMode) => {
      if (selectedEntityIds.length < 2) return;
      const items = selectedEntityIds
        .map((id) => {
          const e = entities.find((x) => x.id === id);
          if (!e) return null;
          return {
            id,
            x: e.position?.x ?? 0,
            y: e.position?.y ?? 0,
            width: 180,
            height: 72,
          };
        })
        .filter(Boolean) as { id: string; x: number; y: number; width: number; height: number }[];
      const next = canvasEngine.computeAlign(items, mode);
      Object.entries(next).forEach(([id, pos]) => updateEntityPosition(id, pos));
      pushHistory(`Align ${mode}`);
    },
    [selectedEntityIds, entities, updateEntityPosition, pushHistory]
  );

  const onGroup = useCallback(() => {
    if (selectedEntityIds.length < 2) return;
    canvasEngine.groupSelected(selectedEntityIds, t('wb_group') || 'Group');
    pushHistory('Group');
  }, [selectedEntityIds, pushHistory, t]);

  const onFrameAround = useCallback(() => {
    if (selectedEntityIds.length === 0) {
      const vp = canvasEngine.getState().viewport;
      const x = (-vp.x + 120) / (vp.zoom || 1);
      const y = (-vp.y + 120) / (vp.zoom || 1);
      canvasEngine.addFrame(x, y, 320, 220, t('wb_frame') || 'Frame');
      return;
    }
    const items = selectedEntityIds
      .map((id) => entities.find((x) => x.id === id))
      .filter(Boolean) as { position?: { x: number; y: number } }[];
    if (!items.length) return;
    const minX = Math.min(...items.map((e) => e.position?.x ?? 0)) - 24;
    const minY = Math.min(...items.map((e) => e.position?.y ?? 0)) - 24;
    const maxX = Math.max(...items.map((e) => (e.position?.x ?? 0) + 180)) + 24;
    const maxY = Math.max(...items.map((e) => (e.position?.y ?? 0) + 72)) + 24;
    canvasEngine.addFrame(minX, minY, maxX - minX, maxY - minY, t('wb_frame') || 'Frame');
    pushHistory('Frame');
  }, [selectedEntityIds, entities, pushHistory, t]);

  const onExport = () => {
    const blob = new Blob([canvasEngine.exportWhiteboardJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argus-board-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showDraw = canvasTool === 'pen' || canvasTool === 'shape' || canvasTool === 'stamp' || canvasTool === 'note';

  return (
    <div className="whiteboard-bar" role="toolbar" aria-label="Whiteboard">
      <button type="button" className="btn btn-icon" title="Undo (Ctrl+Z)" onClick={() => canvasEngine.undoCanvas()}>
        <Undo2 size={14} />
      </button>
      <button type="button" className="btn btn-icon" title="Redo (Ctrl+Shift+Z)" onClick={() => canvasEngine.redoCanvas()}>
        <Redo2 size={14} />
      </button>
      <span className="wb-sep" />
      {multi && (
        <>
          <span className="wb-count">{selectedEntityIds.length}</span>
          {ALIGN.map((a) => (
            <button
              key={a.mode}
              type="button"
              className="btn btn-icon"
              title={t(a.title) || a.mode}
              onClick={() => applyAlign(a.mode)}
            >
              {a.icon}
            </button>
          ))}
          <button type="button" className="btn btn-icon" title={t('wb_group') || 'Group'} onClick={onGroup}>
            <Group size={14} />
          </button>
        </>
      )}
      <button type="button" className="btn btn-icon" title={t('wb_frame') || 'Frame'} onClick={onFrameAround}>
        <Frame size={14} />
      </button>

      {showDraw && (
        <>
          <span className="wb-sep" />
          {canvasTool === 'shape' &&
            SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`btn btn-icon${draw.shapeVariant === s.id ? ' active' : ''}`}
                title={s.id}
                onClick={() => canvasEngine.setDrawStyle({ shape: s.id })}
              >
                {s.icon}
              </button>
            ))}
          {STICKY_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              className={`wb-swatch${draw.drawColor === c ? ' active' : ''}`}
              style={{ background: c }}
              title={c}
              onClick={() => canvasEngine.setDrawStyle({ color: c })}
            />
          ))}
        </>
      )}

      {wbCount > 0 && (
        <>
          <span className="wb-sep" />
          <span className="wb-hint">{wbCount}</span>
          <button type="button" className="btn btn-icon" title="Export board" onClick={onExport}>
            <Download size={14} />
          </button>
          <button
            type="button"
            className="btn btn-icon"
            title="Clear board objects"
            onClick={() => {
              if (window.confirm('Clear whiteboard objects (entities stay)?')) canvasEngine.clearWhiteboard();
            }}
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
      {!multi && !showDraw && wbCount === 0 && (
        <span className="wb-hint">{t('wb_hint') || 'Shift+drag · Frame · Pen · Shapes'}</span>
      )}
    </div>
  );
}
