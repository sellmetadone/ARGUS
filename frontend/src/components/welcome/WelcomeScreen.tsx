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
    <div className="welcome-screen" role="dialog" aria-modal="true" aria-label={t('app_name')}>
      <div className="welcome-card">
        <div className="welcome-hero">
          <img
            className="welcome-logo"
            src="/argus_logo.svg"
            alt="ARGUS"
            width={72}
            height={72}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.svg';
            }}
          />
          <h1 className="welcome-title md-title-large">{t('app_name')}</h1>
          <p className="welcome-tagline md-body-medium">{t('welcome_tagline')}</p>
          <p className="welcome-byline md-label-medium">
            by <span className="welcome-accent">sellmetadone</span>
            <br />
            <a href="https://t.me/sofia_white_death" target="_blank" rel="noreferrer">
              @sofia_white_death
            </a>
            {' · '}
            <a href="https://t.me/argus_platform" target="_blank" rel="noreferrer">
              t.me/argus_platform
            </a>
          </p>
        </div>

        <div className="welcome-actions">
          <MenuBtn
            icon={<Plus size={18} strokeWidth={2} />}
            title={t('welcome_new')}
            subtitle={t('welcome_new_sub')}
            onClick={newCanvas}
          />
          <MenuBtn
            icon={<FolderOpen size={18} strokeWidth={2} />}
            title={t('welcome_load')}
            subtitle={t('welcome_load_sub')}
            onClick={() => fileRef.current?.click()}
          />
          <MenuBtn
            icon={<GraduationCap size={18} strokeWidth={2} />}
            title={t('welcome_tutorial')}
            subtitle={t('welcome_tutorial_sub')}
            onClick={() => {
              setShowWelcome(false);
              setPanel('tutorial', true);
            }}
          />
          <MenuBtn
            icon={<Settings size={18} strokeWidth={2} />}
            title={t('settings')}
            subtitle={t('welcome_settings_sub')}
            onClick={() => {
              setShowWelcome(false);
              setPanel('settings', true);
            }}
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadCanvas(f);
          }}
        />

        <button type="button" className="btn btn-filled welcome-continue" onClick={enterApp}>
          {t('welcome_continue')}
        </button>
      </div>
    </div>
  );
}

function MenuBtn({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="welcome-menu-btn" onClick={onClick}>
      <span className="welcome-menu-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="welcome-menu-copy">
        <span className="welcome-menu-title">{title}</span>
        <span className="welcome-menu-sub">{subtitle}</span>
      </span>
    </button>
  );
}
