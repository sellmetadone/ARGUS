import { useMemo } from 'react';
import { GitCompare, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { runCorrelation } from '../../services/intelligence/correlationEngine';
import { listEvidence } from '../../services/intelligence/evidenceService';
import { useT } from '../../i18n/useT';

export default function CorrelationPanel() {
  const t = useT();
  const {
    activeCaseId,
    getEntitiesForCase,
    getRelationshipsForCase,
    setHighlightedPath,
    setSelectedEntity,
    setPanel,
  } = useStore();

  const entities = activeCaseId ? getEntitiesForCase(activeCaseId) : [];
  const relationships = activeCaseId ? getRelationshipsForCase(activeCaseId) : [];
  const evidence = activeCaseId ? listEvidence(activeCaseId) : [];

  const findings = useMemo(
    () => runCorrelation(entities, relationships, evidence),
    [entities, relationships, evidence]
  );

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
        overflow: 'hidden',
        color: 'var(--text)',
      }}
    >
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          <GitCompare size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          {t('correlate')}
        </span>
        <button type="button" className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setPanel('correlation', false)}>
          <X size={14} />
        </button>
      </div>
      <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
        {t('corr_disclaimer')}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {findings.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('corr_empty')}</div>
        )}
        {findings.map((f) => (
          <div
            key={f.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{f.title}</span>
              <span style={{ color: severityColor(f.severity), fontSize: 11 }}>{f.severity}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>{f.basis}</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 11 }}>
              {t('rel_confidence')} {f.confidence}% · {f.limitations}
            </div>
            {f.dataUsed.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: 'var(--text-muted)', fontSize: 11 }}>
                {f.dataUsed.slice(0, 6).map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (f.entityIds[0]) setSelectedEntity(f.entityIds[0]);
                setHighlightedPath(f.entityIds);
              }}
              style={{ marginTop: 8, fontSize: 11 }}
            >
              {t('corr_highlight')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function severityColor(s: string) {
  if (s === 'critical') return '#f87171';
  if (s === 'warning') return '#fbbf24';
  return 'var(--text-muted)';
}
