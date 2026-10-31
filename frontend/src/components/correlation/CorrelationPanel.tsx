import { useMemo } from 'react';
import { GitCompare } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { runCorrelation } from '../../services/intelligence/correlationEngine';
import { listEvidence } from '../../services/intelligence/evidenceService';

export default function CorrelationPanel() {
  const {
    activeCaseId,
    getEntitiesForCase,
    getRelationshipsForCase,
    setHighlightedPath,
    setSelectedEntity,
    appearance,
  } = useStore();

  const entities = activeCaseId ? getEntitiesForCase(activeCaseId) : [];
  const relationships = activeCaseId ? getRelationshipsForCase(activeCaseId) : [];
  const evidence = activeCaseId ? listEvidence(activeCaseId) : [];

  const findings = useMemo(
    () => runCorrelation(entities, relationships, evidence),
    [entities, relationships, evidence]
  );

  const panelBg = appearance.theme === 'light' ? '#fff' : '#0f172a';

  return (
    <div
      style={{
        width: 360,
        background: panelBg,
        borderLeft: '1px solid #1e293b',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e293b', fontWeight: 600, fontSize: 13 }}>
        <GitCompare size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
        Correlation Results
      </div>
      <div style={{ padding: '8px 12px', fontSize: 11, color: '#64748b', borderBottom: '1px solid #1e293b' }}>
        Findings are hypotheses with stated limitations — not established facts.
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {findings.length === 0 && (
          <div style={{ fontSize: 12, color: '#64748b' }}>No correlation findings for this case snapshot.</div>
        )}
        {findings.map((f) => (
          <div
            key={f.id}
            style={{
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{f.title}</span>
              <span style={{ color: severityColor(f.severity), fontSize: 11 }}>{f.severity}</span>
            </div>
            <div style={{ color: '#94a3b8', marginTop: 6 }}>{f.basis}</div>
            <div style={{ color: '#64748b', marginTop: 4, fontSize: 11 }}>
              Confidence {f.confidence}% · {f.limitations}
            </div>
            {f.dataUsed.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: '#94a3b8', fontSize: 11 }}>
                {f.dataUsed.slice(0, 6).map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => {
                if (f.entityIds[0]) setSelectedEntity(f.entityIds[0]);
                setHighlightedPath(f.entityIds);
              }}
              style={{
                marginTop: 8,
                padding: '4px 8px',
                background: 'transparent',
                border: '1px solid #334155',
                borderRadius: 4,
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Highlight entities
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
  return '#94a3b8';
}
