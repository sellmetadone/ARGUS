import { useMemo, useState } from 'react';
import { GitCompare, X, Link2, Eye } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  runCorrelation,
  linkablePairs,
  suggestedTypeForFinding,
  edgeExists,
  type CorrelationFinding,
} from '../../services/intelligence/correlationEngine';
import { listEvidence } from '../../services/intelligence/evidenceService';
import { useT } from '../../i18n/useT';
import type { Relationship, RelationshipType } from '../../types';

const VALID_REL = new Set<string>([
  'resolves_to', 'has_subdomain', 'uses_certificate', 'belongs_to', 'announced_prefix',
  'uses', 'hosted_on', 'points_to', 'issued_by', 'contains', 'related_to', 'seen_with',
  'registered_by', 'located_in', 'communicates_with', 'owns', 'part_of', 'works_at',
  'employs', 'has_email', 'has_phone', 'lives_at', 'member_of', 'same_as', 'controls',
]);

function safeRelType(raw: string): RelationshipType {
  return (VALID_REL.has(raw) ? raw : 'related_to') as RelationshipType;
}

export default function CorrelationPanel() {
  const t = useT();
  const {
    activeCaseId,
    getEntitiesForCase,
    getRelationshipsForCase,
    setHighlightedPath,
    setSelectedEntity,
    setSelectedRelationship,
    setPanel,
    addRelationship,
  } = useStore();
  const [flash, setFlash] = useState('');

  const entities = activeCaseId ? getEntitiesForCase(activeCaseId) : [];
  const relationships = activeCaseId ? getRelationshipsForCase(activeCaseId) : [];
  const evidence = activeCaseId ? listEvidence(activeCaseId) : [];

  const findings = useMemo(
    () => runCorrelation(entities, relationships, evidence),
    [entities, relationships, evidence]
  );

  const labelOf = (id: string) => entities.find((e) => e.id === id)?.label || id;

  const buildRel = (
    finding: CorrelationFinding,
    sourceId: string,
    targetId: string
  ): Relationship | null => {
    if (!activeCaseId) return null;
    const type = safeRelType(suggestedTypeForFinding(finding));
    if (edgeExists(relationships, sourceId, targetId)) return null;
    const id = `rel-corr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    return {
      id,
      type,
      sourceId,
      targetId,
      caseId: activeCaseId,
      properties: {
        status: 'suspected',
        direction: 'bidirectional',
        lineStyle: 'dashed',
        fromCorrelation: finding.id,
        correlationKind: finding.kind,
      },
      createdAt: now,
      updatedAt: now,
      source: `Correlation: ${finding.kind}`,
      confidence: Math.min(finding.confidence, 60),
      firstSeen: now,
    };
  };

  const createSuspectedLink = (finding: CorrelationFinding, sourceId: string, targetId: string) => {
    const rel = buildRel(finding, sourceId, targetId);
    if (!rel) {
      setFlash(t('corr_already_linked'));
      window.setTimeout(() => setFlash(''), 2500);
      return;
    }
    addRelationship(rel);
    setSelectedRelationship(rel.id);
    setHighlightedPath([sourceId, targetId]);
    setFlash(t('corr_link_created'));
    window.setTimeout(() => setFlash(''), 2500);
  };

  /** Batch create without relying on stale relationship snapshot mid-loop. */
  const createAllPairs = (finding: CorrelationFinding) => {
    const pairs = linkablePairs(finding);
    let existing = relationships;
    let created = 0;
    let lastIds: [string, string] | null = null;
    let lastRelId = '';
    for (const [a, b] of pairs) {
      if (edgeExists(existing, a, b)) continue;
      const rel = buildRel(finding, a, b);
      if (!rel) continue;
      addRelationship(rel);
      existing = [...existing, rel];
      created++;
      lastIds = [a, b];
      lastRelId = rel.id;
    }
    if (created === 0) {
      setFlash(t('corr_already_linked'));
    } else {
      if (lastIds) setHighlightedPath(lastIds);
      if (lastRelId) setSelectedRelationship(lastRelId);
      setFlash(`${t('corr_link_created')} (${created})`);
    }
    window.setTimeout(() => setFlash(''), 2500);
  };

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
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          fontWeight: 600,
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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
        {flash && <div style={{ marginTop: 6, color: 'var(--accent)', fontWeight: 500 }}>{flash}</div>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {findings.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('corr_empty')}</div>
        )}
        {findings.map((f) => {
          const pairs = linkablePairs(f);
          return (
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (f.entityIds[0]) setSelectedEntity(f.entityIds[0]);
                    setHighlightedPath(f.entityIds);
                  }}
                  style={{ fontSize: 11 }}
                >
                  <Eye size={12} /> {t('corr_highlight')}
                </button>
                {pairs.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => createAllPairs(f)}
                    style={{ fontSize: 11 }}
                    title={t('corr_link_hint')}
                  >
                    <Link2 size={12} /> {t('corr_create_links')} ({suggestedTypeForFinding(f)})
                  </button>
                )}
              </div>
              {pairs.length > 0 && pairs.length <= 6 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pairs.map(([a, b]) => {
                    const exists = edgeExists(relationships, a, b);
                    return (
                      <button
                        key={`${a}-${b}`}
                        type="button"
                        className="btn btn-ghost"
                        disabled={exists}
                        onClick={() => createSuspectedLink(f, a, b)}
                        style={{ fontSize: 11, justifyContent: 'flex-start', opacity: exists ? 0.5 : 1 }}
                      >
                        <Link2 size={11} />
                        {labelOf(a)} ↔ {labelOf(b)}
                        {exists ? ` · ${t('corr_already_linked')}` : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function severityColor(s: string) {
  if (s === 'critical') return '#f87171';
  if (s === 'warning') return '#fbbf24';
  return 'var(--text-muted)';
}
