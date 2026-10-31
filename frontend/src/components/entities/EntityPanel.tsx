import { X, Trash2, Pin } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ENTITY_COLORS, RELATIONSHIP_LABELS } from '../../types';
import ConnectionEditor from '../connections/ConnectionEditor';
import { useT } from '../../i18n/useT';

export default function EntityPanel() {
  const t = useT();
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

  // Full connection editor when a relationship is selected
  if (rel && !entity) {
    return <ConnectionEditor />;
  }

  if (!entity && !rel) return null;

  return (
    <div
      className="argus-panel"
      style={{
        width: 320,
        background: 'var(--panel)',
        borderLeft: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1 }}>
          {t('entity').toUpperCase()}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setSelectedEntity(null);
            setSelectedRelationship(null);
          }}
          style={{ padding: 4 }}
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
            <input
              value={entity.label}
              onChange={(e) => updateEntity(entity.id, { label: e.target.value })}
              style={{
                width: '100%',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 12,
                padding: '6px 8px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 6,
              }}
            />
            {entity.source && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Source: {entity.source}
              </div>
            )}
            {entity.confidence != null && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Confidence: {entity.confidence}%
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 16, marginBottom: 8 }}>
              {t('properties').toUpperCase()}
            </div>
            {Object.entries(entity.properties || {}).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  padding: '4px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span className="mono" style={{ color: 'var(--text)' }}>
                  {String(v)}
                </span>
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
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text)',
                fontSize: 12,
                resize: 'vertical',
              }}
            />
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                {t('relations').toUpperCase()}
              </div>
              {relationships
                .filter((r) => r.sourceId === entity.id || r.targetId === entity.id)
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4, fontSize: 12 }}
                    onClick={() => {
                      setSelectedEntity(null);
                      setSelectedRelationship(r.id);
                    }}
                  >
                    {RELATIONSHIP_LABELS[r.type] || r.type} · {r.confidence ?? '—'}%
                  </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => togglePinNode(entity.id)}>
                <Pin size={14} /> {pinnedNodeIds.includes(entity.id) ? 'Pinned' : 'Pin'}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm('Delete entity?')) removeEntity(entity.id);
                }}
              >
                <Trash2 size={14} /> {t('delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
