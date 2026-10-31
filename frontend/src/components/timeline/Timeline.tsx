import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { filterByDateRange, findOverlaps, sortEvents } from '../../services/intelligence/timelineService';

export default function Timeline() {
  const { activeCaseId, getTimelineForCase, selectedTimelineEventId, setSelectedTimelineEvent, setSelectedEntity } = useStore();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  if (!activeCaseId) return null;
  const all = getTimelineForCase(activeCaseId);
  const events = useMemo(() => sortEvents(filterByDateRange(all, from || undefined, to || undefined)), [all, from, to]);
  const overlaps = useMemo(() => findOverlaps(events), [events]);
  return (
    <div style={{ height: 160, background: '#0f172a', borderTop: '1px solid #1e293b', padding: '10px 16px', overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: 1 }}>TIMELINE</span>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={dateInp} title="From" />
        <span style={{ color: '#475569', fontSize: 11 }}>–</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={dateInp} title="To" />
        {overlaps.length > 0 && <span style={{ fontSize: 10, color: '#fbbf24' }}>{overlaps.length} temporal overlap(s) — not causation</span>}
      </div>
      <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', position: 'relative', minWidth: 'max-content' }}>
        <div style={{ position: 'absolute', top: 14, left: 0, right: 0, height: 2, background: '#1e293b', zIndex: 0 }} />
        {events.length === 0 && <div style={{ fontSize: 12, color: '#64748b' }}>No events in range</div>}
        {events.map((ev, i) => {
          const selected = selectedTimelineEventId === ev.id;
          return (
            <div key={ev.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 140, position: 'relative', zIndex: 1, cursor: 'pointer' }}
              onClick={() => { setSelectedTimelineEvent(ev.id); if (ev.entityId) setSelectedEntity(ev.entityId); }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: selected ? '#8b5cf6' : '#334155', border: `2px solid ${selected ? '#a78bfa' : '#475569'}`, marginBottom: 8 }} />
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{format(new Date(ev.timestamp), 'yyyy-MM-dd')}</div>
              <div style={{ fontSize: 11, color: selected ? '#e2e8f0' : '#94a3b8', fontWeight: selected ? 600 : 400, textAlign: 'center', maxWidth: 120, lineHeight: 1.3 }}>{ev.title}</div>
              {i < events.length - 1 && <div style={{ position: 'absolute', top: 14, left: '50%', width: '100%', height: 2, background: '#1e293b', zIndex: -1 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const dateInp: React.CSSProperties = { background: '#1e293b', border: '1px solid #334155', borderRadius: 4, color: '#e2e8f0', fontSize: 11, padding: '2px 6px' };
