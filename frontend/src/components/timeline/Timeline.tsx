import { useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { useTemporalFilter } from '../../store/temporalFilterStore';
import { filterByDateRange, findOverlaps, sortEvents } from '../../services/intelligence/timelineService';
import { useT } from '../../i18n/useT';

export default function Timeline() {
  const t = useT();
  const {
    activeCaseId,
    getTimelineForCase,
    selectedTimelineEventId,
    setSelectedTimelineEvent,
    setSelectedEntity,
  } = useStore();
  const { from, to, enabled, keepUndated, setFrom, setTo, setEnabled, setKeepUndated, clear } =
    useTemporalFilter();

  if (!activeCaseId) return null;

  const all = getTimelineForCase(activeCaseId);
  const events = useMemo(
    () => sortEvents(filterByDateRange(all, from || undefined, to || undefined)),
    [all, from, to]
  );
  const overlaps = useMemo(() => findOverlaps(events), [events]);

  return (
    <div
      style={{
        height: 168,
        background: 'var(--panel)',
        borderTop: '1px solid var(--border)',
        padding: '10px 16px',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--text)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1 }}>
          {t('timeline').toUpperCase()}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          {t('temporal_filter_graph')}
        </label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={dateInp}
          title={t('temporal_from')}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={dateInp}
          title={t('temporal_to')}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={keepUndated} onChange={(e) => setKeepUndated(e.target.checked)} />
          {t('temporal_keep_undated')}
        </label>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }} onClick={clear}>
          {t('clear')}
        </button>
        {enabled && (from || to) && (
          <span style={{ fontSize: 10, color: 'var(--accent)' }}>{t('temporal_active')}</span>
        )}
        {overlaps.length > 0 && (
          <span style={{ fontSize: 10, color: '#fbbf24' }}>
            {overlaps.length} {t('temporal_overlaps')}
          </span>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 0,
          alignItems: 'flex-start',
          position: 'relative',
          minWidth: 'max-content',
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('temporal_no_events')}</div>
        )}
        {events.map((ev, i) => {
          const selected = selectedTimelineEventId === ev.id;
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
              onClick={() => {
                setSelectedTimelineEvent(ev.id);
                if (ev.entityId) setSelectedEntity(ev.entityId);
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: selected ? 'var(--accent)' : 'var(--hover)',
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  marginBottom: 8,
                }}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {format(new Date(ev.timestamp), 'yyyy-MM-dd')}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: selected ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: selected ? 600 : 400,
                  textAlign: 'center',
                  maxWidth: 120,
                  lineHeight: 1.3,
                }}
              >
                {ev.title}
              </div>
              {i < events.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: '50%',
                    width: '100%',
                    height: 2,
                    background: 'var(--border)',
                    zIndex: -1,
                  }}
                />
              )}
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
  borderRadius: 4,
  color: 'var(--text)',
  fontSize: 11,
  padding: '2px 6px',
};
