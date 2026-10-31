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

const STORAGE_KEY = 'argus.evidence.v1';

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
