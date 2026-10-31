import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';

interface Cmd {
  id: string;
  label: string;
  group: string;
  action: () => void;
}

export default function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    cases,
    setActiveCase,
    entities,
    setSelectedEntity,
    togglePanel,
    setWorkspace,
    undo,
    redo,
    exportGraph,
    expandNode,
    selectedEntityId,
  } = useStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const commands: Cmd[] = useMemo(() => {
    const list: Cmd[] = [
      { id: 'panel-search', label: 'Toggle Search Panel', group: 'Panels', action: () => togglePanel('search') },
      { id: 'panel-settings', label: 'Open Settings', group: 'Panels', action: () => togglePanel('settings') },
      { id: 'panel-maltego', label: 'Toggle Maltego Panel', group: 'Panels', action: () => togglePanel('maltego') },
      { id: 'panel-timeline', label: 'Toggle Timeline', group: 'Panels', action: () => togglePanel('timeline') },
      { id: 'panel-map', label: 'Toggle Map', group: 'Panels', action: () => togglePanel('map') },
      { id: 'ws-osint', label: 'Workspace: OSINT', group: 'Workspace', action: () => setWorkspace('osint') },
      { id: 'ws-infra', label: 'Workspace: Infrastructure', group: 'Workspace', action: () => setWorkspace('infrastructure') },
      { id: 'ws-geo', label: 'Workspace: Geosint', group: 'Workspace', action: () => setWorkspace('geosint') },
      { id: 'ws-for', label: 'Workspace: Forensics', group: 'Workspace', action: () => setWorkspace('forensics') },
      { id: 'undo', label: 'Undo', group: 'History', action: () => undo() },
      { id: 'redo', label: 'Redo', group: 'History', action: () => redo() },
      {
        id: 'export-json',
        label: 'Export Graph (JSON)',
        group: 'Export',
        action: () => {
          const data = exportGraph('json');
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'argus-graph.json';
          a.click();
        },
      },
      {
        id: 'export-csv',
        label: 'Export Graph (CSV)',
        group: 'Export',
        action: () => {
          const data = exportGraph('csv');
          const blob = new Blob([data], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'argus-graph.csv';
          a.click();
        },
      },
      {
        id: 'expand',
        label: 'Expand selected node',
        group: 'Graph',
        action: () => {
          if (selectedEntityId) expandNode(selectedEntityId);
        },
      },
    ];

    cases.forEach((c) => {
      list.push({
        id: `case-${c.id}`,
        label: c.name,
        group: 'Cases',
        action: () => setActiveCase(c.id),
      });
    });

    entities.slice(0, 30).forEach((e) => {
      list.push({
        id: `ent-${e.id}`,
        label: `${e.type}: ${e.label}`,
        group: 'Entities',
        action: () => setSelectedEntity(e.id),
      });
    });

    return list;
  }, [cases, entities, selectedEntityId, togglePanel, setWorkspace, undo, redo, exportGraph, expandNode, setActiveCase, setSelectedEntity]);

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  if (!commandPaletteOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxHeight: 420,
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or search… (Ctrl+K)"
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #1e293b',
            color: '#e2e8f0',
            fontSize: 15,
            outline: 'none',
          }}
        />
        <div style={{ overflowY: 'auto', maxHeight: 360 }}>
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                c.action();
                setCommandPaletteOpen(false);
                setQuery('');
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>{c.label}</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>{c.group}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 16, color: '#64748b', fontSize: 13 }}>No results</div>
          )}
        </div>
      </div>
    </div>
  );
}
