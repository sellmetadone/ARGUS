import { useState } from 'react';
import { X, Search as SearchIcon, ExternalLink, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { liveLookup, type LookupHit } from '../../services/osintLookup';
import { toolsForQuery } from '../../services/osintTools';
import { detectAndValidate } from '../../services/validation';
import type { EntityType } from '../../types';

export default function SearchPanel() {
  const { setPanel, activeCaseId, addEntity } = useStore();
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
    <div className="search-panel argus-side-panel md-sheet-enter">
      <header className="argus-side-panel__header">
        <span className="argus-side-panel__title md-label-medium">Search</span>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPanel('search', false)} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      <div className="search-query-bar md-stagger-item">
        <div className="md-search-field">
          <SearchIcon size={16} className="md-search-field__icon" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="domain / IP / email / phone"
            className="md-search-field__input"
            aria-label="OSINT query"
          />
        </div>
        <button type="button" className="btn btn-filled" onClick={run} disabled={loading || !q.trim()}>
          {loading ? '…' : 'Go'}
        </button>
      </div>

      <div className="argus-side-panel__body md-stagger">
        {validation && (
          <div className={`md-banner ${validation.ok ? 'md-banner--ok' : 'md-banner--warn'} md-stagger-item`}>
            <strong>{validation.kind || 'query'}</strong>
            <span>{validation.ok ? 'Looks valid' : validation.message || 'Check format'}</span>
          </div>
        )}

        {tools.length > 0 && (
          <section className="md-section md-stagger-item">
            <h3 className="md-section__title">Tools</h3>
            <div className="md-chip-row">
              {tools.slice(0, 12).map((tool) => (
                <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer" className="md-chip">
                  {tool.name}
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="md-section md-stagger-item">
          <h3 className="md-section__title">Results {hits.length ? `(${hits.length})` : ''}</h3>
          {loading && <div className="md-muted">Searching…</div>}
          {!loading && hits.length === 0 && <div className="md-muted">No hits yet — run a query</div>}
          <ul className="md-result-list">
            {hits.map((h, i) => (
              <li key={`${h.title}-${i}`} className="md-result-card">
                <div className="md-result-card__main">
                  <div className="md-result-card__title">{h.title}</div>
                  <div className="md-result-card__meta">
                    {h.source}
                    {h.type ? ` · ${h.type}` : ''}
                    {typeof h.confidence === 'number' ? ` · ${h.confidence}%` : ''}
                  </div>
                  {h.snippet ? <div className="md-result-card__snippet">{h.snippet}</div> : null}
                </div>
                <div className="md-result-card__actions">
                  {h.url ? (
                    <a className="btn btn-ghost btn-icon" href={h.url} target="_blank" rel="noreferrer" title="Open">
                      <ExternalLink size={16} />
                    </a>
                  ) : null}
                  {h.addable ? (
                    <button type="button" className="btn btn-ghost btn-icon" title="Add to graph" onClick={() => addHit(h)} disabled={!activeCaseId}>
                      <Plus size={16} />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
