import { memo, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ENTITY_COLORS, ENTITY_ICONS, type EntityType } from '../../types';
import { useStore } from '../../store/useStore';

export interface EntityNodeData {
  label: string;
  entityType: EntityType;
  selected?: boolean;
  highlighted?: boolean;
  pinned?: boolean;
  [key: string]: unknown;
}

const handleStyle = (color: string): CSSProperties => ({
  width: 8,
  height: 8,
  border: '2px solid var(--panel, #fff)',
  background: color,
  opacity: 0.92,
});

function EntityNode({ data, selected }: NodeProps) {
  const nodeData = data as EntityNodeData;
  const entityColor = useStore((s) => s.appearance.entityColors?.[nodeData.entityType]);
  const nodeSize = useStore((s) => s.graphSettings.nodeSize);
  const color = entityColor || ENTITY_COLORS[nodeData.entityType] || '#64748b';
  const icon = ENTITY_ICONS[nodeData.entityType] || 'ITEM';
  const scale = Math.max(0.8, Math.min(1.35, nodeSize || 1));
  const active = Boolean(selected || nodeData.selected || nodeData.highlighted);
  const title = String(nodeData.label || 'Untitled entity');
  const typeLabel = String(nodeData.entityType || 'entity').replace(/_/g, ' ');

  return (
    <article
      className={`argus-entity-node${active ? ' is-active' : ''}${nodeData.pinned ? ' is-pinned' : ''}`}
      style={
        {
          '--entity-accent': color,
          '--node-scale': scale,
        } as CSSProperties
      }
      title={title}
      aria-label={`${typeLabel}: ${title}`}
    >
      <Handle type="target" position={Position.Top} id="t-top" className="argus-node-handle" style={handleStyle(color)} />
      <Handle type="source" position={Position.Top} id="s-top" className="argus-node-handle" style={{ ...handleStyle(color), top: -4 }} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="argus-node-handle" style={handleStyle(color)} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="argus-node-handle" style={{ ...handleStyle(color), bottom: -4 }} />
      <Handle type="target" position={Position.Left} id="t-left" className="argus-node-handle" style={handleStyle(color)} />
      <Handle type="source" position={Position.Left} id="s-left" className="argus-node-handle" style={{ ...handleStyle(color), left: -4 }} />
      <Handle type="target" position={Position.Right} id="t-right" className="argus-node-handle" style={handleStyle(color)} />
      <Handle type="source" position={Position.Right} id="s-right" className="argus-node-handle" style={{ ...handleStyle(color), right: -4 }} />

      <div className="argus-node-accent" />
      <div className="argus-node-content">
        <span className="argus-node-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="argus-node-copy">
          <span className="argus-node-type">{typeLabel}</span>
          <span className="argus-node-title">{title}</span>
        </div>
        {nodeData.pinned && <span className="argus-node-pin" title="Pinned" aria-label="Pinned" />}
      </div>
    </article>
  );
}

function propsEqual(a: NodeProps, b: NodeProps): boolean {
  if (a.selected !== b.selected) return false;
  const da = a.data as EntityNodeData;
  const db = b.data as EntityNodeData;
  return (
    da.label === db.label &&
    da.entityType === db.entityType &&
    da.selected === db.selected &&
    da.highlighted === db.highlighted &&
    da.pinned === db.pinned
  );
}

export default memo(EntityNode, propsEqual);
