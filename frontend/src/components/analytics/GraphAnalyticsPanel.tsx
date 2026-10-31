import { useMemo, useState } from 'react';
import { Network, Route, GitBranch, CircleDot } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { computeMetrics, computeDegrees, findIsolates, connectedComponents, shortestPath, findAllPaths, commonNeighbors, computeCentrality } from '../../services/intelligence/graphIntelligence';

export default function GraphAnalyticsPanel() {
  const { activeCaseId, getEntitiesForCase, getRelationshipsForCase, setHighlightedPath, setSelectedEntity, appearance } = useStore();
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
    if (!sp) { setPathInfo('No path found.'); setHighlightedPath([]); return; }
    setHighlightedPath(sp.path);
    setPathInfo(`Shortest path length ${sp.length}: ${sp.path.join(' → ')}`);
    const all = findAllPaths(snap, fromId, toId, 6, 10);
    if (all.length > 1) setPathInfo((p) => p + ` · ${all.length} simple path(s) within depth 6`);
    const cn = commonNeighbors(snap, fromId, toId);
    if (cn.length) setPathInfo((p) => p + ` · common neighbors: ${cn.length}`);
  };
  const panelBg = appearance.theme === 'light' ? '#fff' : '#0f172a';
  return (
    <div style={{ width: 340, background: panelBg, borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e293b', fontWeight: 600, fontSize: 13 }}><Network size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Graph Analytics</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, fontSize: 12, color: '#94a3b8' }}>
        {!activeCaseId && <div>Select a case first.</div>}
        {activeCaseId && entities.length === 0 && <div>Empty graph — add entities to analyze.</div>}
        <Sec title="Metrics">
          {Object.entries(metrics).map(([k, v]) => <Row key={k} k={k} v={String(v)} />)}
        </Sec>
        <Sec title="Shortest path">
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} style={sel}><option value="">From…</option>{entities.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select>
          <select value={toId} onChange={(e) => setToId(e.target.value)} style={{ ...sel, marginTop: 6 }}><option value="">To…</option>{entities.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select>
          <button type="button" onClick={runPath} style={btn}><Route size={12} /> Find path</button>
          {pathInfo && <div style={{ marginTop: 8, color: '#e2e8f0', lineHeight: 1.4 }}>{pathInfo}</div>}
        </Sec>
        <Sec title="Degree (top)">{degrees.map((d) => <button key={d.id} type="button" onClick={() => { setSelectedEntity(d.id); setHighlightedPath([d.id]); }} style={listBtn}><span>{d.label}</span><span style={{ color: '#64748b' }}>{d.degree}</span></button>)}</Sec>
        <Sec title="Centrality">{centrality.map((c) => <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><button type="button" style={{ ...listBtn, flex: 1 }} onClick={() => setSelectedEntity(c.id)}>{c.label}</button><span style={{ fontSize: 11 }}>d={c.degreeCentrality} b={c.betweenness}</span></div>)}</Sec>
        <Sec title="Components">{components.map((c) => <button key={c.id} type="button" onClick={() => setHighlightedPath(c.nodeIds)} style={listBtn}><GitBranch size={12} /> Component #{c.id} · {c.size} nodes</button>)}</Sec>
        <Sec title="Isolates">{isolates.length === 0 && <div style={{ fontSize: 11 }}>None</div>}{isolates.map((e) => <button key={e.id} type="button" onClick={() => setSelectedEntity(e.id)} style={listBtn}><CircleDot size={12} /> {e.label}</button>)}</Sec>
      </div>
    </div>
  );
}
function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, letterSpacing: 0.5 }}>{title.toUpperCase()}</div>{children}</div>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#cbd5e1' }}><span>{k}</span><span style={{ fontFamily: 'ui-monospace, monospace' }}>{v}</span></div>;
}
const sel: React.CSSProperties = { width: '100%', padding: '6px 8px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 12 };
const btn: React.CSSProperties = { marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid #4f46e5', borderRadius: 6, color: '#c7d2fe', cursor: 'pointer', fontSize: 12 };
const listBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', padding: '5px 0', background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: 12, textAlign: 'left' };
