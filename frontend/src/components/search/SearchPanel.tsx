import { useState } from 'react';
import { X, Search as SearchIcon, ExternalLink, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { liveLookup, type LookupHit } from '../../services/osintLookup';
import { toolsForQuery } from '../../services/osintTools';
import { detectAndValidate } from '../../services/validation';
import type { EntityType } from '../../types';

export default function SearchPanel() {
  const { setPanel, activeCaseId, addEntity, appearance } = useStore();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<LookupHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ReturnType<typeof detectAndValidate> | null>(null);

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setValidation(detectAndValidate(q));
    try {
      const results = await liveLookup(q);
      setHits(results);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  };

  const addHit = (h: LookupHit) => {
    if (!activeCaseId || !h.addable) return;
    addEntity({
      id: `ent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: (h.type as EntityType) || 'note',
      label: h.title,
      properties: { source: h.source, snippet: h.snippet },
      caseId: activeCaseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: h.confidence,
      source: h.source,
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 300 },
    });
  };

  const tools = toolsForQuery(q.trim() || 'example.com');

  return (
    <div
      style={{
        width: 360,
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: 1 }}>SEARCH</span>
        <button onClick={() => setPanel('search', false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 12, display: 'flex', gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="domain / IP / email / phone"
          style={{
            flex: 1,
            padding: '8px 10px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            color: '#e2e8f0',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{
            padding: '8px 12px',
            background: appearance.accentColor,
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <SearchIcon size={16} />
        </button>
      </div>

      {validation && (
        <div style={{ padding: '0 12px 8px', fontSize: 11, color: validation.ok ? '#86efac' : '#fca5a5' }}>
          {validation.kind}: {validation.ok ? 'valid' : validation.errors.join(', ')}
          {validation.warnings.length ? ` · warn: ${validation.warnings.join(', ')}` : ''}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {loading && <div style={{ color: '#64748b', fontSize: 12 }}>Searching…</div>}
        {hits.map((h) => (
          <div
            key={h.id}
            style={{
              padding: 10,
              marginBottom: 8,
              background: '#1e293b',
              borderRadius: 8,
              border: '1px solid #334155',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{h.title}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{h.snippet}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
              {h.source} · {h.type} · conf {h.confidence}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {h.addable && (
                <button
                  onClick={() => addHit(h)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    background: '#1e1b4b',
                    border: '1px solid #4c1d95',
                    borderRadius: 4,
                    color: '#c4b5fd',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={12} /> Add to graph
                </button>
              )}
              {h.url && (
                <a
                  href={h.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 4,
                    color: '#94a3b8',
                    fontSize: 11,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} /> Open
                </a>
              )}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 16, fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: 1 }}>OSINT LINKS</div>
        {tools.slice(0, 8).map((t) => (
          <a
            key={t.id}
            href={t.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              padding: '8px 0',
              color: '#94a3b8',
              fontSize: 12,
              textDecoration: 'none',
              borderBottom: '1px solid #1e293b',
            }}
          >
            {t.name} — {t.description}
          </a>
        ))}
      </div>
    </div>
  );
}
