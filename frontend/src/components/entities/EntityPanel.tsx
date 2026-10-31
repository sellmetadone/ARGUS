import { X, Trash2, Pin } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ENTITY_COLORS } from '../../types';

export default function EntityPanel() {
  const {
    selectedEntityId,
    selectedRelationshipId,
    entities,
    relationships,
    setSelectedEntity,
    setSelectedRelationship,
    removeEntity,
    updateEntity,
    togglePinNode,
    pinnedNodeIds,
    appearance,
  } = useStore();

  const entity = entities.find((e) => e.id === selectedEntityId);
  const rel = relationships.find((r) => r.id === selectedRelationshipId);

  if (!entity && !rel) return null;

  return (
    <div
      style={{
        width: 320,
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: 1 }}>
          {entity ? 'ENTITY' : 'RELATIONSHIP'}
        </span>
        <button
          onClick={() => {
            setSelectedEntity(null);
            setSelectedRelationship(null);
          }}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {entity && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: ENTITY_COLORS[entity.type] || appearance.accentColor,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {entity.type}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>{entity.label}</div>
            {entity.source && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Source: {entity.source}</div>
            )}
            {entity.confidence != null && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Confidence: {entity.confidence}%</div>
            )}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 16, marginBottom: 8 }}>PROPERTIES</div>
            {Object.entries(entity.properties || {}).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: '#e2e8f0' }}>{String(v)}</span>
              </div>
            ))}
            <textarea
              value={entity.notes || ''}
              onChange={(e) => updateEntity(entity.id, { notes: e.target.value })}
              placeholder="Notes…"
              style={{
                width: '100%',
                marginTop: 16,
                minHeight: 80,
                padding: 8,
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#e2e8f0',
                fontSize: 12,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => togglePinNode(entity.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: pinnedNodeIds.includes(entity.id) ? '#1e1b4b' : '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  color: '#94a3b8',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <Pin size={14} /> {pinnedNodeIds.includes(entity.id) ? 'Pinned' : 'Pin'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Delete entity?')) removeEntity(entity.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: '#3f1d1d',
                  border: '1px solid #7f1d1d',
                  borderRadius: 6,
                  color: '#fca5a5',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
        {rel && (
          <>
            <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{rel.type}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              {rel.sourceId} → {rel.targetId}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
