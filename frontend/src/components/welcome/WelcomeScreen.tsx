import { useRef } from 'react';
import { Plus, FolderOpen, GraduationCap, Settings } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function WelcomeScreen() {
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
    const name = window.prompt('Case name:', `Canvas ${cases.length + 1}`);
    if (name === null) return;
    const id = `case-${Date.now()}`;
    addCase({
      id,
      name: name.trim() || `Canvas ${cases.length + 1}`,
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
        const ents = (data.entities || []).map((e: any) => ({
          ...e,
          id: e.id || `ent-${Math.random().toString(36).slice(2)}`,
          caseId: id,
        }));
        const rels = (data.relationships || []).map((r: any) => ({
          ...r,
          id: r.id || `rel-${Math.random().toString(36).slice(2)}`,
          caseId: id,
        }));
        importGraph(JSON.stringify({ entities: ents, relationships: rels }));
        setShowWelcome(false);
      } else {
        alert('Invalid format. Expected JSON: { name?, entities, relationships }');
      }
    } catch {
      alert('Could not read file');
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
        background: 'radial-gradient(ellipse at 30% 20%, #1e1b4b 0%, #020617 55%, #000 100%)',
      }}
    >
      <div
        style={{
          width: 400,
          maxWidth: '92vw',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid #334155',
          borderRadius: 14,
          padding: '32px 28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/argus_logo.svg"
            alt="ARGUS"
            width={72}
            height={72}
            style={{
              display: 'block',
              margin: '0 auto 14px',
              borderRadius: 12,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.svg';
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 4,
              color: '#e8eaf6',
            }}
          >
            ARGUS
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Cyber Investigation Graph
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.55 }}>
            by{' '}
            <span style={{ color: '#a5b4fc' }}>sellmetadone</span>
            <br />
            <a
              href="https://t.me/sofia_white_death"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none' }}
            >
              @sofia_white_death
            </a>
            {' · '}
            <a
              href="https://t.me/argus_platform"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none' }}
            >
              t.me/argus_platform
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <MenuBtn
            icon={<Plus size={17} strokeWidth={2} />}
            title="New canvas"
            subtitle="Empty investigation case"
            accent={appearance.accentColor}
            onClick={newCanvas}
          />
          <MenuBtn
            icon={<FolderOpen size={17} strokeWidth={2} />}
            title="Load JSON"
            subtitle="Import entities and relationships"
            accent={appearance.accentColor}
            onClick={() => fileRef.current?.click()}
          />
          <MenuBtn
            icon={<GraduationCap size={17} strokeWidth={2} />}
            title="Tutorial"
            subtitle="OSINT flow, search, CLI"
            accent={appearance.accentColor}
            onClick={() => {
              setShowWelcome(false);
              setPanel('tutorial', true);
            }}
          />
          <MenuBtn
            icon={<Settings size={17} strokeWidth={2} />}
            title="Settings"
            subtitle="Theme, language, API keys"
            accent={appearance.accentColor}
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

        <button
          type="button"
          onClick={enterApp}
          style={{
            marginTop: 18,
            width: '100%',
            padding: '10px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#94a3b8',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Continue with current case
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
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '12px 14px',
        textAlign: 'left',
        background: 'transparent',
        border: '1px solid #334155',
        borderRadius: 8,
        cursor: 'pointer',
        color: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.background = `${accent}14`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#334155';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${accent}20`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{subtitle}</div>
      </div>
    </button>
  );
}
