import { MousePointer2, Hand, Square, Link2, StickyNote, Type, Frame } from 'lucide-react';
import { useStore, type CanvasTool } from '../../store/useStore';
import { useT } from '../../i18n/useT';

const TOOLS: { id: CanvasTool; icon: React.ReactNode; labelKey: string }[] = [
  { id: 'select', icon: <MousePointer2 size={16} />, labelKey: 'select' },
  { id: 'hand', icon: <Hand size={16} />, labelKey: 'hand' },
  { id: 'node', icon: <Square size={16} />, labelKey: 'create_entity' },
  { id: 'connect', icon: <Link2 size={16} />, labelKey: 'connect' },
  { id: 'frame', icon: <Frame size={16} />, labelKey: 'wb_frame' },
  { id: 'note', icon: <StickyNote size={16} />, labelKey: 'notes' },
  { id: 'text', icon: <Type size={16} />, labelKey: 'wb_text' },
];

export default function CanvasToolbar() {
  const tool = useStore((s) => s.canvasTool);
  const setCanvasTool = useStore((s) => s.setCanvasTool);
  const t = useT();

  return (
    <div className="canvas-toolbar" role="toolbar" aria-label="Canvas tools">
      {TOOLS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`btn btn-icon${tool === item.id ? ' active' : ''}`}
          title={t(item.labelKey)}
          onClick={() => setCanvasTool(item.id)}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
