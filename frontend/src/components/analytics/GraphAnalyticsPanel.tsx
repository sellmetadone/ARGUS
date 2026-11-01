import { useMemo, useState } from 'react';
import { Network, Route, GitBranch, CircleDot, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { computeMetrics, computeDegrees, findIsolates, connectedComponents, shortestPath, findAllPaths, commonNeighbors, computeCentrality } from '../../services/intelligence/graphIntelligence';
import { useT } from '../../i18n/useT';

export default function GraphAnalyticsPanel() {
  const t = useT();
  const { activeCaseId, getEntitiesForCase, getRelationshipsForCase, setHighlightedPath, setSelectedEntity, setPanel } = useStore();
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
    if (!sp) { setPathInfo(t('analytics_no_path')); setHighlightedPath([]); return; }
    setHighlightedPath(sp.path);
    let info = `${t('analytics_path_len')} ${sp.length}: ${sp.path.join(' → ')}`;
    const all = findAllPaths(snap, fromId, toId, 6, 10);
    if (all.length > 1) info += ` · ${all.length} ${t('analytics_paths')}`;
    const cn = commonNeighbors(snap, fromId, toId);
    if (cn.length) info += ` · ${t('analytics_common')}: ${cn.length}`;
    setPathInfo(info);
  };

  return (
    <div className="argus-panel" style={{ width: 340, background: 'var(--panel)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', color: 'var(--text)' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><Network size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{t('analytics')}</span>
        <button type="button" className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setPanel('analytics', false)}><X size={14} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        {!activeCaseId && <div>{t('analytics_select_case')}</div>}
        {activeCaseId && entities.length === 0 && <div>{t('analytics_empty')}</div>}
        <Sec title={t('analytics_metrics')}>
          {Object.entries(metrics).map(([k, v]) => <Row key={k} k={k} v={String(v)} />)}
        </Sec>
        <Sec title={t('analytics_shortest')}>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} style={sel}><option value="">{t('analytics_from')}</option>{entities.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select>
          <select value={toId} onChange={(e) => setToId(e.target.value)} style={{ ...sel, marginTop: 6 }}><option value="">{t('analytics_to')}</option>{entities.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select>
          <button type="button" className="btn btn-primary" onClick={runPath} style={{ marginTop: 8 }}><Route size={12} /> {t('analytics_find')}</button>
          {pathInfo && <div style={{ marginTop: 8, color: 'var(--text)', lineHeight: 1.4 }}>{pathInfo}</div>}
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
          {isolates.length === 0 && <div style={{ fontSize: 11 }}>{t('analytics_none')}</div>}
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
  return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>{title.toUpperCase()}</div>{children}</div>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--text)' }}><span>{k}</span><span className="mono">{v}</span></div>;
}
const sel: React.CSSProperties = { width: '100%', padding: '6px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12 };
