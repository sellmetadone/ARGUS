import { useRef } from 'react';
import { Plus, FolderOpen, GraduationCap, Settings } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useT } from '../../i18n/useT';

export default function WelcomeScreen() {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    setShowWelcome,
    addCase,
    setActiveCase,
    cases,
    importGraph,
    setPanel,
    appearance,
  } = useStore();

  const enterApp = () => setShowWelcome(false);

  const newCanvas = () => {
    const name = window.prompt(t('case_name_prompt'), `${t('investigation')} ${cases.length + 1}`);
    if (name === null) return;
    const id = `case-${Date.now()}`;
    addCase({
      id,
      name: name.trim() || `${t('investigation')} ${cases.length + 1}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: 'Empty investigation canvas',
    });
    setActiveCase(id);
    setShowWelcome(false);
  };

  const loadCanvas = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.entities && data.relationships) {
        const id = `case-${Date.now()}`;
        addCase({
          id,
          name: data.name || file.name.replace(/\.json$/i, '') || 'Loaded canvas',
          status: 'open',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setActiveCase(id);
        const ents = (data.entities || []).map((e: Record<string, unknown>) => ({
          ...e,
          id: (e.id as string) || `ent-${Math.random().toString(36).slice(2)}`,
          caseId: id,
        }));
        const rels = (data.relationships || []).map((r: Record<string, unknown>) => ({
          ...r,
          id: (r.id as string) || `rel-${Math.random().toString(36).slice(2)}`,
          caseId: id,
        }));
        importGraph(JSON.stringify({ entities: ents, relationships: rels }));
        setShowWelcome(false);
      } else {
        alert(t('welcome_invalid_json'));
      }
    } catch {
      alert(t('welcome_read_error'));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: appearance.theme === 'light'
          ? 'radial-gradient(ellipse at 30% 20%, #e8eef5 0%, #F7F7F5 55%, #e7e8e5 100%)'
          : 'radial-gradient(ellipse at 30% 20%, #1e1b4b 0%, #020617 55%, #000 100%)',
      }}
    >
      <div
        style={{
          width: 400,
          maxWidth: '92vw',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '32px 28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          color: 'var(--text)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/argus_logo.svg"
            alt="ARGUS"
            width={72}
            height={72}
            style={{ display: 'block', margin: '0 auto 14px', borderRadius: 12 }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.svg';
            }}
          />
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>{t('app_name')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{t('welcome_tagline')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.55 }}>
            by <span style={{ color: 'var(--accent)' }}>sellmetadone</span>
            <br />
            <a href="https://t.me/sofia_white_death" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>@sofia_white_death</a>
            {' · '}
            <a href="https://t.me/argus_platform" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>t.me/argus_platform</a>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <MenuBtn icon={<Plus size={17} strokeWidth={2} />} title={t('welcome_new')} subtitle={t('welcome_new_sub')} accent={appearance.accentColor} onClick={newCanvas} />
          <MenuBtn icon={<FolderOpen size={17} strokeWidth={2} />} title={t('welcome_load')} subtitle={t('welcome_load_sub')} accent={appearance.accentColor} onClick={() => fileRef.current?.click()} />
          <MenuBtn icon={<GraduationCap size={17} strokeWidth={2} />} title={t('welcome_tutorial')} subtitle={t('welcome_tutorial_sub')} accent={appearance.accentColor} onClick={() => { setShowWelcome(false); setPanel('tutorial', true); }} />
          <MenuBtn icon={<Settings size={17} strokeWidth={2} />} title={t('settings')} subtitle={t('welcome_settings_sub')} accent={appearance.accentColor} onClick={() => { setShowWelcome(false); setPanel('settings', true); }} />
        </div>

        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadCanvas(f); }} />

        <button type="button" className="btn btn-secondary" onClick={enterApp} style={{ marginTop: 18, width: '100%' }}>
          {t('welcome_continue')}
        </button>
      </div>
    </div>
  );
}

function MenuBtn({
  icon, title, subtitle, onClick, accent,
}: {
  icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px',
        textAlign: 'left', background: 'transparent', border: '1px solid var(--border)',
        borderRadius: 8, cursor: 'pointer', color: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.background = `${accent}14`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${accent}20`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
      </div>
    </button>
  );
}
