/** Temporal Intelligence — no automatic causation from coincidence. */
import type { TimelineEvent, Entity, Relationship } from '../../types';

export type ApproximateDate = { raw: string; startMs: number; endMs: number; approximate: boolean };
export type TemporalOverlap = {
  a: TimelineEvent;
  b: TimelineEvent;
  overlapStart: string;
  overlapEnd: string;
  note: string;
};

export function parseFlexibleDate(input: string): ApproximateDate | null {
  const s = input.trim();
  if (!s) return null;
  if (s.includes('~')) {
    const [a, b] = s.split('~').map((x) => x.trim());
    const pa = parseFlexibleDate(a);
    const pb = parseFlexibleDate(b);
    if (!pa || !pb) return null;
    return {
      raw: s,
      startMs: Math.min(pa.startMs, pb.startMs),
      endMs: Math.max(pa.endMs, pb.endMs),
      approximate: true,
    };
  }
  const d = Date.parse(s);
  if (!Number.isNaN(d)) return { raw: s, startMs: d, endMs: d, approximate: false };
  if (/^\d{4}$/.test(s)) {
    const y = Number(s);
    return { raw: s, startMs: Date.UTC(y, 0, 1), endMs: Date.UTC(y, 11, 31, 23, 59, 59), approximate: true };
  }
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-').map(Number);
    return { raw: s, startMs: Date.UTC(y, m - 1, 1), endMs: Date.UTC(y, m, 0, 23, 59, 59), approximate: true };
  }
  return null;
}

export function sortEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

export function filterByDateRange(events: TimelineEvent[], from?: string, to?: string): TimelineEvent[] {
  const fromMs = from ? Date.parse(from) : null;
  const toMs = to ? Date.parse(to) : null;
  return events.filter((ev) => {
    const t = Date.parse(ev.timestamp);
    if (Number.isNaN(t)) return false;
    if (fromMs != null && !Number.isNaN(fromMs) && t < fromMs) return false;
    if (toMs != null && !Number.isNaN(toMs) && t > toMs) return false;
    return true;
  });
}

/** Inclusive day end for HTML date input (yyyy-MM-dd). */
export function rangeBounds(from?: string, to?: string): { fromMs: number | null; toMs: number | null } {
  let fromMs: number | null = null;
  let toMs: number | null = null;
  if (from) {
    const p = Date.parse(from.length === 10 ? `${from}T00:00:00.000Z` : from);
    if (!Number.isNaN(p)) fromMs = p;
  }
  if (to) {
    const p = Date.parse(to.length === 10 ? `${to}T23:59:59.999Z` : to);
    if (!Number.isNaN(p)) toMs = p;
  }
  return { fromMs, toMs };
}

function entityIntervalMs(e: Entity): { start: number; end: number } | null {
  const candidates: number[] = [];
  for (const key of [e.firstSeen, e.lastSeen, e.createdAt, e.updatedAt] as (string | undefined)[]) {
    if (!key) continue;
    const t = Date.parse(key);
    if (!Number.isNaN(t)) candidates.push(t);
  }
  if (!candidates.length) return null;
  return { start: Math.min(...candidates), end: Math.max(...candidates) };
}

function relationshipIntervalMs(r: Relationship): { start: number; end: number } | null {
  const candidates: number[] = [];
  for (const key of [r.firstSeen, r.lastSeen, r.createdAt, r.updatedAt] as (string | undefined)[]) {
    if (!key) continue;
    const t = Date.parse(key);
    if (!Number.isNaN(t)) candidates.push(t);
  }
  if (!candidates.length) return null;
  return { start: Math.min(...candidates), end: Math.max(...candidates) };
}

function intervalsOverlap(
  a: { start: number; end: number },
  fromMs: number | null,
  toMs: number | null
): boolean {
  if (fromMs == null && toMs == null) return true;
  const rangeStart = fromMs ?? Number.NEGATIVE_INFINITY;
  const rangeEnd = toMs ?? Number.POSITIVE_INFINITY;
  return a.start <= rangeEnd && a.end >= rangeStart;
}

/** Entity is visible if its known date interval overlaps [from, to], or has no dates (keep visible). */
export function entityVisibleInRange(e: Entity, from?: string, to?: string, keepUndated = true): boolean {
  const { fromMs, toMs } = rangeBounds(from, to);
  if (fromMs == null && toMs == null) return true;
  const iv = entityIntervalMs(e);
  if (!iv) return keepUndated;
  return intervalsOverlap(iv, fromMs, toMs);
}

export function relationshipVisibleInRange(
  r: Relationship,
  from?: string,
  to?: string,
  keepUndated = true
): boolean {
  const { fromMs, toMs } = rangeBounds(from, to);
  if (fromMs == null && toMs == null) return true;
  const iv = relationshipIntervalMs(r);
  if (!iv) return keepUndated;
  return intervalsOverlap(iv, fromMs, toMs);
}

/** Filter graph nodes/edges by temporal window. Undated items kept by default. */
export function filterGraphByTemporalRange(
  entities: Entity[],
  relationships: Relationship[],
  from?: string,
  to?: string,
  opts?: { keepUndated?: boolean }
): { entities: Entity[]; relationships: Relationship[]; hiddenEntityIds: string[] } {
  const keepUndated = opts?.keepUndated !== false;
  const visibleEntities = entities.filter((e) => entityVisibleInRange(e, from, to, keepUndated));
  const ids = new Set(visibleEntities.map((e) => e.id));
  const hiddenEntityIds = entities.filter((e) => !ids.has(e.id)).map((e) => e.id);
  const visibleRels = relationships.filter(
    (r) =>
      ids.has(r.sourceId) &&
      ids.has(r.targetId) &&
      relationshipVisibleInRange(r, from, to, keepUndated)
  );
  return { entities: visibleEntities, relationships: visibleRels, hiddenEntityIds };
}

export function eventsForEntity(events: TimelineEvent[], entityId: string): TimelineEvent[] {
  return sortEvents(
    events.filter(
      (e) => e.entityId === entityId || (e.properties && String(e.properties.entityId || '') === entityId)
    )
  );
}

export function findOverlaps(events: TimelineEvent[]): TemporalOverlap[] {
  const windows = events
    .map((ev) => {
      const start = Date.parse(ev.timestamp);
      if (Number.isNaN(start)) return null;
      const dur = Number(ev.properties?.durationMs) || 0;
      return { ev, start, end: dur > 0 ? start + dur : start };
    })
    .filter(Boolean) as { ev: TimelineEvent; start: number; end: number }[];
  const out: TemporalOverlap[] = [];
  for (let i = 0; i < windows.length; i++) {
    for (let j = i + 1; j < windows.length; j++) {
      const a = windows[i];
      const b = windows[j];
      const overlapStart = Math.max(a.start, b.start);
      const overlapEnd = Math.min(a.end, b.end);
      if (overlapStart <= overlapEnd) {
        out.push({
          a: a.ev,
          b: b.ev,
          overlapStart: new Date(overlapStart).toISOString(),
          overlapEnd: new Date(overlapEnd).toISOString(),
          note: 'Temporal overlap detected. This does not establish a causal relationship.',
        });
      }
    }
  }
  return out;
}

export function compareIntervals(eventsA: TimelineEvent[], eventsB: TimelineEvent[]) {
  const day = (t: string) => t.slice(0, 10);
  const onlyA: TimelineEvent[] = [];
  const onlyB: TimelineEvent[] = [];
  const sameDay: { a: TimelineEvent; b: TimelineEvent }[] = [];
  const bByDay = new Map<string, TimelineEvent[]>();
  for (const e of eventsB) {
    const d = day(e.timestamp);
    if (!bByDay.has(d)) bByDay.set(d, []);
    bByDay.get(d)!.push(e);
  }
  const matchedB = new Set<string>();
  for (const a of eventsA) {
    const candidates = bByDay.get(day(a.timestamp)) || [];
    if (candidates.length) {
      for (const b of candidates) {
        sameDay.push({ a, b });
        matchedB.add(b.id);
      }
    } else onlyA.push(a);
  }
  for (const b of eventsB) if (!matchedB.has(b.id)) onlyB.push(b);
  return { onlyA, onlyB, sameDay };
}

export function unifiedTemporalPoints(entities: Entity[], events: TimelineEvent[]) {
  const points: { id: string; label: string; timestamp: string; kind: 'entity' | 'event' }[] = [];
  for (const e of entities) {
    if (e.firstSeen) points.push({ id: e.id, label: `${e.label} (first seen)`, timestamp: e.firstSeen, kind: 'entity' });
    if (e.lastSeen) points.push({ id: e.id, label: `${e.label} (last seen)`, timestamp: e.lastSeen, kind: 'entity' });
    if (e.createdAt) points.push({ id: e.id, label: `${e.label} (created)`, timestamp: e.createdAt, kind: 'entity' });
  }
  for (const ev of events) points.push({ id: ev.id, label: ev.title, timestamp: ev.timestamp, kind: 'event' });
  return points.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}
