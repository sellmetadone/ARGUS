/** Load persisted cases into memory; fall back to demo seed. */
import type { Case, Entity, Relationship, TimelineEvent } from '../../types';
import { caseRepository } from './caseRepository';
import { demoCases, demoEntities, demoRelationships, demoTimeline } from '../../data/demo';

export type BootstrapState = {
  cases: Case[];
  entities: Entity[];
  relationships: Relationship[];
  timeline: TimelineEvent[];
  activeCaseId: string | null;
  source: 'localStorage' | 'demo';
};

export function bootstrapAppState(): BootstrapState {
  try {
    if (typeof localStorage === 'undefined') {
      return {
        cases: demoCases,
        entities: demoEntities,
        relationships: demoRelationships,
        timeline: demoTimeline,
        activeCaseId: demoCases[0]?.id ?? null,
        source: 'demo',
      };
    }
    const ids = caseRepository.listIds();
    if (!ids.length) {
      return {
        cases: demoCases,
        entities: demoEntities,
        relationships: demoRelationships,
        timeline: demoTimeline,
        activeCaseId: demoCases[0]?.id ?? null,
        source: 'demo',
      };
    }
    const cases: Case[] = [];
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];
    const timeline: TimelineEvent[] = [];
    for (const id of ids) {
      const doc = caseRepository.load(id);
      if (!doc) continue;
      cases.push({
        id: doc.id,
        name: doc.name || id,
        status: (doc.status as Case['status']) || 'open',
        createdAt: doc.updatedAt || new Date().toISOString(),
        updatedAt: doc.updatedAt || new Date().toISOString(),
      });
      for (const e of doc.entities || []) {
        const layout = doc.graphLayout?.[e.id];
        entities.push({
          ...e,
          caseId: doc.id,
          position: layout || e.position,
        });
      }
      for (const r of doc.relationships || []) {
        relationships.push({ ...r, caseId: doc.id });
      }
      for (const t of doc.timeline || []) {
        timeline.push({ ...t, caseId: doc.id });
      }
    }
    if (!cases.length) {
      return {
        cases: demoCases,
        entities: demoEntities,
        relationships: demoRelationships,
        timeline: demoTimeline,
        activeCaseId: demoCases[0]?.id ?? null,
        source: 'demo',
      };
    }
    return {
      cases,
      entities,
      relationships,
      timeline,
      activeCaseId: cases[0].id,
      source: 'localStorage',
    };
  } catch (e) {
    console.warn('[Argus] bootstrap failed, using demo', e);
    return {
      cases: demoCases,
      entities: demoEntities,
      relationships: demoRelationships,
      timeline: demoTimeline,
      activeCaseId: demoCases[0]?.id ?? null,
      source: 'demo',
    };
  }
}
