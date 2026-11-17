import { useEffect } from 'react';
import {
  Search, Settings, Clock, Map, Workflow, Network, FileText, GitCompare, Bot,
} from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import Timeline from './components/timeline/Timeline';
import GraphCanvas from './components/graph/GraphCanvas';
import Graph3D from './components/graph/Graph3D';
import CanvasOverlay from './components/canvas/CanvasOverlay';
import ObjectInspector from './components/inspector/ObjectInspector';
import Sidebar from './components/layout/Sidebar';
import SearchPanel from './components/search/SearchPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import MapPanel from './components/map/MapPanel';
import MaltegoPanel from './components/maltego/MaltegoPanel';
import TutorialPanel from './components/tutorial/TutorialPanel';
import GraphAnalyticsPanel from './components/analytics/GraphAnalyticsPanel';
import EvidencePanel from './components/evidence/EvidencePanel';
import CorrelationPanel from './components/correlation/CorrelationPanel';
import AiAssistantPanel from './components/ai/AiAssistantPanel';
import CommandPalette from './components/layout/CommandPalette';
import WelcomeScreen from './components/layout/WelcomeScreen';
import { useStore } from './store/useStore';
import { useDeviceProfile } from './hooks/useDeviceProfile';
import { useT } from './i18n/useT';

export default function App() {
  const t = useT();
  const device = useDeviceProfile();
  const {
    panels, togglePanel, undo, redo, exportGraph, setCommandPaletteOpen, graphSettings,
    showWelcome, setShowWelcome, appearance,
  } = useStore();

  const showToolbarLabel = device.class === 'desktop' || device.class === 'laptop';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appearance.theme || 'light');
    document.documentElement.setAttribute(
      'data-reduce-motion',
      appearance.animations === false || device.reduceMotion ? 'true' : 'false'
    );
  }, [appearance.theme, appearance.animations, device.reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCommandPaletteOpen, undo, redo]);

  return (
    <div className="argus-shell" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {showWelcome && (
        <div className="anim-fade-in" style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
          <WelcomeScreen />
        </div>
      )}

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--header-bg)',
          flexShrink: 0,
        }}
      >
        <strong style={{ fontSize: 14, letterSpacing: 0.5, marginRight: 8 }}>ARGUS</strong>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
          <ToolbarBtn active={panels.search} onClick={() => togglePanel('search')} icon={<Search size={15} />} label={showToolbarLabel ? t('search') : ''} title={t('search')} />
          <ToolbarBtn active={panels.timeline} onClick={() => togglePanel('timeline')} icon={<Clock size={15} />} label={showToolbarLabel ? t('timeline') : ''} title={t('timeline')} />
          <ToolbarBtn active={panels.map} onClick={() => togglePanel('map')} icon={<Map size={15} />} label={showToolbarLabel ? t('map') : ''} title={t('map')} />
          <ToolbarBtn active={panels.maltego} onClick={() => togglePanel('maltego')} icon={<Workflow size={15} />} label={showToolbarLabel ? 'Maltego' : ''} title="Maltego" />
          <ToolbarBtn active={panels.analytics} onClick={() => togglePanel('analytics')} icon={<Network size={15} />} label={showToolbarLabel ? t('analytics') : ''} title={t('analytics')} />
          <ToolbarBtn active={panels.evidence} onClick={() => togglePanel('evidence')} icon={<FileText size={15} />} label={showToolbarLabel ? t('evidence') : ''} title={t('evidence')} />
          <ToolbarBtn active={panels.correlation} onClick={() => togglePanel('correlation')} icon={<GitCompare size={15} />} label={showToolbarLabel ? t('correlate') : ''} title={t('correlate')} />
          <ToolbarBtn active={panels.ai} onClick={() => togglePanel('ai')} icon={<Bot size={15} />} label={showToolbarLabel ? 'AI' : ''} title="AI" />
          <ToolbarBtn active={panels.settings} onClick={() => togglePanel('settings')} icon={<Settings size={15} />} label={showToolbarLabel ? t('settings') : ''} title={t('settings')} />
          <button type="button" className="btn btn-ghost" onClick={() => setShowWelcome(true)} style={{ marginLeft: 4, fontSize: 11 }}>{t('home')}</button>
          <button type="button" className="btn btn-ghost" onClick={() => setCommandPaletteOpen(true)} style={{ fontSize: 11 }}>Ctrl+K</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {panels.sidebar && device.class !== 'phone' && (
          <div className="argus-panel-shell anim-slide-left">
            <Sidebar />
          </div>
        )}
        {panels.search && (
          <div className="anim-slide-left argus-overlay-panel" style={{ height: '100%' }}>
            <SearchPanel />
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <ReactFlowProvider>
              {graphSettings.enable3d ? <Graph3D /> : <GraphCanvas />}
              {!graphSettings.enable3d && <CanvasOverlay />}
            </ReactFlowProvider>
            {panels.map && (
              <div className="argus-map-layer" style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                <MapPanel />
              </div>
            )}
          </div>
          {panels.timeline && (
            <div className="argus-timeline-shell">
              <Timeline />
            </div>
          )}
        </div>
        {panels.rightPanel && device.class !== 'phone' && (
          <div className="argus-panel-shell anim-slide-right">
            <ObjectInspector />
          </div>
        )}
        {panels.settings && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
            <SettingsPanel />
          </div>
        )}
        {panels.maltego && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
            <MaltegoPanel />
          </div>
        )}
        {panels.tutorial && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
            <TutorialPanel />
          </div>
        )}
        {panels.analytics && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
            <GraphAnalyticsPanel />
          </div>
        )}
        {panels.evidence && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
            <EvidencePanel />
          </div>
        )}
        {panels.correlation && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
            <CorrelationPanel />
          </div>
        )}
        {panels.ai && (
          <div className="argus-overlay-panel" style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
            <AiAssistantPanel />
          </div>
        )}
      </div>

      <div
        style={{
          height: 'var(--footer-h)',
          flexShrink: 0,
          borderTop: '1px solid var(--border)',
          background: 'var(--header-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 10,
          color: 'var(--text-muted)',
        }}
      >
        <span>ARGUS · sellmetadone</span>
        <span>·</span>
        <a href="https://t.me/sofia_white_death" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          @sofia_white_death
        </a>
        <span>·</span>
        <a href="https://t.me/argus_platform" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          t.me/argus_platform
        </a>
        <span>·</span>
        <span title="Device profile">
          {device.class}/{device.density}
        </span>
      </div>
      <CommandPalette />
    </div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  icon,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      className={active ? 'btn btn-icon active' : 'btn btn-icon'}
      style={{ gap: 6, padding: label ? '6px 10px' : '6px' }}
    >
      {icon}
      {label ? <span style={{ fontSize: 12 }}>{label}</span> : null}
    </button>
  );
}
