import { useMemo, useState } from 'react';
import { Network, Route, GitBranch, CircleDot, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  computeMetrics,
  computeDegrees,
  findIsolates,
  connectedComponents,
  shortestPath,
  findAllPaths,
  commonNeighbors,
  computeCentrality,
} from '../../services/intelligence/graphIntelligence';
import { useT } from '../../i18n/useT';

export default function GraphAnalyticsPanel() {
  const t = useT();
  const { activeCaseId, getEntitiesForCase, getRelationshipsForCase, setHighlightedPath, setSelectedEntity, setPanel } =
    useStore();
  const entities = activeCaseId ? getEntitiesForCase(activeCaseId) : [];
  const relationships = activeCaseId ? getRelationshipsForCase(activeCaseId) : [];
  const snap = useMemo(() => ({ entities, relationships }), [entities, relationships]);
  const metrics = useMemo(() => computeMetrics(snap), [snap]);
  const degrees = useMemo(() => computeDegrees(snap).slice(0, 15), [snap]);
  const isolates = useMemo(() => findIsolates(snap), [snap]);
  const components = useMemo(() => connectedComponents(snap).slice(0, 10), [snap]);
  const centrality = useMemo(() => computeCentrality(snap).slice(0, 12), [snap]);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [pathInfo, setPathInfo] = useState('');

  const runPath = () => {
    if (!fromId || !toId) return;
    const sp = shortestPath(snap, fromId, toId);
    if (!sp) {
      setPathInfo(t('analytics_no_path'));
      setHighlightedPath([]);
      return;
    }
    setHighlightedPath(sp.path);
    let info = `${t('analytics_path_len')} ${sp.length}: ${sp.path.join(' → ')}`;
    const all = findAllPaths(snap, fromId, toId, 6, 10);
    if (all.length > 1) info += ` · ${all.length} ${t('analytics_paths')}`;
    const cn = commonNeighbors(snap, fromId, toId);
    if (cn.length) info += ` · ${t('analytics_common')}: ${cn.length}`;
    setPathInfo(info);
  };

  return (
    <div className="argus-side-panel md-sheet-enter analytics-panel">
      <header className="argus-side-panel__header">
        <span className="argus-side-panel__title md-label-medium">
          <Network size={16} style={{ marginRight: 8, verticalAlign: -3 }} />
          {t('analytics')}
        </span>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPanel('analytics', false)} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div className="argus-side-panel__body md-stagger">
        {!activeCaseId && <p className="md-muted">{t('analytics_select_case')}</p>}
        {activeCaseId && entities.length === 0 && <p className="md-muted">{t('analytics_empty')}</p>}
        <Sec title={t('analytics_metrics')}>
          {Object.entries(metrics).map(([k, v]) => (
            <Row key={k} k={k} v={String(v)} />
          ))}
        </Sec>
        <Sec title={t('analytics_shortest')}>
          <select className="md-select" value={fromId} onChange={(e) => setFromId(e.target.value)}>
            <option value="">{t('analytics_from')}</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
          <select className="md-select" value={toId} onChange={(e) => setToId(e.target.value)} style={{ marginTop: 6 }}>
            <option value="">{t('analytics_to')}</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
          <button type="button" className="btn btn-filled" onClick={runPath} style={{ marginTop: 8 }}>
            <Route size={12} /> {t('analytics_find')}
          </button>
          {pathInfo && <p style={{ marginTop: 8, lineHeight: 1.4 }}>{pathInfo}</p>}
        </Sec>
        <Sec title={t('analytics_degree')}>
          {degrees.map((d) => (
            <button key={d.id} type="button" className="btn btn-ghost" onClick={() => { setSelectedEntity(d.id); setHighlightedPath([d.id]); }} style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>{d.label}</span><span className="mono">{d.degree}</span>
            </button>
          ))}
        </Sec>
        <Sec title={t('analytics_centrality')}>
          {centrality.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', gap: 8 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'flex-start' }} onClick={() => setSelectedEntity(c.id)}>{c.label}</button>
              <span className="mono" style={{ fontSize: 11 }}>d={c.degreeCentrality} b={c.betweenness}</span>
            </div>
          ))}
        </Sec>
        <Sec title={t('analytics_components')}>
          {components.map((c) => (
            <button key={c.id} type="button" className="btn btn-ghost" onClick={() => setHighlightedPath(c.nodeIds)} style={{ width: '100%', justifyContent: 'flex-start' }}>
              <GitBranch size={12} /> #{c.id} · {c.size}
            </button>
          ))}
        </Sec>
        <Sec title={t('analytics_isolates')}>
          {isolates.length === 0 && <p className="md-muted">{t('analytics_none')}</p>}
          {isolates.map((e) => (
            <button key={e.id} type="button" className="btn btn-ghost" onClick={() => setSelectedEntity(e.id)} style={{ width: '100%', justifyContent: 'flex-start' }}>
              <CircleDot size={12} /> {e.label}
            </button>
          ))}
        </Sec>
      </div>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="md-section md-stagger-item">
      <h3 className="md-section__title">{title}</h3>
      <div className="md-section__body">{children}</div>
    </section>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="oi-kv">
      <span className="oi-kv__k">{k}</span>
      <span className="oi-kv__v mono">{v}</span>
    </div>
  );
}
