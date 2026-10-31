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
  const direction = String(rel.properties?.direction || 'forward'); // forward | reverse | bidirectional

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
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
          {t('connection_editor')}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setSelectedRelationship(null)}
          style={{ padding: 4 }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, fontSize: 12 }}>
        <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text)', fontWeight: 500 }}>{sourceEntity?.label || rel.sourceId}</div>
          <div style={{ color: 'var(--text-muted)', margin: '4px 0', fontSize: 11 }}>→</div>
          <div style={{ color: 'var(--text)', fontWeight: 500 }}>{targetEntity?.label || rel.targetId}</div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 8, width: '100%' }}
            onClick={() => setHighlightedPath([rel.sourceId, rel.targetId])}
          >
            {t('rel_highlight')}
          </button>
        </div>

        <label style={fieldLabel}>{t('rel_type')}</label>
        <select
          value={rel.type}
          onChange={(e) => updateRelationship(rel.id, { type: e.target.value as RelationshipType })}
          style={inputStyle}
        >
          {RELATIONSHIP_TYPES.map((rt) => (
            <option key={rt} value={rt}>
              {RELATIONSHIP_LABELS[rt] || rt}
            </option>
          ))}
        </select>

        <label style={fieldLabel}>{t('rel_status')}</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`btn ${status === s.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 11, padding: '4px 8px' }}
              onClick={() => patchProps({ status: s.value })}
            >
              {t(s.labelKey)}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          {t('rel_status_disclaimer')}
        </p>

        <label style={fieldLabel}>{t('rel_confidence')} · {rel.confidence ?? 50}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={rel.confidence ?? 50}
          onChange={(e) => updateRelationship(rel.id, { confidence: Number(e.target.value) })}
          style={{ width: '100%', marginBottom: 12 }}
        />

        <label style={fieldLabel}>{t('rel_direction')}</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {(['forward', 'bidirectional'] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`btn ${direction === d ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 11, flex: 1 }}
              onClick={() => patchProps({ direction: d })}
            >
              {t(d === 'forward' ? 'rel_dir_forward' : 'rel_dir_bi')}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginBottom: 12 }} onClick={swapDirection}>
          <ArrowRightLeft size={14} /> {t('rel_swap')}
        </button>

        <label style={fieldLabel}>{t('rel_line_style')}</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`btn ${lineStyle === s.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 11, flex: 1 }}
              onClick={() => patchProps({ lineStyle: s.value })}
            >
              {t(s.labelKey)}
            </button>
          ))}
        </div>

        <label style={fieldLabel}>{t('rel_source')}</label>
        <input
          value={rel.source || ''}
          onChange={(e) => updateRelationship(rel.id, { source: e.target.value })}
          placeholder={t('rel_source_ph')}
          style={inputStyle}
        />

        <label style={fieldLabel}>{t('rel_description')}</label>
        <textarea
          value={description}
          onChange={(e) => patchProps({ description: e.target.value })}
          placeholder={t('rel_description_ph')}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          ID: <span className="mono">{rel.id}</span>
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

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 4,
  marginTop: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  marginBottom: 10,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  fontSize: 12,
  boxSizing: 'border-box',
};
