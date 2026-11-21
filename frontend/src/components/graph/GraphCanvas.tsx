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
  type Viewport,
  BackgroundVariant,
  MarkerType,
  SelectionMode,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EntityNode from './EntityNode';
import { useStore } from '../../store/useStore';
import { RELATIONSHIP_LABELS, ENTITY_COLORS, type EntityType } from '../../types';
import { useDeviceProfile } from '../../hooks/useDeviceProfile';
import { canvasEngine } from '../../canvas/engine';
import type { CanvasTool } from '../../canvas/engine';
import { useTemporalFilter } from '../../store/temporalFilterStore';
import { filterGraphByTemporalRange } from '../../services/intelligence/timelineService';
import { rollupEvidenceByEntity } from '../../services/intelligence/evidenceService';

function normalizeHandleId(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw) return undefined;
  const m = raw.match(/^(?:s|t|source|target)-?(top|right|bottom|left)$/i) || raw.match(/^(top|right|bottom|left)$/i);
  if (!m) return raw;
  return (m[1] || m[0]).toLowerCase();
}

const nodeTypes = { entity: EntityNode } as const;
const VALID_EDGE_TYPES = new Set(['default', 'straight', 'step', 'smoothstep', 'bezier', 'simplebezier']);

export default function GraphCanvas() {
  const device = useDeviceProfile();
  const temporalEnabled = useTemporalFilter((s) => s.enabled);
  const temporalFrom = useTemporalFilter((s) => s.from);
  const temporalTo = useTemporalFilter((s) => s.to);
  const keepUndated = useTemporalFilter((s) => s.keepUndated);

  const activeCaseId = useStore((s) => s.activeCaseId);
  const selectedEntityId = useStore((s) => s.selectedEntityId);
  const selectedRelationshipId = useStore((s) => s.selectedRelationshipId);
  const setSelectedEntity = useStore((s) => s.setSelectedEntity);
  const setSelectedEntities = useStore((s) => s.setSelectedEntities);
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
  const removeEntity = useStore((s) => s.removeEntity);
  const removeRelationship = useStore((s) => s.removeRelationship);
  const canvasTool = useStore((s) => s.canvasTool);
  const allEntities = useStore((s) => s.entities);
  const allRelationships = useStore((s) => s.relationships);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const didFitRef = useRef(false);

  const caseEntities = useMemo(
    () => (activeCaseId ? allEntities.filter((e) => e.caseId === activeCaseId) : []),
    [allEntities, activeCaseId]
  );
  const caseRelationships = useMemo(
    () => (activeCaseId ? allRelationships.filter((r) => r.caseId === activeCaseId) : []),
    [allRelationships, activeCaseId]
  );

  const temporalSlice = useMemo(() => {
    if (!temporalEnabled || (!temporalFrom && !temporalTo)) {
      return { entities: caseEntities, relationships: caseRelationships, hiddenEntityIds: [] as string[] };
    }
    return filterGraphByTemporalRange(caseEntities, caseRelationships, temporalFrom || undefined, temporalTo || undefined, {
      keepUndated,
    });
  }, [caseEntities, caseRelationships, temporalEnabled, temporalFrom, temporalTo, keepUndated]);

  const entities = temporalSlice.entities;
  const relationships = temporalSlice.relationships;

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
  const temporalKey = `${temporalEnabled}|${temporalFrom}|${temporalTo}|${keepUndated}`;
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
    [pathKey, edgeType, graphSettings.edgeVariant, graphSettings.edgeThickness, graphSettings.showLabels, appearance.accentColor, appearance.edgeColor]
  );
  const structureKey = useMemo(() => {
    const rids = relationships
      .filter((r) => filteredIds.has(r.sourceId) && filteredIds.has(r.targetId))
      .map((r) => r.id)
      .sort()
      .join(',');
    return `${activeCaseId}|${filteredIdKey}|${rids}|${temporalKey}`;
  }, [activeCaseId, filteredIdKey, relationships, filteredIds, temporalKey]);

  useEffect(() => {
    if (!activeCaseId) {
      didFitRef.current = false;
      return;
    }
    if (didFitRef.current) return;
    if (!filteredIdKey) return;
    const timer = window.setTimeout(() => {
      fitView({ padding: 0.18, duration: 180, maxZoom: 1.15 });
      didFitRef.current = true;
    }, 100);
    return () => window.clearTimeout(timer);
  }, [activeCaseId, filteredIdKey, fitView]);

  useEffect(() => {
    canvasEngine.setCase(activeCaseId);
  }, [activeCaseId]);

  useEffect(() => {
    canvasEngine.setTool(canvasTool as CanvasTool);
  }, [canvasTool]);

  useEffect(() => {
    canvasEngine.select(selectedEntityId ? [selectedEntityId] : []);
  }, [selectedEntityId]);

  const evidenceRollup = useMemo(() => {
    try {
      return rollupEvidenceByEntity(activeCaseId || undefined);
    } catch {
      return new Map();
    }
  }, [activeCaseId, allEntities]);

  const makeNodes = useCallback((): Node[] => {
    return filteredEntities.map((e, i) => ({
      id: String(e.id),
      type: 'entity',
      position: {
        x: typeof e.position?.x === 'number' ? e.position.x : 120 + (i % 4) * 250,
        y: typeof e.position?.y === 'number' ? e.position.y : 100 + Math.floor(i / 4) * 150,
      },
      data: {
        label: e.label || e.id,
        entityType: e.type,
        subtitle:
          typeof e.properties?.description === 'string'
            ? e.properties.description
            : typeof e.properties?.platform === 'string'
              ? e.properties.platform
              : typeof e.properties?.value === 'string'
                ? e.properties.value
                : '',
        selected: e.id === selectedEntityId,
        highlighted: (highlightedPath || []).includes(e.id) || e.id === selectedEntityId,
        pinned: (pinnedNodeIds || []).includes(e.id),
        evidenceCount: evidenceRollup.get(e.id)?.count ?? 0,
        evidenceSupport: evidenceRollup.get(e.id)?.strongestSupport ?? 'none',
      },
      draggable: !(pinnedNodeIds || []).includes(e.id),
    }));
  }, [filteredEntities, selectedEntityId, highlightedPath, pinnedNodeIds, evidenceRollup]);

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
        const statusRaw = String(r.properties?.status || 'unknown').toLowerCase();
        const status =
          statusRaw === 'confirmed'
            ? 'confirmed'
            : statusRaw === 'assumed' || statusRaw === 'suspected'
              ? 'assumed'
              : 'unknown';
        const dashed =
          variant === 'dashed' || lineStyle === 'dashed' || status === 'assumed' || status === 'unknown';
        const animated = variant === 'animated' || lineStyle === 'animated' || inPath;
        const statusColor =
          status === 'confirmed' ? '#36856d' : status === 'assumed' ? '#c28a38' : stroke;
        const color = inPath ? accent : statusColor;
        return {
          id: String(r.id),
          className: `argus-edge argus-edge-${status}`,
          source: String(r.sourceId),
          target: String(r.targetId),
          sourceHandle: normalizeHandleId(r.properties?.sourceHandle),
          targetHandle: normalizeHandleId(r.properties?.targetHandle),
          label: graphSettings.showLabels ? RELATIONSHIP_LABELS[r.type] || r.type : undefined,
          type: edgeType === 'simplebezier' ? 'default' : edgeType,
          animated: device.reduceMotion ? false : animated,
          style: {
            stroke: color,
            strokeWidth: width,
            strokeDasharray: dashed ? '6 4' : undefined,
          },
          labelStyle: { fill: '#777B80', fontSize: 10, fontWeight: 500 },
          labelBgStyle: {
            fill:
              appearance.theme === 'dark'
                ? '#151b22'
                : appearance.theme === 'amoled'
                  ? '#0a0a0a'
                  : '#ffffff',
            fillOpacity: 0.96,
          },
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
    appearance.theme,
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

  const neighborIds = useMemo(() => {
    if (!selectedEntityId || !graphSettings.focusMode) return null;
    const s = new Set<string>([selectedEntityId]);
    for (const r of relationships) {
      if (r.sourceId === selectedEntityId) s.add(r.targetId);
      if (r.targetId === selectedEntityId) s.add(r.sourceId);
    }
    return s;
  }, [selectedEntityId, relationships, graphSettings.focusMode]);

  const neighborKey = useMemo(
    () => (neighborIds ? [...neighborIds].sort().join(',') : ''),
    [neighborIds]
  );

  useEffect(() => {
    const key = `${selectedEntityId}|${pathKey}|${pinKey}|${neighborKey}`;
    if (prevSelection.current === key) return;
    prevSelection.current = key;
    const path = highlightedPath || [];
    const pins = pinnedNodeIds || [];
    setNodes((nds) => {
      let changed = false;
      const next = nds.map((n) => {
        const selected = n.id === selectedEntityId;
        const highlighted = path.includes(n.id) || selected;
        const pinned = pins.includes(n.id);
        const dimmed = neighborIds ? !neighborIds.has(n.id) : false;
        const data = n.data as Record<string, unknown>;
        if (
          data.selected === selected &&
          data.highlighted === highlighted &&
          data.pinned === pinned &&
          data.dimmed === dimmed &&
          n.draggable === !pinned
        ) {
          return n;
        }
        changed = true;
        return {
          ...n,
          selected,
          draggable: !pinned,
          data: { ...data, selected, highlighted, pinned, dimmed },
        };
      });
      return changed ? next : nds;
    });
    setEdges((eds) => {
      if (!neighborIds && !path.length) {
        return eds.map((e) =>
          e.style && (e.style as { opacity?: number }).opacity != null
            ? { ...e, style: { ...e.style, opacity: undefined } }
            : e
        );
      }
      return eds.map((e) => {
        const onPath = path.includes(e.source) && path.includes(e.target);
        const onFocus = !neighborIds || (neighborIds.has(e.source) && neighborIds.has(e.target));
        const opacity = onFocus ? 1 : 0.08;
        const prev = (e.style as { opacity?: number } | undefined)?.opacity;
        if (prev === opacity && !onPath) return e;
        return {
          ...e,
          style: { ...e.style, opacity },
          animated: onPath && !device.reduceMotion ? true : e.animated,
        };
      });
    });
  }, [
    selectedEntityId,
    pathKey,
    pinKey,
    neighborKey,
    neighborIds,
    highlightedPath,
    pinnedNodeIds,
    setNodes,
    setEdges,
    device.reduceMotion,
  ]);

  const posTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const flushPositions = useCallback(() => {
    const pending = pendingPosRef.current;
    if (pending.size === 0) return;
    pending.forEach((pos, id) => {
      updateEntityPosition(id, pos);
      canvasEngine.upsertEntityObject(id, pos.x, pos.y);
    });
    pending.clear();
  }, [updateEntityPosition]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeBase(changes);
      let moved = false;
      for (const ch of changes) {
        if (ch.type === 'position' && 'position' in ch && ch.position && ch.id) {
          pendingPosRef.current.set(ch.id, ch.position);
          canvasEngine.upsertEntityObject(ch.id, ch.position.x, ch.position.y);
          moved = true;
          if (ch.dragging === false) {
            if (posTimerRef.current) {
              clearTimeout(posTimerRef.current);
              posTimerRef.current = null;
            }
            updateEntityPosition(ch.id, ch.position);
            pendingPosRef.current.delete(ch.id);
            pushHistory(`Move ${ch.id}`);
          }
        }
      }
      if (moved && posTimerRef.current == null) {
        posTimerRef.current = setTimeout(() => {
          posTimerRef.current = null;
          flushPositions();
        }, device.positionFlushMs || 80);
      }
    },
    [onNodesChangeBase, updateEntityPosition, pushHistory, flushPositions, device.positionFlushMs]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      setSelectedEntity(null);
      setSelectedEntities([]);
      for (const n of deleted) {
        if ((pinnedNodeIds || []).includes(n.id)) continue;
        canvasEngine.removeByEntityId(n.id);
        removeEntity(n.id);
      }
    },
    [removeEntity, pinnedNodeIds, setSelectedEntity, setSelectedEntities]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      for (const e of deleted) removeRelationship(e.id);
      setSelectedRelationship(null);
    },
    [removeRelationship, setSelectedRelationship]
  );

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (ev.target as HTMLElement)?.isContentEditable) return;
      if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
      if (selectedEntityId) {
        if ((pinnedNodeIds || []).includes(selectedEntityId)) return;
        ev.preventDefault();
        const id = selectedEntityId;
        setSelectedEntity(null);
        setSelectedEntities([]);
        setSelectedRelationship(null);
        canvasEngine.removeByEntityId(id);
        queueMicrotask(() => removeEntity(id));
        return;
      }
      if (selectedRelationshipId) {
        ev.preventDefault();
        setSelectedRelationship(null);
        removeRelationship(selectedRelationshipId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    selectedEntityId,
    selectedRelationshipId,
    pinnedNodeIds,
    removeEntity,
    removeRelationship,
    setSelectedEntity,
    setSelectedEntities,
    setSelectedRelationship,
  ]);

  const onViewportChange = useCallback((vp: Viewport) => {
    canvasEngine.setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom });
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !activeCaseId) return;
      if (params.source === params.target) return;
      const id = `rel-${Date.now()}`;
      const sh = normalizeHandleId(params.sourceHandle) || params.sourceHandle || 'right';
      const th = normalizeHandleId(params.targetHandle) || params.targetHandle || 'left';
      addRelationship({
        id,
        type: 'related_to',
        sourceId: params.source,
        targetId: params.target,
        caseId: activeCaseId,
        properties: {
          sourceHandle: sh,
          targetHandle: th,
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
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      );
    },
    [activeCaseId, addRelationship, setEdges, edgeType]
  );

  const onSelectionChange = useCallback(
    ({ nodes: ns }: { nodes: Node[] }) => {
      if (ns.length === 1) {
        setSelectedEntity(ns[0].id);
        setSelectedEntities([ns[0].id]);
      } else if (ns.length > 1) {
        setSelectedEntity(ns[0].id);
        setSelectedEntities(ns.map((n) => n.id));
      }
    },
    [setSelectedEntity, setSelectedEntities]
  );

  const onlyRenderVisible = device.onlyRenderVisible || filteredEntities.length > 20;

  return (
    <div className="graph-surface" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onSelectionChange={onSelectionChange}
        onViewportChange={onViewportChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={2.5}
        connectionMode={ConnectionMode.Loose}
        selectionMode={SelectionMode.Partial}
        onlyRenderVisibleElements={onlyRenderVisible}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
        <Controls showInteractive={false} />
        {device.showMinimap && (
          <MiniMap
            pannable
            zoomable
            style={{ width: 120, height: 80 }}
            maskColor={
              appearance.theme === 'light' ? 'rgba(247,247,245,0.7)' : 'rgba(15,23,42,0.8)'
            }
          />
        )}
      </ReactFlow>
    </div>
  );
}
