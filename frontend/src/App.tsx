import { useEffect, useState, useRef } from 'react';
import Sidebar from './components/layout/Sidebar';
import GraphCanvas from './components/graph/GraphCanvas';
import Graph3D from './components/graph/Graph3D';
import ObjectInspector from './components/inspector/ObjectInspector';
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
import CanvasOverlay from './components/canvas/CanvasOverlay';
import MapPanel from './components/map/MapPanel';
import { useStore } from './store/useStore';
import { Map, Clock, Search, Settings, Undo2, Redo2, Download, Workflow, Network, FileText, GitCompare, Bot } from 'lucide-react';
import { useT } from './i18n/useT';
import { LANG_META, type LangCode } from './i18n/locales';
import { useDeviceProfile } from './hooks/useDeviceProfile';

export default function App() {
  const t = useT();
  const device = useDeviceProfile();
  const {
    panels, togglePanel, activeCaseId, cases, appearance, graphSearchQuery, setGraphSearchQuery,
    undo, redo, exportGraph, setCommandPaletteOpen, graphSettings, showWelcome, setShowWelcome,
  } = useStore();

  const activeCase = cases.find((c) => c.id === activeCaseId);
  const [themeFlash, setThemeFlash] = useState(false);
  const prevTheme = useRef(appearance.theme + appearance.preset + appearance.graphBg);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', appearance.theme || 'light');
    root.setAttribute('data-reduce-motion', appearance.animations === false || device.reduceMotion ? 'true' : 'false');
    root.style.setProperty('--accent', appearance.accentColor);
    root.style.setProperty('--radius', `${appearance.borderRadius}px`);
    if (appearance.graphBg) root.style.setProperty('--graph-bg', appearance.graphBg);
    if (appearance.graphDots) root.style.setProperty('--graph-dots', appearance.graphDots);
    if (appearance.edgeColor) root.style.setProperty('--edge', appearance.edgeColor);
    root.style.setProperty('--font', appearance.fontFamily || 'Inter, system-ui, sans-serif');
    const key = appearance.theme + appearance.preset + appearance.graphBg + appearance.wallpaper;
    if (prevTheme.current && prevTheme.current !== key && appearance.animations !== false && !device.reduceMotion) {
      setThemeFlash(true);
      document.body.classList.add('theme-animating');
      const t1 = window.setTimeout(() => setThemeFlash(false), 500);
      const t2 = window.setTimeout(() => document.body.classList.remove('theme-animating'), 450);
      prevTheme.current = key;
      return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    }
    prevTheme.current = key;
  }, [appearance, device.reduceMotion]);

  const shellClass = ['argus-shell', device.compactToolbar ? 'compact-toolbar' : ''].filter(Boolean).join(' ');
  const showToolbarLabel = !device.compactToolbar;

  return (
    <div className={shellClass} style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {showWelcome && (
        <div className="anim-fade-in" style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
          <WelcomeScreen />
        </div>
      )}
      {themeFlash && <div className="theme-flash" />}
      <header style={{ height: 'var(--header-h)', background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <img src="/argus_logo.svg" alt="Argus" width={28} height={28} style={{ borderRadius: 6, display: 'block', flexShrink: 0 }}
            onError={(e) => { const el = e.target as HTMLImageElement; if (!el.dataset.fallback) { el.dataset.fallback = '1'; el.src = '/favicon.svg'; } }} />
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: 2, color: 'var(--text)' }}>ARGUS</span>
          {activeCase && (
            <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--text-muted)', background: 'var(--hover)', padding: '3px 10px', borderRadius: appearance.borderRadius, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeCase.name}</span>
          )}
        </div>
        <div style={{ flex: 1, maxWidth: device.class === 'laptop' ? 280 : 360, margin: '0 16px', minWidth: 120 }}>
          <input value={graphSearchQuery} onChange={(e) => setGraphSearchQuery(e.target.value)} placeholder={t('graph_search_placeholder')}
            style={{ width: '100%', padding: '7px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: appearance.borderRadius, color: 'var(--text)', fontSize: 13, outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <ToolbarBtn active={panels.search} onClick={() => togglePanel('search')} icon={<Search size={15} />} label={showToolbarLabel ? t('search') : ''} title={t('search')} />
          <ToolbarBtn active={panels.timeline} onClick={() => togglePanel('timeline')} icon={<Clock size={15} />} label={showToolbarLabel ? t('timeline') : ''} title={t('timeline')} />
          <ToolbarBtn active={panels.map} onClick={() => togglePanel('map')} icon={<Map size={15} />} label={showToolbarLabel ? t('map') : ''} title={t('map')} />
          <ToolbarBtn active={panels.maltego} onClick={() => togglePanel('maltego')} icon={<Workflow size={15} />} label={showToolbarLabel ? 'Maltego' : ''} title="Maltego" />
          <ToolbarBtn active={panels.analytics} onClick={() => togglePanel('analytics')} icon={<Network size={15} />} label={showToolbarLabel ? t('analytics') : ''} title={t('analytics')} />
          <ToolbarBtn active={panels.evidence} onClick={() => togglePanel('evidence')} icon={<FileText size={15} />} label={showToolbarLabel ? t('evidence') : ''} title={t('evidence')} />
          <ToolbarBtn active={panels.correlation} onClick={() => togglePanel('correlation')} icon={<GitCompare size={15} />} label={showToolbarLabel ? t('correlate') : ''} title={t('correlate')} />
          <ToolbarBtn active={panels.ai} onClick={() => togglePanel('ai')} icon={<Bot size={15} />} label={showToolbarLabel ? 'AI' : ''} title="AI" />
          <ToolbarBtn active={panels.settings} onClick={() => togglePanel('settings')} icon={<Settings size={15} />} label={showToolbarLabel ? t('settings') : ''} title={t('settings')} />
          <button type="button" className="btn btn-ghost" onClick={() => undo()} title="Undo" style={{ padding: 6 }}><Undo2 size={15} /></button>
          <button type="button" className="btn btn-ghost" onClick={() => redo()} title="Redo" style={{ padding: 6 }}><Redo2 size={15} /></button>
          <button type="button" className="btn btn-ghost" onClick={() => { const blob = new Blob([exportGraph('json')], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'argus-export.json'; a.click(); }} title="Export" style={{ padding: 6 }}><Download size={15} /></button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowWelcome(true)} style={{ marginLeft: 4, fontSize: 11 }}>{t('home')}</button>
          <button type="button" className="btn btn-ghost" onClick={() => setCommandPaletteOpen(true)} style={{ fontSize: 11 }}>Ctrl+K</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {panels.sidebar && device.class !== 'phone' && (
          <div className="argus-panel-shell anim-slide-left"><Sidebar /></div>
        )}
        {panels.search && (
          <div className="anim-slide-left argus-overlay-panel" style={{ height: '100%' }}><SearchPanel /></div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            {graphSettings.enable3d ? <Graph3D /> : <GraphCanvas />}
            {!graphSettings.enable3d && <CanvasOverlay />}
            {panels.map && (
              <div className="argus-map-layer" style={{ position: 'absolute', inset: 0, zIndex: 10 }}><MapPanel /></div>
            )}
          </div>
          {panels.timeline && (
            <div className="argus-timeline-shell"><Timeline /></div>
          )}
        </div>
        {panels.rightPanel && device.class !== 'phone' && (
          <div className="argus-panel-shell anim-slide-right"><ObjectInspector /></div>
        )}
        {panels.settings && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}><SettingsPanel /></div>
        )}
        {panels.maltego && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}><MaltegoPanel /></div>
        )}
        {panels.tutorial && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}><TutorialPanel /></div>
        )}
        {panels.analytics && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}><GraphAnalyticsPanel /></div>
        )}
        {panels.evidence && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}><EvidencePanel /></div>
        )}
        {panels.correlation && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}><CorrelationPanel /></div>
        )}
        {panels.ai && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}><AiAssistantPanel /></div>
        )}
      </div>

      <div style={{ height: 'var(--footer-h)', flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--header-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>ARGUS · sellmetadone</span><span>·</span>
        <a href="https://t.me/sofia_white_death" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>@sofia_white_death</a>
        <span>·</span>
        <a href="https://t.me/argus_platform" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>t.me/argus_platform</a>
        <span>·</span>
        <span title="Device profile">{device.class}/{device.density}</span>
      </div>
      <CommandPalette />
    </div>
  );
}

function ToolbarBtn({ active, onClick, icon, label, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title || label}
      className={active ? 'btn btn-icon active' : 'btn btn-icon'}
      style={{ gap: 6, padding: label ? '6px 10px' : '6px' }}>
      {icon}{label ? <span style={{ fontSize: 12 }}>{label}</span> : null}
    </button>
  );
}
