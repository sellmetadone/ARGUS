import { useMemo, useState, useEffect, type CSSProperties } from 'react';
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

/** pinnedNodeIds is string[] in the store (not Set). */
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
    () =>
      entityId
        ? relationships.filter((r) => r.sourceId === entityId || r.targetId === entityId)
        : [],
    [relationships, entityId]
  );

  useEffect(() => {
    if (!entity && !rel) setTab('data');
  }, [entity, rel]);

  if (!entity && !rel) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-sm text-[var(--text-muted)] p-4">
        {t('inspector_empty') || 'Select an entity or connection'}
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
    <div className="object-inspector flex flex-col h-full bg-[var(--bg-panel)] border-l border-[var(--border)]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-sm font-medium truncate flex-1">
          {entity ? entity.label || entity.type : rel ? RELATIONSHIP_LABELS[rel.type] || rel.type : ''}
        </span>
        {entity && (
          <button
            type="button"
            className="p-1 rounded hover:bg-[var(--bg-hover)]"
            title={isPinned ? 'Unpin' : 'Pin'}
            onClick={() => togglePinNode(entity.id)}
          >
            <Pin size={14} className={isPinned ? 'text-[var(--accent)]' : ''} />
          </button>
        )}
        <button type="button" className="p-1 rounded hover:bg-[var(--bg-hover)] text-red-400" title="Delete" onClick={onDelete}>
          <Trash2 size={14} />
        </button>
        <button type="button" className="p-1 rounded hover:bg-[var(--bg-hover)]" onClick={() => setPanel(null)}>
          <X size={14} />
        </button>
      </div>

      {entity && (
        <>
          <div className="flex border-b border-[var(--border)] text-xs shrink-0">
            {(['overview', 'data', 'sources', 'relations', 'history'] as Tab[]).map((tb) => (
              <button
                key={tb}
                type="button"
                className={`px-2.5 py-1.5 capitalize ${
                  tab === tb ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
                onClick={() => setTab(tb)}
              >
                {t(`inspector_tab_${tb}`) || tb}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-3 text-sm">
            {tab === 'overview' && (
              <div className="space-y-2">
                <div>
                  <span className="text-[var(--text-muted)]">Type:</span> {entity.type}
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">ID:</span>{' '}
                  <code className="text-xs">{entity.id}</code>
                </div>
                {hasGeo(entity.properties) && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[var(--accent)]"
                    onClick={() => setPanel('map')}
                  >
                    <MapIcon size={14} /> Show on map
                  </button>
                )}
              </div>
            )}
            {tab === 'data' && <EntityDataForm entity={entity} updateEntity={updateEntity} />}
            {tab === 'sources' && (
              <div className="text-[var(--text-muted)] text-xs">
                {t('inspector_sources_empty') || 'No sources attached'}
              </div>
            )}
            {tab === 'relations' && (
              <div className="space-y-1">
                {related.length === 0 && <div className="text-[var(--text-muted)] text-xs">No links</div>}
                {related.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="w-full text-left px-2 py-1 rounded hover:bg-[var(--bg-hover)] flex items-center gap-2"
                    onClick={() => setSelectedRelationship(r.id)}
                  >
                    <Link2 size={12} />
                    <span className="truncate">{RELATIONSHIP_LABELS[r.type] || r.type}</span>
                  </button>
                ))}
              </div>
            )}
            {tab === 'history' && (
              <div className="text-xs text-[var(--text-muted)]">
                {(history || [])
                  .filter((h: { entityId?: string }) => h.entityId === entity.id)
                  .slice(-20)
                  .map((h: { action?: string; type?: string; ts?: string }, i: number) => (
                    <div key={i} className="py-0.5">
                      {h.action || h.type} — {h.ts || ''}
                    </div>
                  )) || 'No history'}
              </div>
            )}
          </div>
        </>
      )}

      {rel && !entity && (
        <div className="flex-1 overflow-auto p-3">
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
    <div className="space-y-2">
      <label className="block text-xs text-[var(--text-muted)]">Label</label>
      <input
        className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg)]"
        style={inputStyle}
        value={entity.label || ''}
        onChange={(e) => updateEntity(entity.id, { label: e.target.value })}
      />
      {(schema?.fields || []).map((f: SchemaField) => (
        <div key={f.key}>
          <label className="block text-xs text-[var(--text-muted)] mb-0.5">{f.label || f.key}</label>
          <input
            className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg)]"
            style={inputStyle}
            value={String(props[f.key] ?? '')}
            onChange={(e) => onChange(f.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

const inputStyle: CSSProperties = {
  color: 'var(--text)',
  fontSize: 12,
  boxSizing: 'border-box',
};
