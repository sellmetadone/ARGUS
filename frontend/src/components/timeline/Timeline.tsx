import { useMemo, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { useTemporalFilter } from '../../store/temporalFilterStore';
import {
  filterByDateRange,
  findOverlaps,
  sortEvents,
  filterGraphByTemporalRange,
  entityIdsWithEventsInRange,
} from '../../services/intelligence/timelineService';
import { useT } from '../../i18n/useT';

function toDay(iso: string): string {
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default function Timeline() {
  const t = useT();
  const {
    activeCaseId,
    getTimelineForCase,
    getRelationshipsForCase,
    entities,
    selectedTimelineEventId,
    setSelectedTimelineEvent,
    setSelectedEntity,
    setHighlightedPath,
    selectedEntityId,
  } = useStore();
  const { from, to, enabled, keepUndated, setFrom, setTo, setEnabled, setKeepUndated, clear, setRange } =
    useTemporalFilter();

  const all = useMemo(
    () => (activeCaseId ? getTimelineForCase(activeCaseId) : []),
    [activeCaseId, getTimelineForCase]
  );
  const relationships = useMemo(
    () => (activeCaseId ? getRelationshipsForCase(activeCaseId) : []),
    [activeCaseId, getRelationshipsForCase]
  );

  const caseEntities = useMemo(
    () => (activeCaseId ? entities.filter((e) => e.caseId === activeCaseId) : []),
    [entities, activeCaseId]
  );

  const sortedAll = useMemo(() => sortEvents(all), [all]);
  const events = useMemo(
    () => sortEvents(filterByDateRange(all, from || undefined, to || undefined)),
    [all, from, to]
  );
  const overlaps = useMemo(() => findOverlaps(events), [events]);

  const bounds = useMemo(() => {
    if (sortedAll.length === 0) return null;
    const times = sortedAll.map((e) => Date.parse(e.timestamp)).filter((n) => !Number.isNaN(n));
    if (!times.length) return null;
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [sortedAll]);

  const scrubValue = useMemo(() => {
    if (!bounds) return 0;
    const end = to ? Date.parse(to.length === 10 ? `${to}T23:59:59.999Z` : to) : bounds.max;
    if (Number.isNaN(end)) return 100;
    const span = Math.max(1, bounds.max - bounds.min);
    return Math.round(((end - bounds.min) / span) * 100);
  }, [bounds, to]);

  const graphSlice = useMemo(() => {
    if (!enabled || (!from && !to)) {
      return { count: caseEntities.length, eventLinkedIds: [] as string[] };
    }
    const slice = filterGraphByTemporalRange(caseEntities, relationships, from || undefined, to || undefined, {
      keepUndated,
    });
    const eventLinked = entityIdsWithEventsInRange(all, from || undefined, to || undefined);
    return { count: slice.entities.length, eventLinkedIds: eventLinked };
  }, [enabled, from, to, keepUndated, caseEntities, relationships, all]);

  const lastHighlightKey = useRef('');

  useEffect(() => {
    if (!enabled || (!from && !to)) return;
    const key = `${from}|${to}|${graphSlice.eventLinkedIds.join(',')}`;
    if (key === lastHighlightKey.current) return;
    lastHighlightKey.current = key;
    if (graphSlice.eventLinkedIds.length) {
      setHighlightedPath(graphSlice.eventLinkedIds);
    }
  }, [enabled, from, to, graphSlice.eventLinkedIds, setHighlightedPath]);

  const onScrub = useCallback(
    (pct: number) => {
      if (!bounds) return;
      const span = Math.max(1, bounds.max - bounds.min);
      const endMs = bounds.min + (pct / 100) * span;
      const day = new Date(endMs).toISOString().slice(0, 10);
      const startDay = new Date(bounds.min).toISOString().slice(0, 10);
      setRange(startDay, day);
      setEnabled(true);
      const linked = entityIdsWithEventsInRange(all, startDay, day);
      if (linked.length) setHighlightedPath(linked);
    },
    [bounds, setRange, setEnabled, all, setHighlightedPath]
  );

  const focusEventOnGraph = useCallback(
    (ev: { id: string; entityId?: string }) => {
      setSelectedTimelineEvent(ev.id);
      if (!ev.entityId) {
        setHighlightedPath([]);
        return;
      }
      setSelectedEntity(ev.entityId);
      const neighbors = new Set<string>([ev.entityId]);
      for (const r of relationships) {
        if (r.sourceId === ev.entityId) neighbors.add(r.targetId);
        if (r.targetId === ev.entityId) neighbors.add(r.sourceId);
      }
      setHighlightedPath([...neighbors]);
    },
    [relationships, setSelectedTimelineEvent, setSelectedEntity, setHighlightedPath]
  );

  if (!activeCaseId) return null;

  return (
    <div className="argus-timeline md-timeline">
      <div className="md-timeline__toolbar">
        <span className="md-timeline__title md-label-medium">{t('timeline')}</span>
        <label className="md-timeline__check">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>{t('temporal_filter') || 'Filter graph'}</span>
        </label>
        <label className="md-timeline__check">
          <input type="checkbox" checked={keepUndated} onChange={(e) => setKeepUndated(e.target.checked)} />
          <span>{t('keep_undated') || 'Keep undated'}</span>
        </label>
        <input
          className="md-select md-timeline__date"
          type="date"
          value={from || ''}
          onChange={(e) => setFrom(e.target.value || null)}
          aria-label="From"
        />
        <span className="md-muted">→</span>
        <input
          className="md-select md-timeline__date"
          type="date"
          value={to || ''}
          onChange={(e) => setTo(e.target.value || null)}
          aria-label="To"
        />
        <button type="button" className="btn btn-ghost" onClick={() => clear()}>
          {t('clear') || 'Clear'}
        </button>
        {bounds && (
          <input
            className="md-timeline__scrub"
            type="range"
            min={0}
            max={100}
            value={scrubValue}
            onChange={(e) => onScrub(Number(e.target.value))}
            aria-label="Timeline scrubber"
          />
        )}
        <span className="md-timeline__meta md-muted">
          {events.length} evt
          {enabled && (from || to) ? ` · graph ${graphSlice.count}` : ''}
          {overlaps.length ? ` · ${overlaps.length} overlaps` : ''}
        </span>
      </div>

      <div className="md-timeline__track">
        <div className="md-timeline__line" aria-hidden />
        {events.length === 0 && (
          <div className="md-muted">{t('temporal_no_events') || 'No events'}</div>
        )}
        {events.map((ev) => {
          const selected = selectedTimelineEventId === ev.id;
          const linked = Boolean(ev.entityId && ev.entityId === selectedEntityId);
          return (
            <div
              key={ev.id}
              data-testid="timeline-event"
              className={`md-timeline__event ${selected ? 'is-selected' : ''} ${linked ? 'is-linked' : ''}`}
              onClick={() => focusEventOnGraph(ev)}
              title={ev.entityId ? `→ graph ${ev.entityId}` : undefined}
            >
              <div className="md-timeline__dot" />
              <div className="md-timeline__date">
                {(() => {
                  try {
                    return format(Date.parse(ev.timestamp), 'yyyy-MM-dd');
                  } catch {
                    return toDay(ev.timestamp) || '—';
                  }
                })()}
              </div>
              <div className="md-timeline__event-title">{ev.title || ev.id}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
