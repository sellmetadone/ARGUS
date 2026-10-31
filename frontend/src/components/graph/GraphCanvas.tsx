import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EntityNode from './EntityNode';
import { useStore } from '../../store/useStore';
import { RELATIONSHIP_LABELS, ENTITY_COLORS, type EntityType } from '../../types';

/** Stable reference — must not be recreated each render (React Flow requirement) */
const nodeTypes = { entity: EntityNode } as const;

const VALID_EDGE_TYPES = new Set(['default', 'straight', 'step', 'smoothstep', 'bezier', 'simplebezier']);

export default function GraphCanvas() {
  const {
    activeCaseId,
    getEntitiesForCase,
    getRelationshipsForCase,
    selectedEntityId,
    setSelectedEntity,
    setSelectedRelationship,
    highlightedPath,
    graphSearchQuery,
    typeFilters,
    pinnedNodeIds,
    graphSettings,
    appearance,
    addRelationship,
    updateEntityPosition,
    pushHistory,
  } = useStore();

  const entities = activeCaseId ? getEntitiesForCase(activeCaseId) : [];
  const relationships = activeCaseId ? getRelationshipsForCase(activeCaseId) : [];

  const filteredEntities = useMemo(() => {
    let list = entities;
    if (typeFilters?.length) list = list.filter((e) => typeFilters.includes(e.type));
    if (graphSearchQuery?.trim()) {
      const q = graphSearchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          (e.label || '').toLowerCase().includes(q) || (e.type || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entities, typeFilters, graphSearchQuery]);

  const filteredIds = useMemo(() => new Set(filteredEntities.map((e) => e.id)), [filteredEntities]);

  const buildNodes = useCallback((): Node[] => {
    return filteredEntities.map((e, i) => ({
      id: String(e.id),
      type: 'entity',
      position: {
        x: typeof e.position?.x === 'number' ? e.position.x : 120 + (i % 5) * 160,
        y: typeof e.position?.y === 'number' ? e.position.y : 120 + Math.floor(i / 5) * 100,
      },
      data: {
        label: e.label || e.id,
        entityType: e.type,
        selected: e.id === selectedEntityId,
        highlighted: (highlightedPath || []).includes(e.id) || e.id === selectedEntityId,
        pinned: (pinnedNodeIds || []).includes(e.id),
      },
      draggable: !(pinnedNodeIds || []).includes(e.id),
    }));
  }, [filteredEntities, selectedEntityId, highlightedPath, pinnedNodeIds]);

  const edgeType = useMemo(() => {
    const t = graphSettings.edgeStyle || 'smoothstep';
    return VALID_EDGE_TYPES.has(t) ? t : 'smoothstep';
  }, [graphSettings.edgeStyle]);

  const buildEdges = useCallback((): Edge[] => {
    const accent = appearance.accentColor || '#8b5cf6';
    const stroke = appearance.edgeColor || '#64748b';
    const variant = graphSettings.edgeVariant || 'solid';
    const baseWidth = graphSettings.edgeThickness || 1.5;
    const path = highlightedPath || [];

    return relationships
      .filter((r) => filteredIds.has(r.sourceId) && filteredIds.has(r.targetId))
      .map((r) => {
        const inPath = path.includes(r.sourceId) && path.includes(r.targetId);
        const width = variant === 'thick' ? baseWidth + 2 : inPath ? baseWidth + 1 : baseWidth;
        return {
          id: String(r.id),
          source: String(r.sourceId),
          target: String(r.targetId),
          label: graphSettings.showLabels ? RELATIONSHIP_LABELS[r.type] || r.type : undefined,
          type: edgeType === 'simplebezier' ? 'default' : edgeType,
          animated: variant === 'animated' || inPath,
          style: {
            stroke: inPath ? accent : stroke,
            strokeWidth: width,
            strokeDasharray: variant === 'dashed' ? '6 4' : undefined,
          },
          labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: inPath ? accent : stroke,
            width: 16,
            height: 16,
          },
        } as Edge;
      });
  }, [
    relationships,
    filteredIds,
    highlightedPath,
    graphSettings.edgeVariant,
    graphSettings.edgeThickness,
    graphSettings.showLabels,
    appearance.accentColor,
    appearance.edgeColor,
    edgeType,
  ]);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const structureKey = useMemo(() => {
    const eids = filteredEntities.map((e) => e.id).sort().join(',');
    const rids = relationships
      .filter((r) => filteredIds.has(r.sourceId) && filteredIds.has(r.targetId))
      .map((r) => r.id)
      .sort()
      .join(',');
    return `${activeCaseId}|${eids}|${rids}|${(typeFilters || []).join(',')}|${graphSearchQuery || ''}`;
  }, [activeCaseId, filteredEntities, relationships, filteredIds, typeFilters, graphSearchQuery]);

  const prevStructure = useRef('');
  useEffect(() => {
    if (prevStructure.current === structureKey) return;
    prevStructure.current = structureKey;
    setNodes((current) => {
      const posMap = Object.fromEntries(current.map((n) => [n.id, n.position]));
      return buildNodes().map((n) => ({
        ...n,
        position: posMap[n.id] || n.position,
      }));
    });
    setEdges(buildEdges());
  }, [structureKey, buildNodes, buildEdges, setNodes, setEdges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          selected: n.id === selectedEntityId,
          highlighted: (highlightedPath || []).includes(n.id) || n.id === selectedEntityId,
          pinned: (pinnedNodeIds || []).includes(n.id),
        },
        draggable: !(pinnedNodeIds || []).includes(n.id),
      }))
    );
  }, [selectedEntityId, highlightedPath, pinnedNodeIds, setNodes]);

  useEffect(() => {
    setEdges(buildEdges());
  }, [
    highlightedPath,
    graphSettings.edgeStyle,
    graphSettings.edgeVariant,
    graphSettings.edgeThickness,
    graphSettings.showLabels,
    appearance.edgeColor,
    appearance.accentColor,
    buildEdges,
    setEdges,
  ]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeBase(changes);
      for (const ch of changes) {
        if (ch.type === 'position' && 'position' in ch && ch.position && ch.id && ch.dragging === false) {
          pushHistory(`Move ${ch.id}`);
          updateEntityPosition(ch.id, ch.position);
        }
      }
    },
    [onNodesChangeBase, updateEntityPosition, pushHistory]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !activeCaseId) return;
      const id = `rel-${Date.now()}`;
      addRelationship({
        id,
        type: 'related_to',
        sourceId: params.source,
        targetId: params.target,
        caseId: activeCaseId,
        properties: {
          sourceHandle: params.sourceHandle || '',
          targetHandle: params.targetHandle || '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'Manual link',
        confidence: 100,
      });
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id,
            type: edgeType === 'simplebezier' ? 'default' : edgeType,
            animated: graphSettings.edgeVariant === 'animated',
            style: {
              stroke: appearance.edgeColor || '#64748b',
              strokeDasharray: graphSettings.edgeVariant === 'dashed' ? '6 4' : undefined,
            },
          },
          eds
        )
      );
    },
    [activeCaseId, addRelationship, setEdges, graphSettings, appearance.edgeColor, edgeType]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => setSelectedEntity(node.id),
    [setSelectedEntity]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => setSelectedRelationship(edge.id),
    [setSelectedRelationship]
  );

  const onPaneClick = useCallback(() => {
    setSelectedEntity(null);
    useStore.getState().setHighlightedPath([]);
  }, [setSelectedEntity]);

  const neighborIds = useMemo(() => {
    if (!selectedEntityId || !graphSettings.focusMode) return null;
    const s = new Set<string>([selectedEntityId]);
    relationships.forEach((r) => {
      if (r.sourceId === selectedEntityId) s.add(r.targetId);
      if (r.targetId === selectedEntityId) s.add(r.sourceId);
    });
    return s;
  }, [selectedEntityId, relationships, graphSettings.focusMode]);

  const displayNodes = useMemo(() => {
    if (!neighborIds) return nodes;
    return nodes.map((n) => ({
      ...n,
      style: {
        ...n.style,
        opacity: neighborIds.has(n.id) ? 1 : 0.18,
        filter: neighborIds.has(n.id) ? undefined : 'grayscale(0.5)',
        transition: 'opacity 0.2s ease',
      },
    }));
  }, [nodes, neighborIds]);

  const displayEdges = useMemo(() => {
    if (!neighborIds) return edges;
    return edges.map((e) => {
      const on = neighborIds.has(e.source) && neighborIds.has(e.target);
      return {
        ...e,
        style: { ...e.style, opacity: on ? 1 : 0.08 },
        animated: on ? e.animated : false,
      };
    });
  }, [edges, neighborIds]);

  const applyLayoutPreset = useCallback(() => {
    const preset = graphSettings.layoutPreset || 'force';
    const list = filteredEntities;
    if (!list.length) return;
    const cx = 500;
    const cy = 350;
    setNodes((nds) =>
      nds.map((n, i) => {
        let x = n.position?.x ?? 100;
        let y = n.position?.y ?? 100;
        if (preset === 'grid') {
          const cols = Math.ceil(Math.sqrt(list.length));
          x = 80 + (i % cols) * 180;
          y = 80 + Math.floor(i / cols) * 120;
        } else if (preset === 'radial') {
          const focus = selectedEntityId || list[0]?.id;
          if (n.id === focus) {
            x = cx;
            y = cy;
          } else {
            const others = list.filter((e) => e.id !== focus);
            const idx = others.findIndex((e) => e.id === n.id);
            const angle = (2 * Math.PI * Math.max(idx, 0)) / Math.max(others.length, 1);
            x = cx + Math.cos(angle) * 280;
            y = cy + Math.sin(angle) * 220;
          }
        } else if (preset === 'hierarchy') {
          const rank: Record<string, number> = {
            domain: 0, subdomain: 1, ip: 2, asn: 3, person: 1, email: 2, phone: 2, company: 1,
          };
          const type = (n.data as { entityType?: string })?.entityType || 'note';
          const row = rank[type] ?? 4;
          const same = list.filter((e) => (rank[e.type] ?? 4) === row);
          const col = same.findIndex((e) => e.id === n.id);
          x = 100 + Math.max(col, 0) * 170;
          y = 80 + row * 140;
        } else {
          x = cx + (Math.random() - 0.5) * 420;
          y = cy + (Math.random() - 0.5) * 320;
        }
        updateEntityPosition(n.id, { x, y });
        return { ...n, position: { x, y } };
      })
    );
  }, [filteredEntities, graphSettings.layoutPreset, selectedEntityId, setNodes, updateEntityPosition]);

  const bgColor =
    appearance.graphBg ||
    (appearance.theme === 'amoled' ? '#000000' : appearance.theme === 'light' ? '#f1f5f9' : '#020617');
  const dotColor =
    appearance.graphDots || (appearance.theme === 'light' ? '#cbd5e1' : '#1e293b');
  const variant = graphSettings.backgroundVariant || 'dots';

  return (
    <div className="graph-surface" style={{ width: '100%', height: '100%', background: bgColor }}>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        connectionRadius={30}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        {variant !== 'none' && (
          <Background
            variant={
              variant === 'lines'
                ? BackgroundVariant.Lines
                : variant === 'cross'
                  ? BackgroundVariant.Cross
                  : BackgroundVariant.Dots
            }
            gap={20}
            size={1}
            color={dotColor}
          />
        )}
        <Panel position="top-right">
          <button
            type="button"
            onClick={applyLayoutPreset}
            style={{
              padding: '6px 10px',
              background: appearance.theme === 'light' ? '#fff' : '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#94a3b8',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Layout · {graphSettings.layoutPreset || 'force'}
          </button>
        </Panel>
        <Controls
          style={{
            background: appearance.theme === 'light' ? '#fff' : '#1e1e2e',
            border: '1px solid #334155',
            borderRadius: appearance.borderRadius,
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const t = (n.data as { entityType?: string })?.entityType as EntityType | undefined;
            if (!t) return '#64748b';
            return appearance.entityColors?.[t] || ENTITY_COLORS[t] || '#64748b';
          }}
          maskColor={appearance.theme === 'light' ? 'rgba(241,245,249,0.8)' : 'rgba(15, 23, 42, 0.8)'}
          style={{
            background: appearance.theme === 'light' ? '#e2e8f0' : '#0f172a',
            border: '1px solid #334155',
            borderRadius: appearance.borderRadius,
          }}
        />
      </ReactFlow>
    </div>
  );
}
