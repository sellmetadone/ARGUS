import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { useTemporalFilter } from '../../store/temporalFilterStore';
import { filterByDateRange, findOverlaps, sortEvents } from '../../services/intelligence/timelineService';
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

  const onScrub = useCallback(
    (pct: number) => {
      if (!bounds) return;
      const span = Math.max(1, bounds.max - bounds.min);
      const endMs = bounds.min + (pct / 100) * span;
      const day = new Date(endMs).toISOString().slice(0, 10);
      const startDay = new Date(bounds.min).toISOString().slice(0, 10);
      setRange(startDay, day);
      setEnabled(true);
    },
    [bounds, setRange, setEnabled]
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
    <div
      style={{
        height: 196,
        background: 'var(--panel)',
        borderTop: '1px solid var(--border)',
        padding: '10px 16px',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--text)',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1 }}>
          {t('timeline').toUpperCase()}
        </span>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          {t('temporal_filter_graph') || 'Filter graph'}
        </label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={dateInp} title={t('temporal_from')} />
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>–</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={dateInp} title={t('temporal_to')} />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <input type="checkbox" checked={keepUndated} onChange={(e) => setKeepUndated(e.target.checked)} />
          {t('temporal_keep_undated')}
        </label>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }} onClick={clear}>
          {t('clear') || 'Clear'}
        </button>
        {enabled && (from || to) && (
          <span style={{ fontSize: 10, color: 'var(--accent)' }}>{t('temporal_active') || 'Active'}</span>
        )}
        {overlaps.length > 0 && (
          <span style={{ fontSize: 10, color: '#fbbf24' }}>
            {overlaps.length} {t('temporal_overlaps') || 'overlaps'}
          </span>
        )}
      </div>

      {bounds && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 720 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {format(bounds.min, 'yyyy-MM-dd')}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={scrubValue}
            onChange={(e) => onScrub(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent)' }}
            title={t('temporal_scrubber') || 'Scrub timeline → filter graph'}
            aria-label="Timeline scrubber"
          />
          <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {to || format(bounds.max, 'yyyy-MM-dd')}
          </span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 0,
          alignItems: 'flex-start',
          position: 'relative',
          minWidth: 'max-content',
          flex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 0,
            right: 0,
            height: 2,
            background: 'var(--border)',
            zIndex: 0,
          }}
        />
        {events.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('temporal_no_events') || 'No events'}</div>
        )}
        {events.map((ev) => {
          const selected = selectedTimelineEventId === ev.id;
          const linked = Boolean(ev.entityId && ev.entityId === selectedEntityId);
          return (
            <div
              key={ev.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 140,
                position: 'relative',
                zIndex: 1,
                cursor: 'pointer',
              }}
              onClick={() => focusEventOnGraph(ev)}
              title={ev.entityId ? `→ graph ${ev.entityId}` : undefined}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: selected || linked ? 'var(--accent)' : 'var(--border)',
                  border: selected ? '2px solid var(--text)' : '2px solid var(--panel)',
                  marginBottom: 6,
                }}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                {(() => {
                  try {
                    return format(Date.parse(ev.timestamp), 'yyyy-MM-dd');
                  } catch {
                    return toDay(ev.timestamp) || '—';
                  }
                })()}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  maxWidth: 130,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  color: linked ? 'var(--accent)' : 'var(--text)',
                }}
              >
                {ev.title || ev.id}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const dateInp: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 4,
  fontSize: 11,
  padding: '2px 6px',
};
