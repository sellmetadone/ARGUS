import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function MaltegoPanel() {
  const { setPanel, exportGraph, activeCaseId, appearance } = useStore();

  const download = (format: 'json' | 'csv' | 'graphml') => {
    const data = exportGraph(format);
    const mime =
      format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'application/xml';
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argus-export.${format}`;
    a.click();
  };

  return (
    <div
      style={{
        width: 340,
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: 1 }}>MALTEGO BRIDGE</span>
        <button onClick={() => setPanel('maltego', false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 16, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
        <p style={{ marginTop: 0 }}>
          Export the active case graph for Maltego / GraphML tools, or import later via Welcome → Load JSON.
        </p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Active case: <b style={{ color: appearance.accentColor }}>{activeCaseId || '—'}</b>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {(['json', 'csv', 'graphml'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => download(fmt)}
              style={{
                padding: '10px 14px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
              }}
            >
              Export .{fmt}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: '#64748b' }}>
          Local transform stubs only — wire real Maltego TDS later if needed.
        </div>
      </div>
    </div>
  );
}
