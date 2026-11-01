import { useMemo, useState } from 'react';
import { X, Trash2, Pin, History, Link2, FileText, Info } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ENTITY_COLORS, RELATIONSHIP_LABELS } from '../../types';
import ConnectionEditor from '../connections/ConnectionEditor';
import { useT } from '../../i18n/useT';
import { getSchema, type SchemaField } from '../../entities/entitySchemas';
import { labelFromProperties } from '../../entities/entityFactory';

type Tab = 'overview' | 'data' | 'sources' | 'relations' | 'history';

export default function ObjectInspector() {
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
    history,
  } = useStore();

  const [tab, setTab] = useState<Tab>('data');
  const entity = entities.find((e) => e.id === selectedEntityId) ?? null;
  const rel = relationships.find((r) => r.id === selectedRelationshipId) ?? null;

  // All hooks must run every render — never after early return
  const entityId = entity?.id;
  const related = useMemo(
    () =>
      entityId
        ? relationships.filter((r) => r.sourceId === entityId || r.targetId === entityId)
        : [],
    [relationships, entityId]
  );
  const schema = useMemo(() => (entity ? getSchema(entity.type) : null), [entity]);

  if (rel && !entity) return <ConnectionEditor />;
  if (!entity || !schema) return null;

  const setField = (field: SchemaField, raw: string) => {
    const nextProps = { ...entity.properties, [field.key]: raw };
    const patch: Parameters<typeof updateEntity>[1] = { properties: nextProps };
    if (field.isLabel) {
      patch.label = labelFromProperties(entity.type, nextProps, entity.label);
    }
    updateEntity(entity.id, patch);
  };

  const fieldValue = (key: string) => {
    const v = entity.properties?.[key];
    return v == null ? '' : String(v);
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'overview', icon: <Info size={13} />, label: t('insp_overview') },
    { id: 'data', icon: <FileText size={13} />, label: t('insp_data') },
    { id: 'sources', icon: <FileText size={13} />, label: t('insp_sources') },
    { id: 'relations', icon: <Link2 size={13} />, label: t('insp_relations') },
    { id: 'history', icon: <History size={13} />, label: t('insp_history') },
  ];

  return (
    <div
      className="argus-panel"
      style={{
        width: 360,
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
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
          {t('inspector')}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: 4 }}
          onClick={() => {
            setSelectedEntity(null);
            setSelectedRelationship(null);
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: ENTITY_COLORS[entity.type] || appearance.accentColor,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          {t(schema.labelKey)}
        </div>
        <input
          value={entity.label}
          onChange={(e) => updateEntity(entity.id, { label: e.target.value })}
          style={{
            width: '100%',
            fontSize: 15,
            fontWeight: 600,
            padding: '6px 8px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '6px 8px',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tb) => (
          <button
            key={tb.id}
            type="button"
            className={`btn ${tab === tb.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap' }}
            onClick={() => setTab(tb.id)}
          >
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, fontSize: 12 }}>
        {tab === 'overview' && (
          <>
            <Row label="ID" value={entity.id} mono />
            <Row label={t('insp_type')} value={entity.type} />
            <Row label={t('insp_created')} value={entity.createdAt?.slice(0, 19) || '—'} />
            <Row label={t('insp_updated')} value={entity.updatedAt?.slice(0, 19) || '—'} />
            <Row label={t('insp_first_seen')} value={entity.firstSeen?.slice(0, 19) || '—'} />
            <Row label={t('insp_last_seen')} value={entity.lastSeen?.slice(0, 19) || '—'} />
            <label style={lbl}>{t('rel_confidence')} · {entity.confidence ?? 50}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={entity.confidence ?? 50}
              onChange={(e) => updateEntity(entity.id, { confidence: Number(e.target.value) })}
              style={{ width: '100%', marginBottom: 12 }}
            />
            <label style={lbl}>{t('field_notes')}</label>
            <textarea
              value={entity.notes || ''}
              onChange={(e) => updateEntity(entity.id, { notes: e.target.value })}
              rows={4}
              style={{ ...inp, resize: 'vertical' }}
            />
          </>
        )}

        {tab === 'data' && (
          <>
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
                    type={
                      field.kind === 'number'
                        ? 'number'
                        : field.kind === 'date'
                          ? 'date'
                          : field.kind === 'email'
                            ? 'email'
                            : field.kind === 'url'
                              ? 'url'
                              : 'text'
                    }
                    value={fieldValue(field.key)}
                    onChange={(e) => setField(field, e.target.value)}
                    className={field.kind === 'mono' ? 'mono' : undefined}
                    style={inp}
                  />
                )}
              </div>
            ))}
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
                    className="mono"
                    style={inp}
                  />
                </div>
              ))}
          </>
        )}

        {tab === 'sources' && (
          <>
            <label style={lbl}>{t('rel_source')}</label>
            <input
              value={entity.source || ''}
              onChange={(e) => updateEntity(entity.id, { source: e.target.value })}
              placeholder={t('rel_source_ph')}
              style={inp}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
              {t('insp_source_hint')}
            </p>
            <label style={lbl}>{t('field_tags')}</label>
            <input
              value={(entity.tags || []).join(', ')}
              onChange={(e) =>
                updateEntity(entity.id, {
                  tags: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="tag1, tag2"
              style={inp}
            />
          </>
        )}

        {tab === 'relations' && (
          <>
            {related.length === 0 && (
              <div style={{ color: 'var(--text-muted)' }}>{t('insp_no_relations')}</div>
            )}
            {related.map((r) => {
              const otherId = r.sourceId === entity.id ? r.targetId : r.sourceId;
              const other = entities.find((e) => e.id === otherId);
              return (
                <button
                  key={r.id}
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    marginBottom: 6,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                  onClick={() => {
                    setSelectedEntity(null);
                    setSelectedRelationship(r.id);
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {RELATIONSHIP_LABELS[r.type] || r.type}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {other?.label || otherId} · {r.confidence ?? '—'}%
                  </span>
                </button>
              );
            })}
          </>
        )}

        {tab === 'history' && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>
              {t('insp_history_hint')}
            </p>
            {history.slice(-15).reverse().map((h) => (
              <div
                key={h.id}
                style={{
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11,
                }}
              >
                <div style={{ color: 'var(--text)' }}>{h.label}</div>
                <div style={{ color: 'var(--text-muted)' }}>{h.timestamp.slice(0, 19)}</div>
              </div>
            ))}
            {history.length === 0 && (
              <div style={{ color: 'var(--text-muted)' }}>{t('insp_no_history')}</div>
            )}
          </>
        )}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={() => togglePinNode(entity.id)}>
          <Pin size={14} /> {pinnedNodeIds.includes(entity.id) ? t('insp_unpin') : t('insp_pin')}
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm(t('insp_delete_confirm'))) {
              const id = entity.id;
              setSelectedEntity(null);
              setSelectedRelationship(null);
              removeEntity(id);
            }
          }}
        >
          <Trash2 size={14} /> {t('delete')}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px solid var(--border)',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className={mono ? 'mono' : undefined} style={{ color: 'var(--text)', textAlign: 'right', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 4,
  marginTop: 4,
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
