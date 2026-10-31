import type { Case, Entity, Relationship, TimelineEvent } from '../../types';

const PREFIX = 'argus.case.';
const INDEX_KEY = 'argus.cases.index';

export type CaseDocument = {
  id: string;
  name: string;
  status?: string;
  updatedAt: string;
  entities: Entity[];
  relationships: Relationship[];
  timeline?: TimelineEvent[];
  graphLayout?: Record<string, { x: number; y: number }>;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const caseRepository = {
  listIds(): string[] {
    return safeParse<string[]>(localStorage.getItem(INDEX_KEY), []);
  },

  save(doc: CaseDocument): { ok: boolean; error?: string } {
    try {
      localStorage.setItem(PREFIX + doc.id, JSON.stringify(doc));
      try {
        const ids = new Set(this.listIds());
        ids.add(doc.id);
        localStorage.setItem(INDEX_KEY, JSON.stringify([...ids]));
      } catch (e) {
        return { ok: false, error: 'index_write_failed:' + String(e) };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  load(id: string): CaseDocument | null {
    try {
      const raw = localStorage.getItem(PREFIX + id);
      if (!raw) return null;
      const doc = JSON.parse(raw) as CaseDocument;
      if (!doc || !Array.isArray(doc.entities) || !Array.isArray(doc.relationships)) return null;
      return doc;
    } catch {
      return null;
    }
  },

  remove(id: string): { ok: boolean } {
    try {
      localStorage.removeItem(PREFIX + id);
      localStorage.setItem(INDEX_KEY, JSON.stringify(this.listIds().filter((x) => x !== id)));
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },

  exportAll(): CaseDocument[] {
    return this.listIds().map((id) => this.load(id)).filter(Boolean) as CaseDocument[];
  },

  fromState(caseMeta: Case, entities: Entity[], relationships: Relationship[], timeline: TimelineEvent[]): CaseDocument {
    return {
      id: caseMeta.id,
      name: caseMeta.name,
      status: caseMeta.status,
      updatedAt: new Date().toISOString(),
      entities: entities.filter((e) => e.caseId === caseMeta.id),
      relationships: relationships.filter((r) => r.caseId === caseMeta.id),
      timeline: timeline.filter((t) => t.caseId === caseMeta.id),
      graphLayout: Object.fromEntries(
        entities
          .filter((e) => e.caseId === caseMeta.id && e.position)
          .map((e) => [e.id, e.position as { x: number; y: number }])
      ),
    };
  },
};
