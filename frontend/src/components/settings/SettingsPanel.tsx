import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LANG_META, type LangCode } from '../../i18n/locales';
import { validateGraphIntegrity, formatIntegrityReport } from '../../services/integrity';
import { useT } from '../../i18n/useT';

export default function SettingsPanel() {
  const t = useT();
  const { setPanel, appearance, setAppearance, graphSettings, setGraphSettings, shodanApiKey, setShodanApiKey } =
    useStore();

  return (
    <div
      className="argus-panel"
      style={{
        width: 360,
        background: 'var(--panel)',
        borderLeft: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 20,
        color: 'var(--text)',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1 }}>
          {t('settings').toUpperCase()}
        </span>
        <button type="button" className="btn btn-ghost" onClick={() => setPanel('settings', false)} style={{ padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontSize: 13 }}>
        <Section title={t('theme')}>
          <select
            value={appearance.theme}
            onChange={(e) => setAppearance({ theme: e.target.value as 'dark' | 'light' | 'amoled' })}
            style={selectStyle}
          >
            <option value="light">{t('theme_light')}</option>
            <option value="dark">{t('theme_dark')}</option>
            <option value="amoled">{t('theme_amoled')}</option>
          </select>
        </Section>

        <Section title={t('accent_color')}>
          <input
            type="color"
            value={appearance.accentColor}
            onChange={(e) => setAppearance({ accentColor: e.target.value })}
            style={{ width: '100%', height: 36, border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
        </Section>

        <Section title={t('language')}>
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

        <Section title={t('focus_mode')}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={graphSettings.focusMode}
              onChange={(e) => setGraphSettings({ focusMode: e.target.checked })}
            />
            {t('focus_mode_desc')}
          </label>
        </Section>

        <Section title={t('snap_grid')}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={!!graphSettings.snapToGrid}
              onChange={(e) => setGraphSettings({ snapToGrid: e.target.checked })}
            />
            {t('snap_to_grid')}
          </label>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('grid_size')}</label>
          <input
            type="number"
            min={5}
            max={80}
            value={graphSettings.gridSize || 20}
            onChange={(e) => setGraphSettings({ gridSize: Number(e.target.value) || 20 })}
            style={selectStyle}
          />
        </Section>

        <Section title={t('layout')}>
          <select
            value={graphSettings.layoutPreset}
            onChange={(e) =>
              setGraphSettings({
                layoutPreset: e.target.value as 'force' | 'radial' | 'grid' | 'hierarchy',
              })
            }
            style={selectStyle}
          >
            <option value="force">{t('layout_force')}</option>
            <option value="radial">{t('layout_radial')}</option>
            <option value="grid">{t('layout_grid')}</option>
            <option value="hierarchy">{t('layout_hierarchy')}</option>
          </select>
        </Section>

        <Section title={t('graph_3d')}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={graphSettings.enable3d}
              onChange={(e) => setGraphSettings({ enable3d: e.target.checked })}
            />
            {t('enable_3d')}
          </label>
        </Section>

        <Section title={t('shodan_key')}>
          <input
            type="password"
            value={shodanApiKey}
            onChange={(e) => setShodanApiKey(e.target.value)}
            placeholder={t('shodan_ph')}
            style={selectStyle}
          />
        </Section>

        <Section title={t('data_integrity')}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              const s = useStore.getState();
              const issues = validateGraphIntegrity({
                cases: s.cases,
                entities: s.entities,
                relationships: s.relationships,
                timeline: s.timeline,
                caseId: s.activeCaseId,
              });
              alert(formatIntegrityReport(issues));
            }}
          >
            {t('validate_case')}
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 8 }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  fontSize: 13,
  boxSizing: 'border-box',
};
