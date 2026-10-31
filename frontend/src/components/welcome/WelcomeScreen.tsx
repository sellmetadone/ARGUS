import { useRef } from 'react';
import { Plus, FolderOpen, GraduationCap, Settings, Network } from 'lucide-react';
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
    const name = window.prompt('Название нового холста / кейса:', `Canvas ${cases.length + 1}`);
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
        alert('Неверный формат. Нужен JSON: { name?, entities, relationships }');
      }
    } catch {
      alert('Не удалось прочитать файл');
    }
  };

  const openTutorial = () => {
    setShowWelcome(false);
    setPanel('tutorial', true);
  };

  const openSettings = () => {
    setShowWelcome(false);
    setPanel('settings', true);
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
          width: 420,
          maxWidth: '92vw',
          background: '#0f172aee',
          border: '1px solid #334155',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 25px 80px rgba(0,0,0,0.55)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Network size={40} color={appearance.accentColor} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: '#e2e8f0' }}>ARGUS</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Cyber Investigation Graph</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.5 }}>
            by <span style={{ color: '#c4b5fd' }}>sellmetadone</span>
            <br />
            <a href="https://t.me/sofia_white_death" target="_blank" rel="noreferrer" style={{ color: '#94a3b8' }}>
              @sofia_white_death
            </a>
            {' · '}
            <a href="https://t.me/argus_platform" target="_blank" rel="noreferrer" style={{ color: '#94a3b8' }}>
              t.me/argus_platform
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MenuBtn
            icon={<Plus size={18} />}
            title="1. Новый холст"
            subtitle="Пустой кейс / граф расследования"
            accent={appearance.accentColor}
            onClick={newCanvas}
          />
          <MenuBtn
            icon={<FolderOpen size={18} />}
            title="2. Загрузить JSON"
            subtitle="Импорт entities + relationships"
            accent={appearance.accentColor}
            onClick={() => fileRef.current?.click()}
          />
          <MenuBtn
            icon={<GraduationCap size={18} />}
            title="3. Обучение"
            subtitle="OSINT цикл, Shodan, CLI"
            accent={appearance.accentColor}
            onClick={openTutorial}
          />
          <MenuBtn
            icon={<Settings size={18} />}
            title="4. Настройки"
            subtitle="Тема, цвета, язык, Shodan API"
            accent={appearance.accentColor}
            onClick={openSettings}
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
          onClick={enterApp}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '10px',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            fontSize: 12,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Продолжить с текущим кейсом →
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
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '14px 16px',
        textAlign: 'left',
        background: 'transparent',
        border: '1px solid #33415555',
        borderRadius: 10,
        cursor: 'pointer',
        color: 'inherit',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.background = `${accent}18`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#33415555';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${accent}22`,
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
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{subtitle}</div>
      </div>
    </button>
  );
}
