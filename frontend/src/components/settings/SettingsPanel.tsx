import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LANG_META, type LangCode } from '../../i18n/locales';
import { validateGraphIntegrity, formatIntegrityReport } from '../../services/integrity';
import { useT } from '../../i18n/useT';

export default function SettingsPanel() {
  const t = useT();
  const { setPanel, appearance, setAppearance, graphSettings, setGraphSettings, shodanApiKey, setShodanApiKey } =
    useStore();
  const density = appearance.density ?? 'auto';

  return (
    <div className="settings-panel argus-side-panel md-sheet-enter">
      <header className="argus-side-panel__header">
        <span className="argus-side-panel__title md-label-medium">{t('settings')}</span>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPanel('settings', false)} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      <div className="argus-side-panel__body md-stagger">
        <Section title={t('theme')}>
          <div className="md-segmented" role="group" aria-label={t('theme')}>
            {(['light', 'dark', 'amoled'] as const).map((th) => (
              <button key={th} type="button" className={`md-segmented__btn ${appearance.theme === th ? 'is-selected' : ''}`} onClick={() => setAppearance({ theme: th })}>
                {th === 'light' ? t('theme_light') : th === 'dark' ? t('theme_dark') : t('theme_amoled')}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Density">
          <div className="md-segmented md-segmented--wrap" role="group" aria-label="Density">
            {([['auto', 'Auto'], ['compact', 'Compact'], ['comfortable', 'Comfort'], ['spacious', 'Spacious']] as const).map(([val, label]) => (
              <button key={val} type="button" className={`md-segmented__btn ${density === val ? 'is-selected' : ''}`} onClick={() => setAppearance({ density: val })}>
                {label}
              </button>
            ))}
          </div>
          <p className="md-muted" style={{ marginTop: 8, marginBottom: 0 }}>
            Auto follows screen via deviceProfile. Manual forces compact / comfortable / spacious.
          </p>
        </Section>

        <Section title={t('accent_color')}>
          <div className="md-color-row">
            <input type="color" className="md-color-input" value={appearance.accentColor} onChange={(e) => setAppearance({ accentColor: e.target.value })} aria-label={t('accent_color')} />
            <span className="md-color-value">{appearance.accentColor}</span>
          </div>
        </Section>

        <Section title={t('language')}>
          <select className="md-select" value={appearance.language} onChange={(e) => setAppearance({ language: e.target.value as LangCode })}>
            {(Object.keys(LANG_META) as LangCode[]).map((code) => (
              <option key={code} value={code}>{LANG_META[code].native}</option>
            ))}
          </select>
        </Section>

        <Section title={t('focus_mode')}>
          <label className="md-switch-row">
            <span>{t('focus_mode_desc')}</span>
            <input type="checkbox" className="md-switch" checked={!!graphSettings.focusMode} onChange={(e) => setGraphSettings({ focusMode: e.target.checked })} />
          </label>
        </Section>

        <Section title={t('snap_grid')}>
          <label className="md-switch-row">
            <span>{t('snap_to_grid')}</span>
            <input type="checkbox" className="md-switch" checked={!!graphSettings.snapToGrid} onChange={(e) => setGraphSettings({ snapToGrid: e.target.checked })} />
          </label>
          <label className="md-field-label" htmlFor="grid-size">{t('grid_size')}</label>
          <input id="grid-size" className="md-select" type="number" min={5} max={80} value={graphSettings.gridSize || 20} onChange={(e) => setGraphSettings({ gridSize: Number(e.target.value) || 20 })} />
        </Section>

        <Section title={t('layout')}>
          <select className="md-select" value={graphSettings.layoutPreset} onChange={(e) => setGraphSettings({ layoutPreset: e.target.value as 'force' | 'radial' | 'grid' | 'hierarchy' })}>
            <option value="force">{t('layout_force')}</option>
            <option value="radial">{t('layout_radial')}</option>
            <option value="grid">{t('layout_grid')}</option>
            <option value="hierarchy">{t('layout_hierarchy')}</option>
          </select>
        </Section>

        <Section title={t('graph_3d')}>
          <label className="md-switch-row">
            <span>{t('enable_3d')}</span>
            <input type="checkbox" className="md-switch" checked={!!graphSettings.enable3d} onChange={(e) => setGraphSettings({ enable3d: e.target.checked })} />
          </label>
        </Section>

        <Section title={t('shodan_key')}>
          <input className="md-select" type="password" value={shodanApiKey} onChange={(e) => setShodanApiKey(e.target.value)} placeholder={t('shodan_ph')} autoComplete="off" />
        </Section>

        <Section title={t('data_integrity')}>
          <button type="button" className="btn btn-outlined" style={{ width: '100%' }} onClick={() => {
            const s = useStore.getState();
            const issues = validateGraphIntegrity({ cases: s.cases, entities: s.entities, relationships: s.relationships, timeline: s.timeline, caseId: s.activeCaseId });
            alert(formatIntegrityReport(issues));
          }}>{t('validate_case')}</button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="md-section md-stagger-item">
      <h3 className="md-section__title">{title}</h3>
      <div className="md-section__body">{children}</div>
    </section>
  );
}
