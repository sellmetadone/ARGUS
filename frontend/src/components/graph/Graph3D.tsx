import { useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { ENTITY_COLORS, type EntityType } from '../../types';

/** Lightweight canvas 3D projection of the investigation graph (no Three.js dependency). */
export default function Graph3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    activeCaseId,
    getEntitiesForCase,
    getRelationshipsForCase,
    selectedEntityId,
    setSelectedEntity,
    appearance,
    typeFilters,
    graphSearchQuery,
    highlightedPath,
  } = useStore();

  const entities = activeCaseId ? getEntitiesForCase(activeCaseId) : [];
  const relationships = activeCaseId ? getRelationshipsForCase(activeCaseId) : [];

  const nodes = useMemo(() => {
    const filters = Array.isArray(typeFilters) ? typeFilters : [];
    return entities
      .filter((e) => !filters.length || filters.includes(e.type))
      .filter((e) => {
        if (!graphSearchQuery) return true;
        const q = graphSearchQuery.toLowerCase();
        return e.label.toLowerCase().includes(q) || e.type.includes(q);
      })
      .map((e, i) => {
        const angle = (i / Math.max(entities.length, 1)) * Math.PI * 2;
        const r = 120 + (i % 5) * 30;
        return {
          id: e.id,
          label: e.label,
          type: e.type,
          x: Math.cos(angle) * r,
          y: (i % 3) * 40 - 40,
          z: Math.sin(angle) * r,
        };
      });
  }, [entities, typeFilters, graphSearchQuery]);

  const rot = useRef({ x: 0.4, y: 0.6 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);

    const project = (x: number, y: number, z: number) => {
      const cosY = Math.cos(rot.current.y);
      const sinY = Math.sin(rot.current.y);
      const cosX = Math.cos(rot.current.x);
      const sinX = Math.sin(rot.current.x);
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      let y1 = y * cosX - z1 * sinX;
      z1 = y * sinX + z1 * cosX;
      const scale = 400 / (400 + z1);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      return { x: cx + x1 * scale * devicePixelRatio * 1.2, y: cy + y1 * scale * devicePixelRatio * 1.2, s: scale, z: z1 };
    };

    const draw = () => {
      rot.current.y += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bg = appearance.graphBg || (appearance.theme === 'amoled' ? '#000' : appearance.theme === 'light' ? '#f1f5f9' : '#020617');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const projected = nodes.map((n) => ({ ...n, p: project(n.x, n.y, n.z) }));
      projected.sort((a, b) => a.p.z - b.p.z);

      const byId = Object.fromEntries(projected.map((n) => [n.id, n]));
      relationships.forEach((r) => {
        const a = byId[r.sourceId];
        const b = byId[r.targetId];
        if (!a || !b) return;
        const inPath = highlightedPath.includes(r.sourceId) && highlightedPath.includes(r.targetId);
        ctx.beginPath();
        ctx.moveTo(a.p.x, a.p.y);
        ctx.lineTo(b.p.x, b.p.y);
        ctx.strokeStyle = inPath ? appearance.accentColor : '#475569';
        ctx.lineWidth = inPath ? 2 : 1;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      projected.forEach((n) => {
        const color = appearance.entityColors?.[n.type] || ENTITY_COLORS[n.type as EntityType] || '#64748b';
        const selected = n.id === selectedEntityId || highlightedPath.includes(n.id);
        const radius = 6 + n.p.s * 8;
        ctx.beginPath();
        ctx.arc(n.p.x, n.p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = selected ? 1 : 0.85;
        ctx.fill();
        if (selected) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = appearance.theme === 'light' ? '#0f172a' : '#e2e8f0';
        ctx.font = `${10 + n.p.s * 4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.label.slice(0, 22), n.p.x, n.p.y + radius + 12);
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onDown = (e: MouseEvent) => {
      drag.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      rot.current.y += (e.clientX - drag.current.x) * 0.01;
      rot.current.x += (e.clientY - drag.current.y) * 0.01;
      drag.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      drag.current = null;
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * devicePixelRatio;
      const my = (e.clientY - rect.top) * devicePixelRatio;
      let best: string | null = null;
      let bestD = 30;
      nodes.forEach((n) => {
        const p = project(n.x, n.y, n.z);
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < bestD) {
          bestD = d;
          best = n.id;
        }
      });
      if (best) setSelectedEntity(best);
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('click', onClick);
    };
  }, [nodes, relationships, selectedEntityId, appearance, highlightedPath, setSelectedEntity]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          fontSize: 11,
          color: '#64748b',
          background: '#0f172acc',
          padding: '6px 10px',
          borderRadius: 6,
        }}
      >
        3D · drag to rotate · click node to select
      </div>
    </div>
  );
}
