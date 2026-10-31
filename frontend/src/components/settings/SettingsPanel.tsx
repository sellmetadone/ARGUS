import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LANG_META, type LangCode } from '../../i18n/locales';

export default function SettingsPanel() {
  const { setPanel, appearance, setAppearance, graphSettings, setGraphSettings, shodanApiKey, setShodanApiKey } =
    useStore();

  return (
    <div
      style={{
        width: 360,
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
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: 1 }}>SETTINGS</span>
        <button onClick={() => setPanel('settings', false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontSize: 13, color: '#cbd5e1' }}>
        <Section title="Theme">
          <select
            value={appearance.theme}
            onChange={(e) => setAppearance({ theme: e.target.value as 'dark' | 'light' | 'amoled' })}
            style={selectStyle}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="amoled">AMOLED</option>
          </select>
        </Section>

        <Section title="Accent color">
          <input
            type="color"
            value={appearance.accentColor}
            onChange={(e) => setAppearance({ accentColor: e.target.value })}
            style={{ width: '100%', height: 36, border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
        </Section>

        <Section title="Language">
          <select
            value={appearance.language}
            onChange={(e) => setAppearance({ language: e.target.value as LangCode })}
            style={selectStyle}
          >
            {(Object.keys(LANG_META) as LangCode[]).map((code) => (
              <option key={code} value={code}>
                {LANG_META[code].native}
              </option>
            ))}
          </select>
        </Section>

        <Section title="Focus mode (Obsidian-style)">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={graphSettings.focusMode}
              onChange={(e) => setGraphSettings({ focusMode: e.target.checked })}
            />
            Dim non-neighbors
          </label>
        </Section>

        <Section title="Layout preset">
          <select
            value={graphSettings.layoutPreset}
            onChange={(e) =>
              setGraphSettings({
                layoutPreset: e.target.value as 'force' | 'radial' | 'grid' | 'hierarchy',
              })
            }
            style={selectStyle}
          >
            <option value="force">Force</option>
            <option value="radial">Radial</option>
            <option value="grid">Grid</option>
            <option value="hierarchy">Hierarchy</option>
          </select>
        </Section>

        <Section title="Edge style">
          <select
            value={graphSettings.edgeStyle}
            onChange={(e) => setGraphSettings({ edgeStyle: e.target.value as any })}
            style={selectStyle}
          >
            <option value="smoothstep">Smoothstep</option>
            <option value="bezier">Bezier</option>
            <option value="straight">Straight</option>
            <option value="step">Step</option>
          </select>
        </Section>

        <Section title="Edge variant">
          <select
            value={graphSettings.edgeVariant}
            onChange={(e) => setGraphSettings({ edgeVariant: e.target.value as any })}
            style={selectStyle}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="animated">Animated</option>
            <option value="thick">Thick</option>
          </select>
        </Section>

        <Section title="3D graph">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={graphSettings.enable3d}
              onChange={(e) => setGraphSettings({ enable3d: e.target.checked })}
            />
            Enable 3D view
          </label>
        </Section>

        <Section title="Shodan API key">
          <input
            type="password"
            value={shodanApiKey}
            onChange={(e) => setShodanApiKey(e.target.value)}
            placeholder="Optional — stored in localStorage only"
            style={{
              width: '100%',
              padding: '8px 10px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#e2e8f0',
              fontSize: 12,
            }}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: 0.5, marginBottom: 8 }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 6,
  color: '#e2e8f0',
  fontSize: 13,
};
