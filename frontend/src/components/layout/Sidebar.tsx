import { FolderOpen, Plus, ChevronLeft, ChevronRight, Search as SearchIcon, Settings, Network, Trash2, Eraser, Pencil } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useT } from '../../i18n/useT';

export default function Sidebar() {
  const t = useT();
  const {
    cases,
    activeCaseId,
    setActiveCase,
    panels,
    togglePanel,
    addCase,
    removeCase,
    renameCase,
    clearCaseData,
    appearance,
  } = useStore();

  const collapsed = !panels.sidebar;

  const handleNewCase = () => {
    const name = window.prompt('Case name:', `Investigation #${String(cases.length + 1).padStart(3, '0')}`);
    if (name === null) return;
    const id = `case-${Date.now()}`;
    addCase({
      id,
      name: name.trim() || `Investigation #${String(cases.length + 1).padStart(3, '0')}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setActiveCase(id);
  };

  const handleDeleteCase = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete case "${name}" and its graph?`)) return;
    removeCase(id);
  };

  const handleRename = (id: string, oldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = window.prompt('Rename case:', oldName);
    if (name === null || !name.trim()) return;
    renameCase(id, name.trim());
  };

  const handleClear = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Clear all nodes and edges in this case?')) return;
    clearCaseData(id);
  };

  if (collapsed) {
    return (
      <div
        style={{
          width: 48,
          background: '#0f172a',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
          gap: 8,
        }}
      >
        <button type="button" onClick={() => togglePanel('sidebar')} style={iconBtn}>
          <ChevronRight size={18} />
        </button>
        <button type="button" onClick={() => togglePanel('search')} style={iconBtn} title="Search">
          <SearchIcon size={16} />
        </button>
        <button type="button" onClick={() => togglePanel('settings')} style={iconBtn} title="Settings">
          <Settings size={16} />
        </button>
        <button type="button" onClick={handleNewCase} style={iconBtn} title="New case">
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 280,
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '16px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOpen size={18} color={appearance.accentColor} />
          <span style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', letterSpacing: 0.5 }}>
            {t('cases').toUpperCase()}
          </span>
        </div>
        <button
          type="button"
          onClick={() => togglePanel('sidebar')}
          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {cases.length === 0 && (
          <div style={{ padding: 16, fontSize: 12, color: '#64748b' }}>No cases yet. Create one below.</div>
        )}
        {cases.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveCase(c.id)}
            style={{
              padding: '10px 12px',
              background: activeCaseId === c.id ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              borderLeft:
                activeCaseId === c.id ? `3px solid ${appearance.accentColor}` : '3px solid transparent',
              cursor: 'pointer',
              color: activeCaseId === c.id ? '#e2e8f0' : '#94a3b8',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              {c.status === 'open'
                ? t('status_open')
                : c.status === 'closed'
                  ? t('status_closed')
                  : t('status_archived')}
            </div>
            <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <MiniBtn title="Rename" onClick={(e) => handleRename(c.id, c.name, e)}>
                <Pencil size={12} />
              </MiniBtn>
              <MiniBtn title="Clear graph" onClick={(e) => handleClear(c.id, e)}>
                <Eraser size={12} />
              </MiniBtn>
              <MiniBtn title="Delete case" danger onClick={(e) => handleDeleteCase(c.id, c.name, e)}>
                <Trash2 size={12} />
              </MiniBtn>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 8, borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <NavBtn icon={<SearchIcon size={14} />} label={t('search')} onClick={() => togglePanel('search')} />
        <NavBtn icon={<Network size={14} />} label="Graph" onClick={() => setActiveCase(activeCaseId)} />
        <NavBtn icon={<Settings size={14} />} label={t('settings')} onClick={() => togglePanel('settings')} />
      </div>

      <div style={{ padding: 12, borderTop: '1px solid #1e293b' }}>
        <button
          type="button"
          onClick={handleNewCase}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid #4f46e5',
            borderRadius: 6,
            color: '#c7d2fe',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Plus size={16} />
          {t('new_case')}
        </button>
      </div>
    </div>
  );
}

function MiniBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: '3px 6px',
        background: danger ? 'rgba(127, 29, 29, 0.4)' : '#1e293b',
        border: `1px solid ${danger ? '#7f1d1d' : '#334155'}`,
        borderRadius: 4,
        color: danger ? '#fca5a5' : '#94a3b8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {children}
    </button>
  );
}

function NavBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: 'transparent',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        fontSize: 12,
        borderRadius: 6,
        width: '100%',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

const iconBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: 8,
};
