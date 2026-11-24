import {
  FolderOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  Settings,
  Network,
  Trash2,
  Eraser,
  Pencil,
} from 'lucide-react';
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
  } = useStore();

  const collapsed = !panels.sidebar;

  const handleNewCase = () => {
    const name = window.prompt(
      t('case_name_prompt'),
      `${t('investigation')} #${String(cases.length + 1).padStart(3, '0')}`
    );
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
      <aside className="argus-sidebar argus-sidebar--rail" aria-label={t('cases')}>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => togglePanel('sidebar')}
          title={t('expand') || 'Expand'}
          aria-label={t('expand') || 'Expand sidebar'}
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => togglePanel('search')}
          title={t('search')}
          aria-label={t('search')}
        >
          <SearchIcon size={18} />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => togglePanel('settings')}
          title={t('settings')}
          aria-label={t('settings')}
        >
          <Settings size={18} />
        </button>
        <button
          type="button"
          className="btn btn-filled btn-icon sidebar-fab-rail"
          onClick={handleNewCase}
          title={t('new_case')}
          aria-label={t('new_case')}
        >
          <Plus size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="argus-sidebar argus-sidebar--expanded" aria-label={t('cases')}>
      <header className="sidebar-header">
        <div className="sidebar-header-title">
          <span className="sidebar-header-icon" aria-hidden="true">
            <FolderOpen size={18} />
          </span>
          <span className="md-label-medium sidebar-header-label">{t('cases')}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => togglePanel('sidebar')}
          aria-label={t('collapse') || 'Collapse sidebar'}
        >
          <ChevronLeft size={18} />
        </button>
      </header>

      <div className="sidebar-case-list">
        {cases.length === 0 && <div className="sidebar-empty">{t('cases_empty')}</div>}
        {cases.map((c) => {
          const active = activeCaseId === c.id;
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              className={`sidebar-case${active ? ' is-active' : ''}`}
              onClick={() => setActiveCase(c.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveCase(c.id);
                }
              }}
            >
              <div className="sidebar-case-name">{c.name}</div>
              <div className="sidebar-case-status">
                {c.status === 'open'
                  ? t('status_open')
                  : c.status === 'closed'
                    ? t('status_closed')
                    : t('status_archived')}
              </div>
              <div className="sidebar-case-actions" onClick={(e) => e.stopPropagation()}>
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
          );
        })}
      </div>

      <nav className="sidebar-nav">
        <NavBtn icon={<SearchIcon size={16} />} label={t('search')} onClick={() => togglePanel('search')} />
        <NavBtn
          icon={<Network size={16} />}
          label={t('graph')}
          onClick={() => setActiveCase(activeCaseId)}
        />
        <NavBtn
          icon={<Settings size={16} />}
          label={t('settings')}
          onClick={() => togglePanel('settings')}
        />
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="btn btn-filled" onClick={handleNewCase}>
          <Plus size={16} />
          {t('new_case')}
        </button>
      </div>
    </aside>
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
      className={`btn btn-icon sidebar-mini ${danger ? 'btn-danger' : 'btn-secondary'}`}
    >
      {children}
    </button>
  );
}

function NavBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="btn btn-ghost sidebar-nav-btn">
      {icon}
      <span>{label}</span>
    </button>
  );
}
