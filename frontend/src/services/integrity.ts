import type { Case, Entity, Relationship, TimelineEvent } from '../types';

export type IntegrityIssue = {
  id: string;
  severity: 'error' | 'warn';
  code: string;
  message: string;
  entityId?: string;
  relationshipId?: string;
  caseId?: string;
};

export function validateGraphIntegrity(opts: {
  cases: Case[];
  entities: Entity[];
  relationships: Relationship[];
  timeline: TimelineEvent[];
  caseId?: string | null;
}): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  let n = 0;
  const id = () => `iss-${++n}`;

  const caseIds = new Set(opts.cases.map((c) => c.id));
  const entities = opts.caseId
    ? opts.entities.filter((e) => e.caseId === opts.caseId)
    : opts.entities;
  const relationships = opts.caseId
    ? opts.relationships.filter((r) => r.caseId === opts.caseId)
    : opts.relationships;
  const timeline = opts.caseId
    ? opts.timeline.filter((t) => t.caseId === opts.caseId)
    : opts.timeline;

  const entityIds = new Set(entities.map((e) => e.id));
  const labelKey = new Map<string, string>();

  for (const e of entities) {
    if (!e.label?.trim()) {
      issues.push({
        id: id(),
        severity: 'error',
        code: 'empty_label',
        message: `Entity ${e.id} has empty label`,
        entityId: e.id,
        caseId: e.caseId,
      });
    }
    if (!caseIds.has(e.caseId)) {
      issues.push({
        id: id(),
        severity: 'error',
        code: 'orphan_entity_case',
        message: `Entity "${e.label}" references missing case ${e.caseId}`,
        entityId: e.id,
        caseId: e.caseId,
      });
    }
    const key = `${e.caseId}|${e.type}|${(e.label || '').trim().toLowerCase()}`;
    if (labelKey.has(key)) {
      issues.push({
        id: id(),
        severity: 'warn',
        code: 'duplicate_entity',
        message: `Possible duplicate: ${e.type} "${e.label}" (also ${labelKey.get(key)})`,
        entityId: e.id,
        caseId: e.caseId,
      });
    } else {
      labelKey.set(key, e.id);
    }
  }

  const edgeKey = new Set<string>();
  for (const r of relationships) {
    if (!entityIds.has(r.sourceId)) {
      issues.push({
        id: id(),
        severity: 'error',
        code: 'missing_source',
        message: `Relationship ${r.id} source ${r.sourceId} not found`,
        relationshipId: r.id,
        caseId: r.caseId,
      });
    }
    if (!entityIds.has(r.targetId)) {
      issues.push({
        id: id(),
        severity: 'error',
        code: 'missing_target',
        message: `Relationship ${r.id} target ${r.targetId} not found`,
        relationshipId: r.id,
        caseId: r.caseId,
      });
    }
    if (r.sourceId === r.targetId) {
      issues.push({
        id: id(),
        severity: 'warn',
        code: 'self_loop',
        message: `Self-loop relationship ${r.id}`,
        relationshipId: r.id,
        caseId: r.caseId,
      });
    }
    const ek = `${r.caseId}|${r.type}|${r.sourceId}|${r.targetId}`;
    if (edgeKey.has(ek)) {
      issues.push({
        id: id(),
        severity: 'warn',
        code: 'duplicate_edge',
        message: `Duplicate edge ${r.type} ${r.sourceId} → ${r.targetId}`,
        relationshipId: r.id,
        caseId: r.caseId,
      });
    } else {
      edgeKey.add(ek);
    }
  }

  for (const t of timeline) {
    if (t.timestamp && Number.isNaN(Date.parse(t.timestamp))) {
      issues.push({
        id: id(),
        severity: 'warn',
        code: 'bad_timestamp',
        message: `Timeline "${t.title}" has invalid timestamp`,
        caseId: t.caseId,
      });
    }
  }

  return issues;
}

export function formatIntegrityReport(issues: IntegrityIssue[]): string {
  if (!issues.length) return 'No integrity issues found.';
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warns = issues.filter((i) => i.severity === 'warn').length;
  return [
    `Integrity report: ${errors} error(s), ${warns} warning(s)`,
    ...issues.map((i) => `[${i.severity.toUpperCase()}] ${i.code}: ${i.message}`),
  ].join('\n');
}
