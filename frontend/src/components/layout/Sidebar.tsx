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
    const name = window.prompt(t('case_name_prompt'), `${t('investigation')} #${String(cases.length + 1).padStart(3, '0')}`);
    if (name === null) return;
    const id = `case-${Date.now()}`;
    addCase({
      id,
      name: name.trim() || `${t('investigation')} #${String(cases.length + 1).padStart(3, '0')}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setActiveCase(id);
  };

  const handleDeleteCase = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('case_delete_confirm').replace('{name}', name))) return;
    removeCase(id);
  };

  const handleRename = (id: string, oldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = window.prompt(t('case_rename_prompt'), oldName);
    if (name === null || !name.trim()) return;
    renameCase(id, name.trim());
  };

  const handleClear = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('case_clear_confirm'))) return;
    clearCaseData(id);
  };

  if (collapsed) {
    return (
      <div
        style={{
          width: 48,
          background: 'var(--panel)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
          gap: 8,
        }}
      >
        <button type="button" onClick={() => togglePanel('sidebar')} className="btn btn-ghost" style={{ padding: 8 }}>
          <ChevronRight size={18} />
        </button>
        <button type="button" onClick={() => togglePanel('search')} className="btn btn-ghost" style={{ padding: 8 }} title={t('search')}>
          <SearchIcon size={16} />
        </button>
        <button type="button" onClick={() => togglePanel('settings')} className="btn btn-ghost" style={{ padding: 8 }} title={t('settings')}>
          <Settings size={16} />
        </button>
        <button type="button" onClick={handleNewCase} className="btn btn-ghost" style={{ padding: 8 }} title={t('new_case')}>
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 280,
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          padding: '16px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOpen size={18} color={appearance.accentColor} />
          <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: 0.5 }}>
            {t('cases').toUpperCase()}
          </span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => togglePanel('sidebar')} style={{ padding: 4 }}>
          <ChevronLeft size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {cases.length === 0 && (
          <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>{t('cases_empty')}</div>
        )}
        {cases.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveCase(c.id)}
            style={{
              padding: '10px 12px',
              background: activeCaseId === c.id ? 'var(--accent-soft)' : 'transparent',
              borderLeft:
                activeCaseId === c.id ? `3px solid ${appearance.accentColor}` : '3px solid transparent',
              cursor: 'pointer',
              color: activeCaseId === c.id ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              {c.status === 'open'
                ? t('status_open')
                : c.status === 'closed'
                  ? t('status_closed')
                  : t('status_archived')}
            </div>
            <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <MiniBtn title={t('rename')} onClick={(e) => handleRename(c.id, c.name, e)}>
                <Pencil size={12} />
              </MiniBtn>
              <MiniBtn title={t('clear_graph')} onClick={(e) => handleClear(c.id, e)}>
                <Eraser size={12} />
              </MiniBtn>
              <MiniBtn title={t('delete')} danger onClick={(e) => handleDeleteCase(c.id, c.name, e)}>
                <Trash2 size={12} />
              </MiniBtn>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 8, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <NavBtn icon={<SearchIcon size={14} />} label={t('search')} onClick={() => togglePanel('search')} />
        <NavBtn icon={<Network size={14} />} label={t('graph')} onClick={() => setActiveCase(activeCaseId)} />
        <NavBtn icon={<Settings size={14} />} label={t('settings')} onClick={() => togglePanel('settings')} />
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn btn-primary" onClick={handleNewCase} style={{ width: '100%' }}>
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
    <button type="button" title={title} onClick={onClick} className={danger ? 'btn btn-danger' : 'btn btn-secondary'} style={{ padding: '3px 6px' }}>
      {children}
    </button>
  );
}

function NavBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}>
      {icon}
      {label}
    </button>
  );
}
