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
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
  type OnViewportChange,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EntityNode from './EntityNode';
import { useStore } from '../../store/useStore';
import { RELATIONSHIP_LABELS, ENTITY_COLORS, type EntityType } from '../../types';
import { useDeviceProfile } from '../../hooks/useDeviceProfile';
import { canvasEngine } from '../../canvas/engine';
import type { CanvasTool } from '../../canvas/engine';

const nodeTypes = { entity: EntityNode } as const;
const VALID_EDGE_TYPES = new Set(['default', 'straight', 'step', 'smoothstep', 'bezier', 'simplebezier']);

export default function GraphCanvas() {
  const device = useDeviceProfile();
  const activeCaseId = useStore((s) => s.activeCaseId);
  const selectedEntityId = useStore((s) => s.selectedEntityId);
  const setSelectedEntity = useStore((s) => s.setSelectedEntity);
  const setSelectedRelationship = useStore((s) => s.setSelectedRelationship);
  const highlightedPath = useStore((s) => s.highlightedPath);
  const graphSearchQuery = useStore((s) => s.graphSearchQuery);
  const typeFilters = useStore((s) => s.typeFilters);
  const pinnedNodeIds = useStore((s) => s.pinnedNodeIds);
  const graphSettings = useStore((s) => s.graphSettings);
  const appearance = useStore((s) => s.appearance);
  const addRelationship = useStore((s) => s.addRelationship);
  const updateEntityPosition = useStore((s) => s.updateEntityPosition);
  const pushHistory = useStore((s) => s.pushHistory);
  const canvasTool = useStore((s) => s.canvasTool);
  const allEntities = useStore((s) => s.entities);
  const allRelationships = useStore((s) => s.relationships);
  const { screenToFlowPosition } = useReactFlow();

  const entities = useMemo(
    () => (activeCaseId ? allEntities.filter((e) => e.caseId === activeCaseId) : []),
    [allEntities, activeCaseId]
  );
  const relationships = useMemo(
    () => (activeCaseId ? allRelationships.filter((r) => r.caseId === activeCaseId) : []),
    [allRelationships, activeCaseId]
  );

  const filteredEntities = useMemo(() => {
    let list = entities;
    if (typeFilters?.length) list = list.filter((e) => typeFilters.includes(e.type));
    if (graphSearchQuery?.trim()) {
      const q = graphSearchQuery.toLowerCase();
      list = list.filter(
        (e) => (e.label || '').toLowerCase().includes(q) || (e.type || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entities, typeFilters, graphSearchQuery]);

  const filteredIdKey = useMemo(() => filteredEntities.map((e) => e.id).sort().join(','), [filteredEntities]);
  const filteredIds = useMemo(() => new Set(filteredIdKey ? filteredIdKey.split(',') : []), [filteredIdKey]);
  const edgeType = useMemo(() => {
    const t = graphSettings.edgeStyle || 'smoothstep';
    return VALID_EDGE_TYPES.has(t) ? t : 'smoothstep';
  }, [graphSettings.edgeStyle]);
  const pathKey = useMemo(() => (highlightedPath || []).join(','), [highlightedPath]);
  const pinKey = useMemo(() => (pinnedNodeIds || []).join(','), [pinnedNodeIds]);
  const styleKey = useMemo(
    () =>
      [
        pathKey,
        edgeType,
        graphSettings.edgeVariant,
        graphSettings.edgeThickness,
        graphSettings.showLabels ? '1' : '0',
        appearance.accentColor,
        appearance.edgeColor,
      ].join('|'),
    [
      pathKey,
      edgeType,
      graphSettings.edgeVariant,
      graphSettings.edgeThickness,
      graphSettings.showLabels,
      appearance.accentColor,
      appearance.edgeColor,
    ]
  );
  const structureKey = useMemo(() => {
    const rids = relationships
      .filter((r) => filteredIds.has(r.sourceId) && filteredIds.has(r.targetId))
      .map((r) => r.id)
      .sort()
      .join(',');
    return `${activeCaseId}|${filteredIdKey}|${rids}`;
  }, [activeCaseId, filteredIdKey, relationships, filteredIds]);

  /* ——— CanvasEngine bridge ——— */
  useEffect(() => {
    canvasEngine.setCase(activeCaseId);
  }, [activeCaseId]);

  useEffect(() => {
    canvasEngine.setTool(canvasTool as CanvasTool);
  }, [canvasTool]);

  useEffect(() => {
    canvasEngine.select(selectedEntityId ? [selectedEntityId] : []);
  }, [selectedEntityId]);

  const makeNodes = useCallback((): Node[] => {
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

  const makeEdges = useCallback((): Edge[] => {
    const accent = appearance.accentColor || '#526C8C';
    const stroke = appearance.edgeColor || '#94a3b8';
    const variant = graphSettings.edgeVariant || 'solid';
    const baseWidth = graphSettings.edgeThickness || 1.5;
    const path = highlightedPath || [];
    return relationships
      .filter((r) => filteredIds.has(r.sourceId) && filteredIds.has(r.targetId))
      .map((r) => {
        const inPath = path.includes(r.sourceId) && path.includes(r.targetId);
        const width = variant === 'thick' ? baseWidth + 2 : inPath ? baseWidth + 1 : baseWidth;
        const lineStyle = String(r.properties?.lineStyle || '');
        const direction = String(r.properties?.direction || 'forward');
        const dashed = variant === 'dashed' || lineStyle === 'dashed';
        const animated = variant === 'animated' || lineStyle === 'animated' || inPath;
        const color = inPath ? accent : stroke;
        return {
          id: String(r.id),
          source: String(r.sourceId),
          target: String(r.targetId),
          label: graphSettings.showLabels ? RELATIONSHIP_LABELS[r.type] || r.type : undefined,
          type: edgeType === 'simplebezier' ? 'default' : edgeType,
          animated: device.reduceMotion ? false : animated,
          style: {
            stroke: color,
            strokeWidth: width,
            strokeDasharray: dashed ? '6 4' : undefined,
          },
          labelStyle: { fill: '#777B80', fontSize: 10, fontWeight: 500 },
          labelBgStyle: { fill: '#FCFCFB', fillOpacity: 0.9 },
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
          markerStart:
            direction === 'bidirectional'
              ? { type: MarkerType.ArrowClosed, color, width: 16, height: 16 }
              : undefined,
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
    device.reduceMotion,
  ]);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const prevStructure = useRef('');
  const prevStyle = useRef('');
  const prevSelection = useRef('');

  useEffect(() => {
    if (prevStructure.current === structureKey) return;
    prevStructure.current = structureKey;
    prevStyle.current = styleKey;
    prevSelection.current = `${selectedEntityId}|${pathKey}|${pinKey}`;
    const nextNodes = makeNodes();
    setNodes((current) => {
      const posMap = Object.fromEntries(current.map((n) => [n.id, n.position]));
      return nextNodes.map((n) => ({ ...n, position: posMap[n.id] || n.position }));
    });
    setEdges(makeEdges());
    // Mirror layout into CanvasEngine
    canvasEngine.syncEntities(
      nextNodes.map((n) => ({
        id: n.id,
        label: String((n.data as { label?: string }).label || n.id),
        x: n.position.x,
        y: n.position.y,
        locked: (pinnedNodeIds || []).includes(n.id),
      }))
    );
  }, [
    structureKey,
    styleKey,
    selectedEntityId,
    pathKey,
    pinKey,
    makeNodes,
    makeEdges,
    setNodes,
    setEdges,
    pinnedNodeIds,
  ]);

  useEffect(() => {
    if (prevStructure.current !== structureKey) return;
    if (prevStyle.current === styleKey) return;
    prevStyle.current = styleKey;
    setEdges(makeEdges());
  }, [styleKey, structureKey, makeEdges, setEdges]);

  useEffect(() => {
    const key = `${selectedEntityId}|${pathKey}|${pinKey}`;
    if (prevSelection.current === key) return;
    prevSelection.current = key;
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
  }, [selectedEntityId, pathKey, pinKey, highlightedPath, pinnedNodeIds, setNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeBase(changes);
      for (const ch of changes) {
        if (ch.type === 'position' && 'position' in ch && ch.position && ch.id) {
          if (ch.dragging === false) {
            pushHistory(`Move ${ch.id}`);
            updateEntityPosition(ch.id, ch.position);
            canvasEngine.upsertEntityObject(ch.id, ch.position.x, ch.position.y);
          } else if (ch.dragging === true) {
            // live mirror while dragging
            canvasEngine.upsertEntityObject(ch.id, ch.position.x, ch.position.y);
          }
        }
      }
    },
    [onNodesChangeBase, updateEntityPosition, pushHistory]
  );

  const onViewportChange: OnViewportChange = useCallback((vp) => {
    canvasEngine.setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom });
  }, []);

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
          direction: 'forward',
          status: 'unknown',
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
            animated: !device.reduceMotion && graphSettings.edgeVariant === 'animated',
            style: {
              stroke: appearance.edgeColor || '#94a3b8',
              strokeDasharray: graphSettings.edgeVariant === 'dashed' ? '6 4' : undefined,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: appearance.edgeColor || '#94a3b8',
              width: 16,
              height: 16,
            },
          },
          eds
        )
      );
    },
    [
      activeCaseId,
      addRelationship,
      setEdges,
      graphSettings.edgeVariant,
      appearance.edgeColor,
      edgeType,
      device.reduceMotion,
    ]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedEntity(node.id);
      canvasEngine.select([node.id]);
    },
    [setSelectedEntity]
  );
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => setSelectedRelationship(edge.id),
    [setSelectedRelationship]
  );
  const onPaneClick = useCallback(() => {
    setSelectedEntity(null);
    useStore.getState().setHighlightedPath([]);
    canvasEngine.select([]);
  }, [setSelectedEntity]);

  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const flow = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      window.dispatchEvent(
        new CustomEvent('argus:pane-dblclick', {
          detail: { flowX: flow.x, flowY: flow.y, screenX: event.clientX, screenY: event.clientY },
        })
      );
    },
    [screenToFlowPosition]
  );

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
        transition: device.reduceMotion ? undefined : 'opacity 0.2s ease',
      },
    }));
  }, [nodes, neighborIds, device.reduceMotion]);

  const displayEdges = useMemo(() => {
    if (!neighborIds) return edges;
    return edges.map((e) => {
      const on = neighborIds.has(e.source) && neighborIds.has(e.target);
      return {
        ...e,
        style: { ...e.style, opacity: on ? 1 : 0.08 },
        animated: on && !device.reduceMotion ? e.animated : false,
      };
    });
  }, [edges, neighborIds, device.reduceMotion]);

  const bgColor =
    appearance.graphBg ||
    (appearance.theme === 'amoled' ? '#000' : appearance.theme === 'light' ? '#FCFCFB' : '#0b0f14');
  const dotColor = appearance.graphDots || (appearance.theme === 'light' ? '#E7E8E5' : '#1e293b');
  const variant = graphSettings.backgroundVariant || 'dots';
  const panOnDrag = canvasTool === 'hand' ? true : ([1, 2] as number[]);
  const showMinimap = device.showMinimap;
  const engineSnap = canvasEngine.getState();

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
        onDoubleClick={onPaneDoubleClick}
        onViewportChange={onViewportChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: device.class === 'laptop' ? 0.15 : 0.2 }}
        minZoom={0.12}
        maxZoom={2.8}
        proOptions={{ hideAttribution: true }}
        connectionRadius={device.coarsePointer ? 40 : 28}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        panOnDrag={panOnDrag}
        selectionOnDrag={canvasTool === 'select'}
        nodesDraggable={canvasTool !== 'hand'}
        nodesConnectable={canvasTool === 'connect' || canvasTool === 'select'}
        snapToGrid={!!graphSettings.snapToGrid}
        snapGrid={[graphSettings.gridSize || 20, graphSettings.gridSize || 20]}
        onlyRenderVisibleElements={device.onlyRenderVisible}
        elevateNodesOnSelect
        zoomOnDoubleClick={false}
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
            gap={graphSettings.gridSize || 20}
            size={1}
            color={dotColor}
          />
        )}
        <Panel position="top-right">
          <button type="button" className="btn btn-secondary" style={{ fontSize: 11 }} title="CanvasEngine mirror">
            {device.class} · {canvasTool} · n={engineSnap.entityCount}
          </button>
        </Panel>
        <Controls showInteractive={!device.coarsePointer} />
        {showMinimap && (
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => {
              const t = (n.data as { entityType?: string })?.entityType as EntityType | undefined;
              if (!t) return '#94a3b8';
              return appearance.entityColors?.[t] || ENTITY_COLORS[t] || '#94a3b8';
            }}
            maskColor={
              appearance.theme === 'light' ? 'rgba(247,247,245,0.7)' : 'rgba(15,23,42,0.8)'
            }
          />
        )}
      </ReactFlow>
    </div>
  );
}
