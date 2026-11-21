import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, X, Crosshair, Maximize2, Link2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useT } from '../../i18n/useT';

type GeoPoint = { id: string; label: string; lat: number; lng: number; type?: string };

function parseCoord(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function extractPoint(
  id: string,
  label: string,
  props: Record<string, unknown> | undefined,
  type?: string
): GeoPoint | null {
  if (!props) return null;
  let lat = parseCoord(props.lat ?? props.latitude ?? props.Lat ?? props.LAT);
  let lng = parseCoord(props.lng ?? props.lon ?? props.longitude ?? props.Lng ?? props.LON);

  if (lat == null || lng == null) {
    const raw = props.coordinates ?? props.geo ?? props.location ?? props.coords;
    if (typeof raw === 'string' && raw.includes(',')) {
      const [a, b] = raw.split(',').map((s) => s.trim());
      const n1 = parseCoord(a);
      const n2 = parseCoord(b);
      if (n1 != null && n2 != null) {
        // Prefer lat,lng if first looks like latitude
        if (Math.abs(n1) <= 90 && Math.abs(n2) <= 180) {
          lat = n1;
          lng = n2;
        } else if (Math.abs(n2) <= 90 && Math.abs(n1) <= 180) {
          lat = n2;
          lng = n1;
        }
      }
    } else if (Array.isArray(raw) && raw.length >= 2) {
      const n1 = parseCoord(raw[0]);
      const n2 = parseCoord(raw[1]);
      if (n1 != null && n2 != null) {
        if (Math.abs(n1) <= 90 && Math.abs(n2) <= 180) {
          lat = n1;
          lng = n2;
        } else {
          lat = n2;
          lng = n1;
        }
      }
    }
  }

  if (lat == null || lng == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { id, label, lat, lng, type };
}

function makeIcon(selected: boolean, color = '#3b82f6') {
  const size = selected ? 18 : 12;
  const border = selected ? 3 : 2;
  return L.divIcon({
    className: 'argus-map-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border}px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function MapPanel() {
  const t = useT();
  const {
    entities,
    relationships,
    selectedEntityId,
    activeCaseId,
    setSelectedEntity,
    setPanel,
    setHighlightedPath,
  } = useStore();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const points = useMemo(() => {
    const list: GeoPoint[] = [];
    for (const e of entities) {
      if (activeCaseId && e.caseId && e.caseId !== activeCaseId) continue;
      const p = extractPoint(e.id, e.label || e.id, e.properties as Record<string, unknown>, e.type);
      if (p) list.push(p);
    }
    return list;
  }, [entities, activeCaseId]);

  const onMarkerClick = useCallback(
    (id: string) => {
      setSelectedEntity(id);
      setPanel('inspector');
      setFocusId(id);
      // Highlight connected path
      const pathIds = new Set<string>([id]);
      for (const r of relationships) {
        if (r.source === id || r.target === id) {
          pathIds.add(r.source);
          pathIds.add(r.target);
        }
      }
      setHighlightedPath(Array.from(pathIds));
    },
    [setSelectedEntity, setPanel, setHighlightedPath, relationships, activeCaseId]
  );

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    const group = L.layerGroup().addTo(map);
    mapInst.current = map;
    layerRef.current = group;
    // Fix tile size after panel open
    requestAnimationFrame(() => map.invalidateSize());
    return () => {
      map.remove();
      mapInst.current = null;
      layerRef.current = null;
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapInst.current;
    const group = layerRef.current;
    if (!map || !group) return;
    group.clearLayers();
    for (const p of points) {
      const selected = p.id === selectedEntityId || p.id === focusId;
      const marker = L.marker([p.lat, p.lng], {
        icon: makeIcon(selected),
        title: p.label,
      });
      marker.on('click', () => onMarkerClick(p.id));
      marker.bindTooltip(p.label, { direction: 'top', offset: [0, -8] });
      group.addLayer(marker);
    }
  }, [points, selectedEntityId, focusId, onMarkerClick]);

  const fitAll = useCallback(() => {
    const map = mapInst.current;
    if (!map || points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.15), { animate: true, maxZoom: 12 });
  }, [points]);

  // Focus selected
  useEffect(() => {
    if (!selectedEntityId && !focusId) return;
    const id = focusId || selectedEntityId;
    const p = points.find((x) => x.id === id);
    if (!p || !mapInst.current) return;
    const map = mapInst.current;
    map.setView([p.lat, p.lng], Math.max(map.getZoom(), 11), { animate: true });
  }, [points, focusId, selectedEntityId]);

  // Fit on first points load
  useEffect(() => {
    if (points.length === 0) return;
    const t = window.setTimeout(() => fitAll(), 120);
    return () => window.clearTimeout(t);
  }, [points.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="map-panel flex flex-col h-full bg-[var(--bg-panel)] border-l border-[var(--border)]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0">
        <MapIcon size={16} className="text-[var(--accent)]" />
        <span className="text-sm font-medium flex-1">{t('map_title') || 'Map'}</span>
        <button
          type="button"
          className="p-1 rounded hover:bg-[var(--bg-hover)]"
          title="Fit all"
          onClick={fitAll}
        >
          <Maximize2 size={14} />
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-[var(--bg-hover)]"
          title="Close"
          onClick={() => setPanel(null)}
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 relative min-h-0">
        <div ref={mapRef} className="absolute inset-0 z-0" />
        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--text-muted)] pointer-events-none z-10">
            {t('map_no_geo') || 'No geo points on entities'}
          </div>
        )}
      </div>
      {points.length > 0 && (
        <div className="max-h-36 overflow-auto border-t border-[var(--border)] text-xs">
          {points.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`w-full text-left px-3 py-1.5 hover:bg-[var(--bg-hover)] flex items-center gap-2 ${
                p.id === selectedEntityId ? 'bg-[var(--bg-hover)]' : ''
              }`}
              onClick={() => onMarkerClick(p.id)}
            >
              <Crosshair size={12} className="shrink-0 opacity-60" />
              <span className="truncate flex-1">{p.label}</span>
              <span className="opacity-50 font-mono">{p.lat.toFixed(2)},{p.lng.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
