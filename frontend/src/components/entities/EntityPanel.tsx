import { X, Trash2, Pin } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ENTITY_COLORS, RELATIONSHIP_LABELS } from '../../types';
import ConnectionEditor from '../connections/ConnectionEditor';
import { useT } from '../../i18n/useT';
import { getSchema, type SchemaField } from '../../entities/entitySchemas';
import { labelFromProperties } from '../../entities/entityFactory';

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

  if (rel && !entity) return <ConnectionEditor />;
  if (!entity && !rel) return null;

  const schema = entity ? getSchema(entity.type) : null;

  const setField = (field: SchemaField, raw: string) => {
    if (!entity) return;
    const nextProps = { ...entity.properties, [field.key]: raw };
    const patch: Parameters<typeof updateEntity>[1] = { properties: nextProps };
    if (field.isLabel) {
      patch.label = labelFromProperties(entity.type, nextProps, entity.label);
    }
    updateEntity(entity.id, patch);
  };

  const fieldValue = (key: string) => {
    const v = entity?.properties?.[key];
    return v == null ? '' : String(v);
  };

  return (
    <div
      className="argus-panel"
      style={{
        width: 340,
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
        {entity && schema && (
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
              {t(schema.labelKey)}
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
                boxSizing: 'border-box',
              }}
            />

            <label style={lbl}>{t('rel_confidence')} · {entity.confidence ?? 50}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={entity.confidence ?? 50}
              onChange={(e) => updateEntity(entity.id, { confidence: Number(e.target.value) })}
              style={{ width: '100%', marginBottom: 12 }}
            />

            <label style={lbl}>{t('rel_source')}</label>
            <input
              value={entity.source || ''}
              onChange={(e) => updateEntity(entity.id, { source: e.target.value })}
              style={inp}
              placeholder={t('rel_source_ph')}
            />

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '12px 0 8px' }}>
              {t('properties').toUpperCase()}
            </div>

            {schema.fields.map((field) => (
              <div key={field.key} style={{ marginBottom: 10 }}>
                <label style={lbl}>{t(field.labelKey)}</label>
                {field.kind === 'textarea' ? (
                  <textarea
                    value={fieldValue(field.key)}
                    onChange={(e) => setField(field, e.target.value)}
                    rows={3}
                    style={{ ...inp, resize: 'vertical' }}
                  />
                ) : (
                  <input
                    type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : field.kind === 'email' ? 'email' : field.kind === 'url' ? 'url' : 'text'}
                    value={fieldValue(field.key)}
                    onChange={(e) => setField(field, e.target.value)}
                    className={field.kind === 'mono' ? 'mono' : undefined}
                    style={inp}
                  />
                )}
              </div>
            ))}

            {/* Extra keys not in schema (imported data) */}
            {Object.keys(entity.properties || {})
              .filter((k) => !schema.fields.some((f) => f.key === k))
              .map((k) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <label style={lbl}>{k}</label>
                  <input
                    value={fieldValue(k)}
                    onChange={(e) =>
                      updateEntity(entity.id, {
                        properties: { ...entity.properties, [k]: e.target.value },
                      })
                    }
                    style={inp}
                    className="mono"
                  />
                </div>
              ))}

            <label style={lbl}>{t('field_notes')}</label>
            <textarea
              value={entity.notes || ''}
              onChange={(e) => updateEntity(entity.id, { notes: e.target.value })}
              rows={3}
              style={{ ...inp, resize: 'vertical' }}
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

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 4,
};

const inp: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  fontSize: 12,
  boxSizing: 'border-box',
};
