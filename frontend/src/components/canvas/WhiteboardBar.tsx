import { useCallback, useEffect, useState } from 'react';
import {
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Group, Frame, StickyNote,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { canvasEngine, type AlignMode } from '../../canvas/engine';
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

export default function WhiteboardBar() {
  const t = useT();
  const selectedEntityIds = useStore((s) => s.selectedEntityIds);
  const entities = useStore((s) => s.entities);
  const updateEntityPosition = useStore((s) => s.updateEntityPosition);
  const pushHistory = useStore((s) => s.pushHistory);
  const canvasTool = useStore((s) => s.canvasTool);
  const [engineTick, setEngineTick] = useState(0);

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
      const ids = Object.keys(next);
      if (!ids.length) return;
      pushHistory(`Align ${mode}`);
      for (const id of ids) {
        updateEntityPosition(id, next[id]);
        canvasEngine.upsertEntityObject(id, next[id].x, next[id].y);
      }
    },
    [selectedEntityIds, entities, updateEntityPosition, pushHistory]
  );

  const onGroup = useCallback(() => {
    if (selectedEntityIds.length < 2) return;
    const g = canvasEngine.groupSelected(selectedEntityIds, t('wb_group') || 'Group');
    if (g) pushHistory('Group');
  }, [selectedEntityIds, pushHistory, t]);

  const onFrameAround = useCallback(() => {
    if (selectedEntityIds.length === 0) {
      const vp = canvasEngine.getState().viewport;
      const x = (-vp.x + 200) / (vp.zoom || 1);
      const y = (-vp.y + 120) / (vp.zoom || 1);
      canvasEngine.addFrame(x, y, 320, 220, t('wb_frame') || 'Frame');
      pushHistory('Add frame');
      return;
    }
    const items = selectedEntityIds
      .map((id) => entities.find((e) => e.id === id))
      .filter(Boolean) as { position?: { x: number; y: number } }[];
    if (!items.length) return;
    const xs = items.map((e) => e.position?.x ?? 0);
    const ys = items.map((e) => e.position?.y ?? 0);
    const minX = Math.min(...xs) - 24;
    const minY = Math.min(...ys) - 40;
    const maxX = Math.max(...xs) + 200;
    const maxY = Math.max(...ys) + 100;
    canvasEngine.addFrame(minX, minY, maxX - minX, maxY - minY, t('wb_frame') || 'Frame');
    pushHistory('Frame selection');
  }, [selectedEntityIds, entities, pushHistory, t]);

  if (!multi && canvasTool !== 'frame' && canvasTool !== 'note' && canvasTool !== 'text' && wbCount === 0) {
    return null;
  }

  return (
    <div className="whiteboard-bar" role="toolbar" aria-label="Whiteboard">
      {multi && (
        <>
          <span className="wb-count">{selectedEntityIds.length}</span>
          {ALIGN.map((a) => (
            <button
              key={a.mode}
              type="button"
              className="btn btn-icon"
              title={t(a.title)}
              onClick={() => applyAlign(a.mode)}
            >
              {a.icon}
            </button>
          ))}
          <button type="button" className="btn btn-icon" title={t('wb_group')} onClick={onGroup}>
            <Group size={14} />
          </button>
          <button type="button" className="btn btn-icon" title={t('wb_frame_around')} onClick={onFrameAround}>
            <Frame size={14} />
          </button>
        </>
      )}
      {!multi && (canvasTool === 'frame' || canvasTool === 'note' || canvasTool === 'text') && (
        <span className="wb-hint">
          {canvasTool === 'frame' && (t('wb_frame_hint') || 'Click canvas to place a frame')}
          {canvasTool === 'note' && (t('wb_note_hint') || 'Click canvas to place a note')}
          {canvasTool === 'text' && (t('wb_text_hint') || 'Click canvas to place text')}
        </span>
      )}
      {wbCount > 0 && !multi && (
        <span className="wb-count" title={t('wb_objects') || 'Whiteboard objects'}>
          <StickyNote size={12} /> {wbCount}
        </span>
      )}
    </div>
  );
}
