import { useMemo, useState, useEffect } from 'react';
import { X, Trash2, Pin, Link2, Map as MapIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ENTITY_COLORS, RELATIONSHIP_LABELS } from '../../types';
import ConnectionEditor from '../connections/ConnectionEditor';
import { useT } from '../../i18n/useT';
import { getSchema, type SchemaField } from '../../entities/entitySchemas';

type Tab = 'overview' | 'data' | 'sources' | 'relations' | 'history';

function hasGeo(props: Record<string, unknown> | undefined): boolean {
  if (!props) return false;
  const lat = Number(props.lat ?? props.latitude);
  const lng = Number(props.lng ?? props.lon ?? props.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return true;
  const raw = props.coordinates ?? props.geo;
  return typeof raw === 'string' && raw.includes(',');
}

function isPinnedId(pinned: unknown, id: string): boolean {
  if (!pinned) return false;
  if (Array.isArray(pinned)) return pinned.includes(id);
  if (typeof (pinned as { has?: (x: string) => boolean }).has === 'function') {
    return (pinned as { has: (x: string) => boolean }).has(id);
  }
  return false;
}

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
    history,
    setPanel,
  } = useStore();

  const [tab, setTab] = useState<Tab>('data');
  const entity = entities.find((e) => e.id === selectedEntityId) ?? null;
  const rel = relationships.find((r) => r.id === selectedRelationshipId) ?? null;
  const entityId = entity?.id;
  const related = useMemo(
    () => (entityId ? relationships.filter((r) => r.sourceId === entityId || r.targetId === entityId) : []),
    [relationships, entityId]
  );

  useEffect(() => {
    if (!entity && !rel) setTab('data');
  }, [entity, rel]);

  if (!entity && !rel) {
    return (
      <div className="object-inspector argus-side-panel">
        <div className="argus-side-panel__empty md-muted">
          {t('inspector_empty') || 'Select an entity or connection'}
        </div>
      </div>
    );
  }

  const onDelete = () => {
    if (entity) {
      setSelectedEntity(null);
      queueMicrotask(() => removeEntity(entity.id));
    } else if (rel) {
      setSelectedRelationship(null);
    }
  };

  const isPinned = entity ? isPinnedId(pinnedNodeIds, entity.id) : false;
  const color = entity ? ENTITY_COLORS[entity.type] || '#64748b' : '#64748b';

  return (
    <div className="object-inspector argus-side-panel md-sheet-enter">
      <header className="argus-side-panel__header">
        <span className="oi-dot" style={{ background: color }} aria-hidden />
        <span className="argus-side-panel__title md-label-medium">
          {entity ? entity.label || entity.type : rel ? RELATIONSHIP_LABELS[rel.type] || rel.type : ''}
        </span>
        {entity && (
          <button type="button" className={`btn btn-ghost btn-icon ${isPinned ? 'is-active' : ''}`} title={isPinned ? 'Unpin' : 'Pin'} onClick={() => togglePinNode(entity.id)}>
            <Pin size={16} />
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-icon btn-danger" title="Delete" onClick={onDelete}>
          <Trash2 size={16} />
        </button>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPanel(null)} aria-label="Close">
          <X size={16} />
        </button>
      </header>

      {entity && (
        <>
          <nav className="md-tabs" role="tablist" aria-label="Inspector tabs">
            {(['overview', 'data', 'sources', 'relations', 'history'] as Tab[]).map((tb) => (
              <button key={tb} type="button" role="tab" aria-selected={tab === tb} className={`md-tabs__tab ${tab === tb ? 'is-selected' : ''}`} onClick={() => setTab(tb)}>
                {t(`inspector_tab_${tb}`) || tb}
              </button>
            ))}
          </nav>

          <div className="argus-side-panel__body md-stagger">
            {tab === 'overview' && (
              <section className="md-section md-stagger-item">
                <h3 className="md-section__title">Overview</h3>
                <div className="md-section__body">
                  <div className="oi-kv"><span className="oi-kv__k">Type</span><span className="oi-kv__v">{entity.type}</span></div>
                  <div className="oi-kv"><span className="oi-kv__k">ID</span><code className="oi-kv__v oi-code">{entity.id}</code></div>
                  {hasGeo(entity.properties) && (
                    <button type="button" className="btn btn-outlined" onClick={() => setPanel('map')}>
                      <MapIcon size={14} /> Show on map
                    </button>
                  )}
                </div>
              </section>
            )}

            {tab === 'data' && (
              <section className="md-section md-stagger-item">
                <h3 className="md-section__title">Data</h3>
                <div className="md-section__body">
                  <EntityDataForm entity={entity} updateEntity={updateEntity} />
                </div>
              </section>
            )}

            {tab === 'sources' && (
              <section className="md-section md-stagger-item">
                <h3 className="md-section__title">Sources</h3>
                <p className="md-muted">{t('inspector_sources_empty') || 'No sources attached'}</p>
              </section>
            )}

            {tab === 'relations' && (
              <section className="md-section md-stagger-item">
                <h3 className="md-section__title">Relations</h3>
                <div className="md-section__body">
                  {related.length === 0 && <p className="md-muted">No links</p>}
                  <ul className="oi-rel-list">
                    {related.map((r) => (
                      <li key={r.id}>
                        <button type="button" className="oi-rel-item" onClick={() => setSelectedRelationship(r.id)}>
                          <Link2 size={14} />
                          <span className="truncate">{RELATIONSHIP_LABELS[r.type] || r.type}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {tab === 'history' && (
              <section className="md-section md-stagger-item">
                <h3 className="md-section__title">History</h3>
                <div className="oi-history">
                  {(history || [])
                    .filter((h: { entityId?: string }) => h.entityId === entity.id)
                    .slice(-20)
                    .map((h: { action?: string; type?: string; ts?: string }, i: number) => (
                      <div key={i} className="oi-history__row">
                        <span>{h.action || h.type}</span>
                        <span className="md-muted">{h.ts || ''}</span>
                      </div>
                    ))}
                  {(history || []).filter((h: { entityId?: string }) => h.entityId === entity.id).length === 0 && (
                    <p className="md-muted">No history</p>
                  )}
                </div>
              </section>
            )}
          </div>
        </>
      )}

      {rel && !entity && (
        <div className="argus-side-panel__body">
          <ConnectionEditor relationshipId={rel.id} />
        </div>
      )}
    </div>
  );
}

function EntityDataForm({
  entity,
  updateEntity,
}: {
  entity: { id: string; type: string; label?: string; properties?: Record<string, unknown> };
  updateEntity: (id: string, patch: Partial<{ label: string; properties: Record<string, unknown> }>) => void;
}) {
  const schema = getSchema(entity.type);
  const props = entity.properties || {};
  const onChange = (key: string, value: unknown) => {
    updateEntity(entity.id, {
      properties: { ...props, [key]: value },
      label: key === 'name' || key === 'title' ? String(value) : entity.label,
    });
  };
  return (
    <div className="oi-form">
      <label className="md-field-label" htmlFor="oi-label">Label</label>
      <input id="oi-label" className="md-select" value={entity.label || ''} onChange={(e) => updateEntity(entity.id, { label: e.target.value })} />
      {(schema?.fields || []).map((f: SchemaField) => (
        <div key={f.key}>
          <label className="md-field-label" htmlFor={`oi-${f.key}`}>{f.label || f.key}</label>
          <input id={`oi-${f.key}`} className="md-select" value={String(props[f.key] ?? '')} onChange={(e) => onChange(f.key, e.target.value)} />
        </div>
      ))}
    </div>
  );
}
