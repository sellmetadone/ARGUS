import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import CanvasToolbar from './CanvasToolbar';
import EntityTypePicker from './EntityTypePicker';
import { useStore } from '../../store/useStore';
import type { EntityType } from '../../types';

/**
 * Overlay: toolbar + double-click entity create.
 * Must render inside ReactFlowProvider (App already wraps).
 * GraphCanvas still owns ReactFlow instance; this listens on the graph surface parent.
 */
export default function CanvasOverlay() {
  const addEntity = useStore((s) => s.addEntity);
  const activeCaseId = useStore((s) => s.activeCaseId);
  const setSelectedEntity = useStore((s) => s.setSelectedEntity);
  const canvasTool = useStore((s) => s.canvasTool);
  const setCanvasTool = useStore((s) => s.setCanvasTool);
  const [picker, setPicker] = useState<{ screenX: number; screenY: number; flowX: number; flowY: number } | null>(null);

  // screen → approximate flow coords via stored last viewport is hard outside RF;
  // picker uses flow coords from a custom event dispatched by GraphCanvas
  const onCreateAt = useCallback(
    (type: EntityType) => {
      if (!picker || !activeCaseId) {
        setPicker(null);
        return;
      }
      const id = `ent-${Date.now()}`;
      const label =
        type === 'person'
          ? 'New person'
          : type === 'organization' || type === 'company'
            ? 'New organization'
            : type === 'note'
              ? 'Note'
              : `New ${type}`;
      addEntity({
        id,
        type,
        label,
        properties: {},
        caseId: activeCaseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        position: { x: picker.flowX, y: picker.flowY },
        confidence: 50,
        source: 'Manual',
      });
      setSelectedEntity(id);
      setPicker(null);
      setCanvasTool('select');
    },
    [picker, activeCaseId, addEntity, setSelectedEntity, setCanvasTool]
  );

  // Listen for custom event from GraphCanvas
  useState(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ flowX: number; flowY: number; screenX: number; screenY: number }>;
      if (!e.detail) return;
      if (canvasTool === 'node' || canvasTool === 'select' || canvasTool === 'note') {
        setPicker({
          flowX: e.detail.flowX,
          flowY: e.detail.flowY,
          screenX: e.detail.screenX,
          screenY: e.detail.screenY,
        });
      }
    };
    window.addEventListener('argus:pane-dblclick', handler as EventListener);
    return () => window.removeEventListener('argus:pane-dblclick', handler as EventListener);
  });

  return (
    <>
      <CanvasToolbar />
      {picker && (
        <EntityTypePicker
          x={Math.min(picker.screenX, window.innerWidth - 280)}
          y={Math.min(picker.screenY, window.innerHeight - 400)}
          onPick={onCreateAt}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}
