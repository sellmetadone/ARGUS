import { memo } from 'react';
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

const handleStyle = (color: string): React.CSSProperties => ({
  background: color,
  width: 9,
  height: 9,
  border: '2px solid #0f172a',
});

function EntityNode({ data, selected }: NodeProps) {
  const nodeData = data as EntityNodeData;
  const appearance = useStore((s) => s.appearance);
  const graphSettings = useStore((s) => s.graphSettings);
  const custom = appearance.entityColors?.[nodeData.entityType];
  const color = custom || ENTITY_COLORS[nodeData.entityType] || '#64748b';
  const icon = ENTITY_ICONS[nodeData.entityType] || '●';
  const scale = graphSettings.nodeSize;
  const isActive = selected || nodeData.highlighted;

  return (
    <div
      style={{
        background: isActive ? `${color}33` : appearance.theme === 'light' ? '#fff' : '#1e1e2e',
        border: `2px solid ${isActive ? color : appearance.theme === 'light' ? '#cbd5e1' : '#334155'}`,
        borderRadius: appearance.borderRadius,
        padding: `${6 * scale}px ${10 * scale}px`,
        minWidth: 100 * scale,
        maxWidth: 220 * scale,
        boxShadow: isActive
          ? `0 0 14px ${color}66`
          : appearance.theme === 'light'
            ? '0 1px 4px rgba(0,0,0,0.1)'
            : '0 2px 8px rgba(0,0,0,0.4)',
        transition: appearance.animations ? 'box-shadow 0.2s, border-color 0.2s' : 'none',
        cursor: 'pointer',
        position: 'relative',
        opacity: appearance.transparency,
      }}
    >
      {nodeData.pinned && (
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: appearance.accentColor,
            borderRadius: '50%',
            width: 14,
            height: 14,
            fontSize: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          📌
        </div>
      )}

      <Handle type="target" position={Position.Top} id="t-top" style={handleStyle(color)} />
      <Handle type="source" position={Position.Top} id="s-top" style={{ ...handleStyle(color), top: -5 }} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={handleStyle(color)} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" style={{ ...handleStyle(color), bottom: -5 }} />
      <Handle type="target" position={Position.Left} id="t-left" style={handleStyle(color)} />
      <Handle type="source" position={Position.Left} id="s-left" style={{ ...handleStyle(color), left: -5 }} />
      <Handle type="target" position={Position.Right} id="t-right" style={handleStyle(color)} />
      <Handle type="source" position={Position.Right} id="s-right" style={{ ...handleStyle(color), right: -5 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 * scale }}>{icon}</span>
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontSize: 10 * scale,
              color,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            {nodeData.entityType}
          </div>
          <div
            style={{
              fontSize: 12 * scale,
              color: appearance.theme === 'light' ? '#0f172a' : '#e2e8f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={nodeData.label}
          >
            {nodeData.label}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EntityNode);
