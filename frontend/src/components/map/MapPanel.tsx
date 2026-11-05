import { useMemo, useState, useCallback } from 'react';
import { Map as MapIcon, X, Crosshair, Maximize2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useT } from '../../i18n/useT';

type GeoPoint = { id: string; label: string; lat: number; lng: number };

function parseCoord(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Parse lat/lng from common property aliases and "lat,lng" strings. */
function extractPoint(
  id: string,
  label: string,
  props: Record<string, unknown> | undefined
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
  return { id, label, lat, lng };
}

/** Geospatial panel — OSM embed + entity list. No Leaflet dependency. */
export default function MapPanel() {
  const t = useT();
  const activeCaseId = useStore((s) => s.activeCaseId);
  const entities = useStore((s) => s.entities);
  const setSelectedEntity = useStore((s) => s.setSelectedEntity);
  const setPanel = useStore((s) => s.setPanel);

  const caseEntities = useMemo(
    () => (activeCaseId ? entities.filter((e) => e.caseId === activeCaseId) : []),
    [entities, activeCaseId]
  );

  const points = useMemo(() => {
    const out: GeoPoint[] = [];
    for (const e of caseEntities) {
      const p = extractPoint(e.id, e.label || e.id, e.properties as Record<string, unknown>);
      if (p) out.push(p);
    }
    return out;
  }, [caseEntities]);

  const [focusId, setFocusId] = useState<string | null>(null);

  const focusPoint = useMemo(
    () => (focusId ? points.find((p) => p.id === focusId) ?? null : null),
    [focusId, points]
  );

  const center = useMemo(() => {
    if (focusPoint) {
      return { lat: focusPoint.lat, lng: focusPoint.lng, zoom: 12 };
    }
    if (points.length === 0) return { lat: 20, lng: 0, zoom: 2 };
    if (points.length === 1) return { lat: points[0].lat, lng: points[0].lng, zoom: 10 };
    const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    const latSpan = Math.max(...points.map((p) => p.lat)) - Math.min(...points.map((p) => p.lat));
    const lngSpan = Math.max(...points.map((p) => p.lng)) - Math.min(...points.map((p) => p.lng));
    const span = Math.max(latSpan, lngSpan, 0.05);
    const zoom = Math.max(2, Math.min(12, Math.floor(8 - Math.log2(span))));
    return { lat, lng, zoom };
  }, [focusPoint, points]);

  const delta = 180 / Math.pow(2, Math.max(center.zoom, 1));
  const bbox = [
    (center.lng - delta * 1.5).toFixed(6),
    (center.lat - delta).toFixed(6),
    (center.lng + delta * 1.5).toFixed(6),
    (center.lat + delta).toFixed(6),
  ].join('%2C');

  const marker = focusPoint || (points.length === 1 ? points[0] : null);
  const embedSrc = marker
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker.lat}%2C${marker.lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  const selectPoint = useCallback(
    (p: GeoPoint) => {
      setFocusId(p.id);
      setSelectedEntity(p.id);
      setPanel('rightPanel', true);
    },
    [setSelectedEntity, setPanel]
  );

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
          flexShrink: 0,
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          <MapIcon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          {t('map_title')}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {points.length > 1 && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 11 }}
              title={t('map_fit_all')}
              onClick={() => setFocusId(null)}
            >
              <Maximize2 size={13} /> {t('map_fit_all')}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: 4 }}
            onClick={() => setPanel('map', false)}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <iframe
            key={embedSrc}
            title="OpenStreetMap"
            src={embedSrc}
            style={{ width: '100%', height: '100%', border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div
          style={{
            width: 260,
            maxWidth: '40%',
            borderLeft: '1px solid var(--border)',
            overflowY: 'auto',
            padding: 12,
            fontSize: 12,
            background: 'var(--panel)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
            {points.length === 0 ? t('map_no_points') : `${points.length} ${t('map_points')}`}
          </div>
          {points.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn ${focusId === p.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4, textAlign: 'left' }}
              onClick={() => selectPoint(p)}
            >
              <Crosshair size={12} style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.label}
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </div>
              </span>
            </button>
          ))}
          <a
            href={`https://www.openstreetmap.org/#map=${center.zoom}/${center.lat}/${center.lng}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'block', marginTop: 12, fontSize: 11, color: 'var(--accent)' }}
          >
            {t('map_open_osm')}
          </a>
        </div>
      </div>
    </div>
  );
}
