/** Correlation Engine — explainable findings, never presented as proven facts. */
import type { Entity, Relationship } from '../../types';
import type { EvidenceItem } from './evidenceService';

export type FindingSeverity = 'info' | 'warning' | 'critical';
export type CorrelationFinding = {
  id: string;
  kind: 'duplicate_label' | 'duplicate_property' | 'shared_source' | 'weak_link' | 'possible_contradiction' | 'orphan_edge';
  title: string;
  basis: string;
  dataUsed: string[];
  entityIds: string[];
  relationshipIds: string[];
  sourceRefs: string[];
  confidence: number;
  limitations: string;
  severity: FindingSeverity;
};

function normalizeLabel(s: string): string { return s.trim().toLowerCase(); }

export function findDuplicateLabels(entities: Entity[]): CorrelationFinding[] {
  const map = new Map<string, Entity[]>();
  for (const e of entities) {
    const k = normalizeLabel(e.label);
    if (!k) continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  }
  const findings: CorrelationFinding[] = [];
  for (const [, group] of map) {
    if (group.length < 2) continue;
    findings.push({
      id: `dup-label-${group.map((g) => g.id).join('-')}`,
      kind: 'duplicate_label',
      title: `Possible duplicate labels: "${group[0].label}"`,
      basis: 'Multiple entities share the same normalized label string.',
      dataUsed: group.map((g) => `${g.id}:${g.type}:${g.label}`),
      entityIds: group.map((g) => g.id), relationshipIds: [],
      sourceRefs: group.map((g) => g.source || '').filter(Boolean),
      confidence: 70,
      limitations: 'Same label does not prove same real-world object (homonyms, typos, aliases).',
      severity: 'warning',
    });
  }
  return findings;
}

export function findDuplicatePropertyValues(entities: Entity[], keys = ['email', 'phone', 'ip', 'domain', 'hash', 'url']): CorrelationFinding[] {
  const findings: CorrelationFinding[] = [];
  for (const key of keys) {
    const map = new Map<string, Entity[]>();
    for (const e of entities) {
      const raw = e.properties?.[key];
      if (raw == null || raw === '') continue;
      const v = String(raw).trim().toLowerCase();
      if (!map.has(v)) map.set(v, []);
      map.get(v)!.push(e);
    }
    for (const [val, group] of map) {
      if (group.length < 2) continue;
      findings.push({
        id: `dup-prop-${key}-${val.slice(0, 32)}`, kind: 'duplicate_property',
        title: `Repeated ${key}: ${val}`,
        basis: `Property "${key}" has the same value on multiple entities.`,
        dataUsed: group.map((g) => `${g.id}.${key}=${val}`),
        entityIds: group.map((g) => g.id), relationshipIds: [], sourceRefs: [],
        confidence: 75, limitations: 'Shared attribute may be coincidence, shared infrastructure, or data error.', severity: 'info',
      });
    }
  }
  return findings;
}

export function findSharedSources(entities: Entity[]): CorrelationFinding[] {
  const map = new Map<string, Entity[]>();
  for (const e of entities) {
    const s = (e.source || '').trim();
    if (!s) continue;
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(e);
  }
  const findings: CorrelationFinding[] = [];
  for (const [src, group] of map) {
    if (group.length < 3) continue;
    findings.push({
      id: `src-${src.slice(0, 40)}`, kind: 'shared_source', title: `Common source: ${src}`,
      basis: 'Three or more entities cite the same source string.',
      dataUsed: group.map((g) => g.id), entityIds: group.map((g) => g.id), relationshipIds: [], sourceRefs: [src],
      confidence: 60, limitations: 'Shared source increases correlation of collection, not independent confirmation.', severity: 'info',
    });
  }
  return findings;
}

export function findWeakLinks(relationships: Relationship[]): CorrelationFinding[] {
  return relationships.filter((r) => (r.confidence ?? 100) < 50).map((r) => ({
    id: `weak-${r.id}`, kind: 'weak_link' as const,
    title: `Low-confidence relationship: ${r.type}`,
    basis: `Relationship confidence is ${r.confidence ?? 0} (< 50).`,
    dataUsed: [`${r.sourceId} -[${r.type}]-> ${r.targetId}`, `confidence=${r.confidence}`],
    entityIds: [r.sourceId, r.targetId], relationshipIds: [r.id], sourceRefs: r.source ? [r.source] : [],
    confidence: r.confidence ?? 0, limitations: 'Low confidence means insufficient support; do not treat as established fact.', severity: 'warning' as const,
  }));
}

export function findOrphanEdges(entities: Entity[], relationships: Relationship[]): CorrelationFinding[] {
  const ids = new Set(entities.map((e) => e.id));
  return relationships.filter((r) => !ids.has(r.sourceId) || !ids.has(r.targetId)).map((r) => ({
    id: `orphan-${r.id}`, kind: 'orphan_edge' as const, title: 'Relationship references missing entity',
    basis: 'sourceId or targetId is not present in the entity set.',
    dataUsed: [r.id, r.sourceId, r.targetId], entityIds: [r.sourceId, r.targetId].filter((id) => ids.has(id)),
    relationshipIds: [r.id], sourceRefs: [], confidence: 95,
    limitations: 'Data integrity issue; graph analysis may skip this edge.', severity: 'critical' as const,
  }));
}

export function findPossibleContradictions(entities: Entity[], relationships: Relationship[]): CorrelationFinding[] {
  const byId = Object.fromEntries(entities.map((e) => [e.id, e]));
  const findings: CorrelationFinding[] = [];
  for (const r of relationships) {
    if (r.type !== 'same_as') continue;
    const a = byId[r.sourceId]; const b = byId[r.targetId];
    if (!a || !b) continue;
    const keys = new Set([...Object.keys(a.properties || {}), ...Object.keys(b.properties || {})]);
    const conflicts: string[] = [];
    for (const k of keys) {
      const va = a.properties?.[k]; const vb = b.properties?.[k];
      if (va == null || vb == null || va === '' || vb === '') continue;
      if (String(va).toLowerCase() !== String(vb).toLowerCase()) conflicts.push(`${k}: "${va}" vs "${vb}"`);
    }
    if (conflicts.length) {
      findings.push({
        id: `contra-${r.id}`, kind: 'possible_contradiction',
        title: `Possible contradiction on same_as: ${a.label} / ${b.label}`,
        basis: 'Entities linked as same_as have differing property values.',
        dataUsed: conflicts, entityIds: [a.id, b.id], relationshipIds: [r.id], sourceRefs: [],
        confidence: 55, limitations: 'May be data error, time variance, or incorrect same_as — not proven contradiction.', severity: 'warning',
      });
    }
  }
  return findings;
}

export function runCorrelation(entities: Entity[], relationships: Relationship[], _evidence?: EvidenceItem[]): CorrelationFinding[] {
  return [
    ...findDuplicateLabels(entities),
    ...findDuplicatePropertyValues(entities),
    ...findSharedSources(entities),
    ...findWeakLinks(relationships),
    ...findOrphanEdges(entities, relationships),
    ...findPossibleContradictions(entities, relationships),
  ].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity] || b.confidence - a.confidence;
  });
}
