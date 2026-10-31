import { format } from 'date-fns';
import { useStore } from '../../store/useStore';

export default function Timeline() {
  const { activeCaseId, getTimelineForCase, selectedTimelineEventId, setSelectedTimelineEvent, setSelectedEntity } =
    useStore();

  if (!activeCaseId) return null;

  const events = getTimelineForCase(activeCaseId);

  return (
    <div
      style={{
        height: 140,
        background: '#0f172a',
        borderTop: '1px solid #1e293b',
        padding: '12px 16px',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: 1, marginBottom: 10 }}>
        TIMELINE
      </div>
      <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', position: 'relative', minWidth: 'max-content' }}>
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 0,
            right: 0,
            height: 2,
            background: '#1e293b',
            zIndex: 0,
          }}
        />
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
                  background: selected ? '#8b5cf6' : '#334155',
                  border: `2px solid ${selected ? '#a78bfa' : '#475569'}`,
                  marginBottom: 8,
                  boxShadow: selected ? '0 0 8px #8b5cf666' : 'none',
                }}
              />
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                {format(new Date(ev.timestamp), 'yyyy-MM-dd')}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: selected ? '#e2e8f0' : '#94a3b8',
                  fontWeight: selected ? 600 : 400,
                  textAlign: 'center',
                  maxWidth: 120,
                  lineHeight: 1.3,
                }}
              >
                {ev.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
