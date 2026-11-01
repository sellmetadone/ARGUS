import { useCallback, useEffect, useState } from 'react';
import CanvasToolbar from './CanvasToolbar';
import EntityTypePicker from './EntityTypePicker';
import { useStore } from '../../store/useStore';
import type { EntityType } from '../../types';
import { createEntityFromSchema } from '../../entities/entityFactory';

export default function CanvasOverlay() {
  const addEntity = useStore((s) => s.addEntity);
  const activeCaseId = useStore((s) => s.activeCaseId);
  const setSelectedEntity = useStore((s) => s.setSelectedEntity);
  const setCanvasTool = useStore((s) => s.setCanvasTool);
  const [picker, setPicker] = useState<{
    screenX: number;
    screenY: number;
    flowX: number;
    flowY: number;
  } | null>(null);

  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ flowX: number; flowY: number; screenX: number; screenY: number }>;
      if (!e.detail) return;
      setPicker({
        flowX: e.detail.flowX,
        flowY: e.detail.flowY,
        screenX: e.detail.screenX,
        screenY: e.detail.screenY,
      });
    };
    window.addEventListener('argus:pane-dblclick', handler as EventListener);
    return () => window.removeEventListener('argus:pane-dblclick', handler as EventListener);
  }, []);

  const onCreateAt = useCallback(
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
      setPicker(null);
      setCanvasTool('select');
    },
    [picker, activeCaseId, addEntity, setSelectedEntity, setCanvasTool]
  );

  return (
    <>
      <CanvasToolbar />
      {picker && (
        <EntityTypePicker
          x={Math.min(picker.screenX, typeof window !== 'undefined' ? window.innerWidth - 280 : 100)}
          y={Math.min(picker.screenY, typeof window !== 'undefined' ? window.innerHeight - 400 : 100)}
          onPick={onCreateAt}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}
