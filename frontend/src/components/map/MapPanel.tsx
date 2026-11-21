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
      lat = lat ?? parseCoord(a);
      lng = lng ?? parseCoord(b);
    }
  }

  if (lat == null || lng == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { id, label, lat, lng, type };
}

function makeIcon(active: boolean) {
  const color = active ? '#526C8C' : '#36856d';
  const size = active ? 16 : 12;
  return L.divIcon({
    className: 'argus-map-marker',
    html: `<span style="
      display:block;width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapPanel() {
  const t = useT();
  const activeCaseId = useStore((s) => s.activeCaseId);
  const entities = useStore((s) => s.entities);
  const setSelectedEntity = useStore((s) => s.setSelectedEntity);
  const setHighlightedPath = useStore((s) => s.setHighlightedPath);
  const selectedEntityId = useStore((s) => s.selectedEntityId);
  const relationships = useStore((s) => s.relationships);
  const setPanel = useStore((s) => s.setPanel);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const caseEntities = useMemo(
    () => (activeCaseId ? entities.filter((e) => e.caseId === activeCaseId) : []),
    [entities, activeCaseId]
  );

  const points = useMemo(() => {
    const out: GeoPoint[] = [];
    for (const e of caseEntities) {
      const p = extractPoint(e.id, e.label || e.id, e.properties as Record<string, unknown>, e.type);
      if (p) out.push(p);
    }
    return out;
  }, [caseEntities]);

  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedEntityId) return;
    if (points.some((p) => p.id === selectedEntityId)) setFocusId(selectedEntityId);
  }, [selectedEntityId, points]);

  const selectPoint = useCallback(
    (p: GeoPoint) => {
      setFocusId(p.id);
      setSelectedEntity(p.id);
      setPanel('rightPanel', true);
      const neighbors = new Set<string>([p.id]);
      for (const r of relationships) {
        if (r.caseId && activeCaseId && r.caseId !== activeCaseId) continue;
        if (r.sourceId === p.id) neighbors.add(r.targetId);
        if (r.targetId === p.id) neighbors.add(r.sourceId);
      }
      setHighlightedPath([...neighbors]);
    },
    [setSelectedEntity, setPanel, setHighlightedPath, relationships, activeCaseId]
  );

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
    requestAnimationFrame(() => map.invalidateSize());
    return () => {
      map.remove();
      mapInst.current = null;
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapInst.current;
    const group = layerRef.current;
    if (!map || !group) return;

    const keep = new Set(points.map((p) => p.id));
    markersRef.current.forEach((m, id) => {
      if (!keep.has(id)) {
        group.removeLayer(m);
        markersRef.current.delete(id);
      }
    });

    for (const p of points) {
      const active = p.id === focusId || p.id === selectedEntityId;
      let marker = markersRef.current.get(p.id);
      if (!marker) {
        marker = L.marker([p.lat, p.lng], { icon: makeIcon(active), title: p.label });
        marker.bindTooltip(p.label, { direction: 'top', offset: [0, -8] });
        marker.on('click', () => selectPoint(p));
        group.addLayer(marker);
        markersRef.current.set(p.id, marker);
      } else {
        marker.setLatLng([p.lat, p.lng]);
        marker.setIcon(makeIcon(active));
      }
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [points, focusId, selectedEntityId, selectPoint]);

  const fitAll = useCallback(() => {
    const map = mapInst.current;
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.18), { animate: true });
  }, [points]);

  const focusSelected = useCallback(() => {
    const map = mapInst.current;
    const p = points.find((x) => x.id === (focusId || selectedEntityId));
    if (!map || !p) return;
    map.setView([p.lat, p.lng], Math.max(map.getZoom(), 11), { animate: true });
  }, [points, focusId, selectedEntityId]);

  useEffect(() => {
    if (points.length === 0) return;
    const timer = window.setTimeout(() => fitAll(), 120);
    return () => window.clearTimeout(timer);
  }, [points.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--panel)',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
          <MapIcon size={16} />
          {t('map_title') || 'Map'}
          <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 12 }}>
            · {points.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-secondary" style={{ fontSize: 11 }} onClick={focusSelected} title={t('map_focus') || 'Focus'}>
            <Crosshair size={14} />
          </button>
          <button type="button" className="btn btn-secondary" style={{ fontSize: 11 }} onClick={fitAll} title={t('map_fit_all') || 'Fit all'}>
            <Maximize2 size={14} />
          </button>
          <button type="button" className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setPanel('map', false)}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div ref={mapRef} style={{ flex: 1, minHeight: 200 }} className="argus-leaflet-map" />
        <aside
          style={{
            width: 220,
            borderLeft: '1px solid var(--border)',
            overflow: 'auto',
            padding: 8,
            fontSize: 12,
          }}
        >
          {points.length === 0 && (
            <div style={{ color: 'var(--text-muted)', padding: 8 }}>
              {t('map_no_points') || 'No geolocated entities. Add lat/lng or coordinates to entity properties.'}
            </div>
          )}
          {points.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn ${p.id === focusId || p.id === selectedEntityId ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                textAlign: 'left',
                marginBottom: 4,
                fontSize: 11,
                padding: '6px 8px',
              }}
              onClick={() => {
                selectPoint(p);
                mapInst.current?.setView([p.lat, p.lng], 12, { animate: true });
              }}
            >
              <Link2 size={12} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
