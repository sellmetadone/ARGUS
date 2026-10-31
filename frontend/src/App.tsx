import { useEffect, useState, useRef } from 'react';
import Sidebar from './components/layout/Sidebar';
import GraphCanvas from './components/graph/GraphCanvas';
import Graph3D from './components/graph/Graph3D';
import EntityPanel from './components/entities/EntityPanel';
import Timeline from './components/timeline/Timeline';
import SettingsPanel from './components/settings/SettingsPanel';
import SearchPanel from './components/search/SearchPanel';
import CommandPalette from './components/command/CommandPalette';
import MaltegoPanel from './components/maltego/MaltegoPanel';
import WelcomeScreen from './components/welcome/WelcomeScreen';
import TutorialPanel from './components/tutorial/TutorialPanel';
import GraphAnalyticsPanel from './components/analytics/GraphAnalyticsPanel';
import EvidencePanel from './components/evidence/EvidencePanel';
import CorrelationPanel from './components/correlation/CorrelationPanel';
import AiAssistantPanel from './components/ai/AiAssistantPanel';
import { useStore } from './store/useStore';
import { Map, Clock, Search, Settings, Undo2, Redo2, Download, Workflow, Network, FileText, GitCompare, Bot } from 'lucide-react';
import { useT } from './i18n/useT';
import { LANG_META, type LangCode } from './i18n/locales';

export default function App() {
  const t = useT();
  const {
    panels, togglePanel, activeCaseId, cases, appearance, graphSearchQuery, setGraphSearchQuery,
    undo, redo, exportGraph, setCommandPaletteOpen, graphSettings, showWelcome, setShowWelcome,
  } = useStore();

  const activeCase = cases.find((c) => c.id === activeCaseId);
  const [themeFlash, setThemeFlash] = useState(false);
  const prevTheme = useRef(appearance.theme + appearance.preset + appearance.graphBg);

  useEffect(() => {
    const root = document.documentElement;
    const bg = appearance.theme === 'amoled' ? '#000000' : appearance.theme === 'light' ? '#f8fafc' : appearance.graphBg || '#020617';
    const headerBg = appearance.theme === 'light' ? '#ffffff' : '#0f172a';
    const text = appearance.theme === 'light' ? '#0f172a' : '#e2e8f0';
    root.style.setProperty('--accent', appearance.accentColor);
    root.style.setProperty('--radius', `${appearance.borderRadius}px`);
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--header-bg', headerBg);
    root.style.setProperty('--panel-bg', headerBg);
    root.style.setProperty('--text', text);
    root.style.setProperty('--graph-bg', appearance.graphBg || bg);
    root.style.setProperty('--graph-dots', appearance.graphDots || '#1e293b');
    root.style.setProperty('--edge', appearance.edgeColor || '#64748b');
    root.style.fontFamily = appearance.fontFamily;
    document.body.style.zoom = String(appearance.uiScale);
    const lang = (appearance.language || 'en') as LangCode;
    document.documentElement.lang = lang;
    document.documentElement.dir = LANG_META[lang]?.dir || 'ltr';
    const key = appearance.theme + appearance.preset + appearance.graphBg + appearance.wallpaper;
    if (prevTheme.current && prevTheme.current !== key && appearance.animations !== false) {
      setThemeFlash(true);
      document.body.classList.add('theme-animating');
      const t1 = window.setTimeout(() => setThemeFlash(false), 500);
      const t2 = window.setTimeout(() => document.body.classList.remove('theme-animating'), 450);
      prevTheme.current = key;
      return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    }
    prevTheme.current = key;
  }, [appearance]);

  const bg = appearance.theme === 'amoled' ? '#000000' : appearance.theme === 'light' ? '#f8fafc' : appearance.graphBg || '#020617';
  const headerBg = appearance.theme === 'light' ? '#ffffff' : '#0f172a';
  const textMain = appearance.theme === 'light' ? '#0f172a' : '#e2e8f0';

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: bg, color: textMain, fontFamily: appearance.fontFamily, overflow: 'hidden' }} className="argus-shell">
      {showWelcome && <WelcomeScreen />}
      {themeFlash && <div className="theme-flash" />}
      <header style={{ height: 52, background: headerBg, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/argus_logo.svg" alt="Argus" width={28} height={28} style={{ borderRadius: 6, display: 'block' }}
            onError={(e) => { const el = e.target as HTMLImageElement; if (!el.dataset.fallback) { el.dataset.fallback = '1'; el.src = '/favicon.svg'; } }} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 2.5, color: textMain }}>ARGUS</span>
          {activeCase && (
            <span style={{ marginLeft: 4, fontSize: 12, color: '#94a3b8', background: appearance.theme === 'light' ? '#e2e8f0' : '#1e293b', padding: '3px 10px', borderRadius: appearance.borderRadius }}>{activeCase.name}</span>
          )}
        </div>
        <div style={{ flex: 1, maxWidth: 360, margin: '0 24px' }}>
          <input value={graphSearchQuery} onChange={(e) => setGraphSearchQuery(e.target.value)} placeholder={t('graph_search_placeholder')}
            style={{ width: '100%', padding: '7px 12px', background: appearance.theme === 'light' ? '#f1f5f9' : '#1e293b', border: '1px solid #334155', borderRadius: appearance.borderRadius, color: textMain, fontSize: 13, outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <ToolbarBtn active={false} onClick={() => undo()} icon={<Undo2 size={15} />} label="" title="Undo" />
          <ToolbarBtn active={false} onClick={() => redo()} icon={<Redo2 size={15} />} label="" title="Redo" />
          <ToolbarBtn active={false} onClick={() => { const data = exportGraph('json'); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'argus-graph.json'; a.click(); }} icon={<Download size={15} />} label="" title="Export JSON" />
          <div style={{ width: 1, height: 20, background: '#334155', margin: '0 4px' }} />
          <ToolbarBtn active={panels.search} onClick={() => togglePanel('search')} icon={<Search size={15} />} label={t('search')} />
          <ToolbarBtn active={panels.timeline} onClick={() => togglePanel('timeline')} icon={<Clock size={15} />} label={t('timeline')} />
          <ToolbarBtn active={panels.map} onClick={() => togglePanel('map')} icon={<Map size={15} />} label={t('map')} />
          <ToolbarBtn active={panels.maltego} onClick={() => togglePanel('maltego')} icon={<Workflow size={15} />} label="Maltego" />
          <ToolbarBtn active={panels.analytics} onClick={() => togglePanel('analytics')} icon={<Network size={15} />} label="Analytics" />
          <ToolbarBtn active={panels.evidence} onClick={() => togglePanel('evidence')} icon={<FileText size={15} />} label="Evidence" />
          <ToolbarBtn active={panels.correlation} onClick={() => togglePanel('correlation')} icon={<GitCompare size={15} />} label="Correlate" />
          <ToolbarBtn active={panels.ai} onClick={() => togglePanel('ai')} icon={<Bot size={15} />} label="AI" />
          <ToolbarBtn active={panels.settings} onClick={() => togglePanel('settings')} icon={<Settings size={15} />} label={t('settings')} />
          <button type="button" onClick={() => setShowWelcome(true)} style={{ marginLeft: 4, padding: '5px 10px', background: 'transparent', border: '1px solid #334155', borderRadius: 6, color: '#64748b', fontSize: 11, cursor: 'pointer' }} title="Home">Home</button>
          <button type="button" onClick={() => setCommandPaletteOpen(true)} style={{ marginLeft: 4, padding: '5px 10px', background: 'transparent', border: '1px solid #334155', borderRadius: 6, color: '#64748b', fontSize: 11, cursor: 'pointer' }} title="Command Palette">Ctrl+K</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {panels.sidebar && <Sidebar />}
        {panels.search && <SearchPanel />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            {graphSettings.enable3d ? <Graph3D /> : <GraphCanvas />}
            {panels.map && (
              <div style={{ position: 'absolute', inset: 0, background: appearance.theme === 'light' ? '#f1f5f9ee' : '#0f172aee', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <Map size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div style={{ fontSize: 14 }}>Geospatial map</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Leaflet / MapLibre — planned</div>
                </div>
              </div>
            )}
          </div>
          {panels.timeline && <Timeline />}
        </div>
        {panels.rightPanel && <EntityPanel />}
        {panels.settings && <SettingsPanel />}
        {panels.maltego && <MaltegoPanel />}
        {panels.tutorial && <TutorialPanel />}
        {panels.analytics && <GraphAnalyticsPanel />}
        {panels.evidence && <EvidencePanel />}
        {panels.correlation && <CorrelationPanel />}
        {panels.ai && <AiAssistantPanel />}
      </div>

      <div style={{ height: 22, flexShrink: 0, borderTop: '1px solid #1e293b', background: headerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 10, color: '#64748b' }}>
        <span>ARGUS · sellmetadone</span><span>·</span>
        <a href="https://t.me/sofia_white_death" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>@sofia_white_death</a>
        <span>·</span>
        <a href="https://t.me/argus_platform" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>t.me/argus_platform</a>
      </div>
      <CommandPalette />
    </div>
  );
}

function ToolbarBtn({ active, onClick, icon, label, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title || label}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: label ? '6px 11px' : '6px 8px', background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: `1px solid ${active ? '#6366f1' : '#334155'}`, borderRadius: 6, color: active ? '#c7d2fe' : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
      {icon}{label}
    </button>
  );
}
