import { useMemo } from 'react';
import { X, Trash2, ArrowRightLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { RELATIONSHIP_LABELS, type RelationshipType } from '../../types';
import { useT } from '../../i18n/useT';

const RELATIONSHIP_TYPES = Object.keys(RELATIONSHIP_LABELS) as RelationshipType[];

const STATUS_OPTIONS = [
  { value: 'confirmed', labelKey: 'rel_status_confirmed' },
  { value: 'suspected', labelKey: 'rel_status_suspected' },
  { value: 'unknown', labelKey: 'rel_status_unknown' },
] as const;

const STYLE_OPTIONS = [
  { value: 'solid', labelKey: 'rel_style_solid' },
  { value: 'dashed', labelKey: 'rel_style_dashed' },
  { value: 'animated', labelKey: 'rel_style_animated' },
] as const;

export default function ConnectionEditor() {
  const t = useT();
  const {
    selectedRelationshipId,
    relationships,
    entities,
    setSelectedRelationship,
    updateRelationship,
    removeRelationship,
    setHighlightedPath,
  } = useStore();

  const rel = relationships.find((r) => r.id === selectedRelationshipId);

  const sourceEntity = useMemo(
    () => (rel ? entities.find((e) => e.id === rel.sourceId) : null),
    [rel, entities]
  );
  const targetEntity = useMemo(
    () => (rel ? entities.find((e) => e.id === rel.targetId) : null),
    [rel, entities]
  );

  if (!rel) return null;

  const status = String(rel.properties?.status || 'unknown');
  const lineStyle = String(rel.properties?.lineStyle || 'solid');
  const description = String(rel.properties?.description || '');
  const direction = String(rel.properties?.direction || 'forward');

  const patchProps = (partial: Record<string, string | number>) => {
    updateRelationship(rel.id, {
      properties: { ...rel.properties, ...partial },
    });
  };

  const swapDirection = () => {
    updateRelationship(rel.id, {
      sourceId: rel.targetId,
      targetId: rel.sourceId,
    });
  };

  return (
    <div className="conn-editor argus-panel">
      <header className="conn-editor-header">
        <span className="conn-editor-title md-label-medium">{t('connection_editor')}</span>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => setSelectedRelationship(null)}
          aria-label={t('close') || 'Close'}
        >
          <X size={18} />
        </button>
      </header>

      <div className="conn-editor-body">
        <div className="conn-endpoints">
          <div className="conn-endpoint-label">{sourceEntity?.label || rel.sourceId}</div>
          <div className="conn-arrow" aria-hidden="true">
            →
          </div>
          <div className="conn-endpoint-label">{targetEntity?.label || rel.targetId}</div>
          <button
            type="button"
            className="btn btn-outlined"
            style={{ width: '100%', marginTop: 10 }}
            onClick={() => setHighlightedPath([rel.sourceId, rel.targetId])}
          >
            {t('rel_highlight')}
          </button>
        </div>

        <label className="conn-field-label" htmlFor="conn-type">
          {t('rel_type')}
        </label>
        <select
          id="conn-type"
          className="conn-input"
          value={rel.type}
          onChange={(e) => updateRelationship(rel.id, { type: e.target.value as RelationshipType })}
        >
          {RELATIONSHIP_TYPES.map((rt) => (
            <option key={rt} value={rt}>
              {RELATIONSHIP_LABELS[rt] || rt}
            </option>
          ))}
        </select>

        <span className="conn-field-label">{t('rel_status')}</span>
        <div className="conn-chip-row">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`btn conn-chip ${status === s.value ? 'btn-filled' : 'btn-outlined'}`}
              onClick={() => patchProps({ status: s.value })}
            >
              {t(s.labelKey)}
            </button>
          ))}
        </div>
        <p className="conn-hint">{t('rel_status_disclaimer')}</p>

        <label className="conn-field-label" htmlFor="conn-confidence">
          {t('rel_confidence')} · {rel.confidence ?? 50}%
        </label>
        <input
          id="conn-confidence"
          className="conn-range"
          type="range"
          min={0}
          max={100}
          value={rel.confidence ?? 50}
          onChange={(e) => updateRelationship(rel.id, { confidence: Number(e.target.value) })}
        />

        <span className="conn-field-label">{t('rel_direction')}</span>
        <div className="conn-chip-row">
          {(['forward', 'bidirectional'] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`btn conn-chip ${direction === d ? 'btn-filled' : 'btn-outlined'}`}
              style={{ flex: 1 }}
              onClick={() => patchProps({ direction: d })}
            >
              {t(d === 'forward' ? 'rel_dir_forward' : 'rel_dir_bi')}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outlined" style={{ width: '100%', marginBottom: 12 }} onClick={swapDirection}>
          <ArrowRightLeft size={14} /> {t('rel_swap')}
        </button>

        <span className="conn-field-label">{t('rel_line_style')}</span>
        <div className="conn-chip-row" style={{ marginBottom: 12 }}>
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`btn conn-chip ${lineStyle === s.value ? 'btn-filled' : 'btn-outlined'}`}
              style={{ flex: 1 }}
              onClick={() => patchProps({ lineStyle: s.value })}
            >
              {t(s.labelKey)}
            </button>
          ))}
        </div>

        <label className="conn-field-label" htmlFor="conn-source">
          {t('rel_source')}
        </label>
        <input
          id="conn-source"
          className="conn-input"
          value={rel.source || ''}
          onChange={(e) => updateRelationship(rel.id, { source: e.target.value })}
          placeholder={t('rel_source_ph')}
        />

        <label className="conn-field-label" htmlFor="conn-desc">
          {t('rel_description')}
        </label>
        <textarea
          id="conn-desc"
          className="conn-input conn-textarea"
          value={description}
          onChange={(e) => patchProps({ description: e.target.value })}
          placeholder={t('rel_description_ph')}
          rows={3}
        />

        <div className="conn-id">
          ID: <code>{rel.id}</code>
        </div>

        <button
          type="button"
          className="btn btn-danger"
          style={{ width: '100%', marginTop: 16 }}
          onClick={() => {
            if (window.confirm(t('rel_delete_confirm'))) removeRelationship(rel.id);
          }}
        >
          <Trash2 size={14} /> {t('delete')}
        </button>
      </div>
    </div>
  );
}
