/**
 * Evidence Intelligence — sources and claims (local-only).
 * Source reliability ≠ claim credibility ≠ conclusion confirmation.
 */
export type EvidenceKind = 'url' | 'note' | 'file' | 'quote' | 'other';

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'corroborated'
  | 'disputed'
  | 'refuted';

export type SourceReliability = 'unknown' | 'low' | 'medium' | 'high';
export type ClaimCredibility = 'unknown' | 'low' | 'medium' | 'high';
export type ConclusionSupport = 'none' | 'weak' | 'moderate' | 'strong';

export type EvidenceHistoryEntry = { at: string; action: string; detail?: string };

export type EvidenceItem = {
  id: string;
  caseId: string;
  kind: EvidenceKind;
  title: string;
  content: string;
  description?: string;
  origin?: string;
  obtainedAt?: string;
  createdAt: string;
  updatedAt: string;
  verification: VerificationStatus;
  sourceReliability: SourceReliability;
  claimCredibility: ClaimCredibility;
  conclusionSupport: ConclusionSupport;
  entityIds: string[];
  eventIds: string[];
  comments: { id: string; text: string; at: string }[];
  history: EvidenceHistoryEntry[];
};

export type EntityEvidenceRollup = {
  entityId: string;
  count: number;
  corroborated: number;
  disputed: number;
  avgSupportScore: number;
  strongestSupport: ConclusionSupport;
  items: EvidenceItem[];
};

const STORAGE_KEY = 'argus.evidence.v1';

const SUPPORT_SCORE: Record<ConclusionSupport, number> = {
  none: 0,
  weak: 1,
  moderate: 2,
  strong: 3,
};

function loadAll(): EvidenceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAll(items: EvidenceItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('[Argus] evidence save failed', e);
  }
}

export function listEvidence(caseId?: string): EvidenceItem[] {
  const all = loadAll();
  return caseId ? all.filter((e) => e.caseId === caseId) : all;
}

export function getEvidence(id: string): EvidenceItem | null {
  return loadAll().find((e) => e.id === id) ?? null;
}

export function createEvidence(
  input: Omit<EvidenceItem, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'comments'> & {
    comments?: EvidenceItem['comments'];
  }
): EvidenceItem {
  const now = new Date().toISOString();
  const item: EvidenceItem = {
    ...input,
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    comments: input.comments || [],
    history: [{ at: now, action: 'created' }],
    createdAt: now,
    updatedAt: now,
  };
  const all = loadAll();
  all.push(item);
  saveAll(all);
  return item;
}

export function updateEvidence(
  id: string,
  patch: Partial<EvidenceItem>,
  historyAction = 'updated'
): EvidenceItem | null {
  const all = loadAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const prev = all[idx];
  const next: EvidenceItem = {
    ...prev,
    ...patch,
    id: prev.id,
    caseId: prev.caseId,
    updatedAt: now,
    history: [...(prev.history || []), { at: now, action: historyAction }],
  };
  all[idx] = next;
  saveAll(all);
  return next;
}

export function removeEvidence(id: string): boolean {
  saveAll(loadAll().filter((e) => e.id !== id));
  return true;
}

export function addEvidenceComment(id: string, text: string): EvidenceItem | null {
  const item = getEvidence(id);
  if (!item) return null;
  const comment = { id: `c-${Date.now()}`, text, at: new Date().toISOString() };
  return updateEvidence(id, { comments: [...item.comments, comment] }, 'comment');
}

export function linkEvidenceToEntity(evidenceId: string, entityId: string): EvidenceItem | null {
  const item = getEvidence(evidenceId);
  if (!item) return null;
  if (item.entityIds.includes(entityId)) return item;
  return updateEvidence(evidenceId, { entityIds: [...item.entityIds, entityId] }, 'link_entity');
}

export function unlinkEvidenceFromEntity(evidenceId: string, entityId: string): EvidenceItem | null {
  const item = getEvidence(evidenceId);
  if (!item) return null;
  if (!item.entityIds.includes(entityId)) return item;
  return updateEvidence(
    evidenceId,
    { entityIds: item.entityIds.filter((id) => id !== entityId) },
    'unlink_entity'
  );
}

/** Aggregate evidence strength per entity (for Inspector / graph badges). */
export function rollupEvidenceByEntity(caseId?: string): Map<string, EntityEvidenceRollup> {
  const items = listEvidence(caseId);
  const map = new Map<string, EntityEvidenceRollup>();
  for (const item of items) {
    for (const eid of item.entityIds || []) {
      let r = map.get(eid);
      if (!r) {
        r = {
          entityId: eid,
          count: 0,
          corroborated: 0,
          disputed: 0,
          avgSupportScore: 0,
          strongestSupport: 'none',
          items: [],
        };
        map.set(eid, r);
      }
      r.count += 1;
      r.items.push(item);
      if (item.verification === 'corroborated') r.corroborated += 1;
      if (item.verification === 'disputed' || item.verification === 'refuted') r.disputed += 1;
      const sc = SUPPORT_SCORE[item.conclusionSupport] ?? 0;
      if (sc > SUPPORT_SCORE[r.strongestSupport]) r.strongestSupport = item.conclusionSupport;
    }
  }
  for (const r of map.values()) {
    const sum = r.items.reduce((a, it) => a + (SUPPORT_SCORE[it.conclusionSupport] ?? 0), 0);
    r.avgSupportScore = r.items.length ? sum / r.items.length : 0;
  }
  return map;
}

export function assessmentNote(item: EvidenceItem): string {
  const parts = [
    `Source reliability: ${item.sourceReliability}`,
    `Claim credibility: ${item.claimCredibility}`,
    `Conclusion support: ${item.conclusionSupport}`,
    `Verification: ${item.verification}`,
  ];
  if (item.kind === 'url' && item.verification === 'unverified') {
    parts.push('Presence of a URL is not confirmation of the claim.');
  }
  return parts.join(' · ');
}
