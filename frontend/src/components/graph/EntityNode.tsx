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
  width: 8,
  height: 8,
  border: '2px solid #0f172a',
});

function EntityNode({ data, selected }: NodeProps) {
  const nodeData = data as EntityNodeData;
  const appearance = useStore((s) => s.appearance);
  const graphSettings = useStore((s) => s.graphSettings);
  const custom = appearance.entityColors?.[nodeData.entityType];
  const color = custom || ENTITY_COLORS[nodeData.entityType] || '#64748b';
  const icon = ENTITY_ICONS[nodeData.entityType] || '•';
  const scale = graphSettings.nodeSize || 1;
  const isActive = selected || nodeData.highlighted;
  const light = appearance.theme === 'light';

  return (
    <div
      style={{
        background: isActive ? `${color}28` : light ? '#ffffff' : '#0f172a',
        border: `1.5px solid ${isActive ? color : light ? '#cbd5e1' : '#334155'}`,
        borderRadius: Math.max(6, appearance.borderRadius || 8),
        padding: `${7 * scale}px ${12 * scale}px`,
        minWidth: 110 * scale,
        maxWidth: 220 * scale,
        boxShadow: isActive
          ? `0 0 0 1px ${color}55, 0 4px 16px ${color}33`
          : light
            ? '0 1px 3px rgba(0,0,0,0.08)'
            : '0 2px 8px rgba(0,0,0,0.35)',
        transition: appearance.animations === false ? 'none' : 'box-shadow 0.15s ease, border-color 0.15s ease',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {nodeData.pinned && (
        <div
          title="Pinned"
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: appearance.accentColor || color,
            border: '2px solid #0f172a',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.15)',
          }}
        />
      )}

      <Handle type="target" position={Position.Top} id="t-top" style={handleStyle(color)} />
      <Handle type="source" position={Position.Top} id="s-top" style={{ ...handleStyle(color), top: -4 }} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={handleStyle(color)} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" style={{ ...handleStyle(color), bottom: -4 }} />
      <Handle type="target" position={Position.Left} id="t-left" style={handleStyle(color)} />
      <Handle type="source" position={Position.Left} id="s-left" style={{ ...handleStyle(color), left: -4 }} />
      <Handle type="target" position={Position.Right} id="t-right" style={handleStyle(color)} />
      <Handle type="source" position={Position.Right} id="s-right" style={{ ...handleStyle(color), right: -4 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 10 * scale,
            fontWeight: 700,
            letterSpacing: 0.3,
            color,
            background: `${color}18`,
            borderRadius: 4,
            padding: '2px 5px',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ overflow: 'hidden', minWidth: 0 }}>
          <div
            style={{
              fontSize: 9 * scale,
              color,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              opacity: 0.9,
            }}
          >
            {nodeData.entityType.replace(/_/g, ' ')}
          </div>
          <div
            style={{
              fontSize: 12 * scale,
              color: light ? '#0f172a' : '#e2e8f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 500,
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
