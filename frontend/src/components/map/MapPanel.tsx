import { useMemo, useState } from 'react';
import { Map as MapIcon, X, Crosshair } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useT } from '../../i18n/useT';

/** Geospatial panel — OSM embed + entity markers from lat/lng properties. No extra npm dependency. */
export default function MapPanel() {
  const t = useT();
  const { activeCaseId, getEntitiesForCase, setSelectedEntity, setPanel, appearance } = useStore();
  const entities = activeCaseId ? getEntitiesForCase(activeCaseId) : [];
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const points = useMemo(() => {
    const out: { id: string; label: string; lat: number; lng: number }[] = [];
    for (const e of entities) {
      const lat = Number(e.properties?.lat ?? e.properties?.latitude);
      const lng = Number(e.properties?.lng ?? e.properties?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        out.push({ id: e.id, label: e.label, lat, lng });
      }
    }
    return out;
  }, [entities]);

  const center = focus || (points.length
    ? {
        lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
        lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
        zoom: points.length === 1 ? 10 : 4,
      }
    : { lat: 20, lng: 0, zoom: 2 });

  // OSM embed bbox around center
  const delta = 180 / Math.pow(2, center.zoom);
  const bbox = [
    center.lng - delta * 1.5,
    center.lat - delta,
    center.lng + delta * 1.5,
    center.lat + delta,
  ].join('%2C');
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat}%2C${center.lng}`;

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
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          <MapIcon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          {t('map_title')}
        </span>
        <button type="button" className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setPanel('map', false)}>
          <X size={14} />
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <iframe
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
            borderLeft: '1px solid var(--border)',
            overflowY: 'auto',
            padding: 12,
            fontSize: 12,
            background: appearance.theme === 'light' ? 'var(--panel)' : 'var(--panel)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
            {points.length === 0
              ? t('map_no_points')
              : `${points.length} ${t('map_points')}`}
          </div>
          {points.map((p) => (
            <button
              key={p.id}
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4, textAlign: 'left' }}
              onClick={() => {
                setSelectedEntity(p.id);
                setFocus({ lat: p.lat, lng: p.lng, zoom: 11 });
              }}
            >
              <Crosshair size={12} />
              <span>
                <div>{p.label}</div>
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
            OpenStreetMap ↗
          </a>
        </div>
      </div>
    </div>
  );
}
