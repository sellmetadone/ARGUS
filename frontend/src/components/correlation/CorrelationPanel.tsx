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
    <div className="argus-side-panel md-sheet-enter correlation-panel">
      <header className="argus-side-panel__header">
        <span className="argus-side-panel__title md-label-medium">
          <GitCompare size={16} style={{ marginRight: 8, verticalAlign: -3 }} />
          {t('correlate')}
        </span>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPanel('correlation', false)} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div className="argus-side-panel__body md-stagger">
        <p className="md-muted md-stagger-item">{t('corr_disclaimer')}</p>
        {flash && <p className="md-banner md-banner--ok md-stagger-item">{flash}</p>}
        {findings.length === 0 && <p className="md-muted">{t('corr_empty')}</p>}
        {findings.map((f) => {
          const pairs = linkablePairs(f);
          return (
            <article key={f.id} className="md-result-card md-stagger-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span className="md-result-card__title">{f.title}</span>
                <span style={{ color: severityColor(f.severity), fontSize: 11 }}>{f.severity}</span>
              </div>
              <div className="md-result-card__snippet">{f.basis}</div>
              <div className="md-result-card__meta">
                {t('rel_confidence')} {f.confidence}% · {f.limitations}
              </div>
              {f.dataUsed.length > 0 && (
                <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 11 }} className="md-muted">
                  {f.dataUsed.slice(0, 6).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
              <div className="md-chip-row" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-outlined"
                  onClick={() => {
                    if (f.entityIds[0]) setSelectedEntity(f.entityIds[0]);
                    setHighlightedPath(f.entityIds);
                  }}
                >
                  <Eye size={12} /> {t('corr_highlight')}
                </button>
                {pairs.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-filled"
                    onClick={() => createAllPairs(f)}
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
                        style={{ justifyContent: 'flex-start', opacity: exists ? 0.5 : 1 }}
                      >
                        <Link2 size={11} />
                        {labelOf(a)} ↔ {labelOf(b)}
                        {exists ? ` · ${t('corr_already_linked')}` : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function severityColor(s: string) {
  if (s === 'critical') return '#f87171';
  if (s === 'warning') return '#fbbf24';
  return 'var(--md-sys-color-on-surface-variant, var(--text-muted))';
}
