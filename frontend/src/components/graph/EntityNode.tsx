import { memo, useMemo, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Globe2, Network, UserRound, Building2, Mail, Phone, MapPin, FileText,
  Link2, ShieldCheck, Database, Hash, Server, Cpu, Wallet, StickyNote,
  Fingerprint, Code2, RadioTower, MapPinned, AtSign, type LucideIcon,
} from 'lucide-react';
import { ENTITY_COLORS, type EntityType } from '../../types';
import { useStore } from '../../store/useStore';

export interface EntityNodeData {
  label: string;
  entityType: EntityType;
  subtitle?: string;
  selected?: boolean;
  highlighted?: boolean;
  pinned?: boolean;
  dimmed?: boolean;
  /** Linked evidence count (from rollup) */
  evidenceCount?: number;
  /** Strongest conclusion support among linked evidence */
  evidenceSupport?: 'none' | 'weak' | 'moderate' | 'strong';
  [key: string]: unknown;
}

const ICONS: Partial<Record<EntityType, LucideIcon>> = {
  ip: Network, ipv6: Network, domain: Globe2, subdomain: Globe2, asn: RadioTower,
  cidr: Network, nameserver: Server, mx: Mail, dns_record: Database,
  certificate: ShieldCheck, certificate_fingerprint: Fingerprint, url: Link2,
  website: Globe2, technology: Cpu, http_header: Code2, favicon_hash: Hash,
  hosting_provider: Server, coordinates: MapPinned, city: MapPin, country: MapPinned,
  geolocation: MapPin, address: MapPin, person: UserRound, organization: Building2,
  company: Building2, email: AtSign, phone: Phone, username: UserRound,
  social_account: UserRound, wallet: Wallet, hash: Hash, file: FileText,
  document: FileText, note: StickyNote, evidence: ShieldCheck,
};

const HANDLE_SIDES: { position: Position; id: string }[] = [
  { position: Position.Top, id: 'top' },
  { position: Position.Right, id: 'right' },
  { position: Position.Bottom, id: 'bottom' },
  { position: Position.Left, id: 'left' },
];

const SUPPORT_CLASS: Record<string, string> = {
  none: 'ev-none',
  weak: 'ev-weak',
  moderate: 'ev-moderate',
  strong: 'ev-strong',
};

const ConnectionHandles = memo(function ConnectionHandles({ color }: { color: string }) {
  const base = useMemo<CSSProperties>(
    () => ({
      width: 11,
      height: 11,
      border: '2px solid var(--panel, #fff)',
      borderRadius: 999,
      background: color,
      opacity: 0,
      transition: 'opacity .12s ease, transform .12s ease',
      zIndex: 5,
    }),
    [color]
  );
  return (
    <>
      {HANDLE_SIDES.map(({ position, id }) => (
        <Handle
          key={id}
          type="source"
          position={position}
          id={id}
          className="argus-node-handle argus-node-handle-source"
          style={base}
          isConnectable
        />
      ))}
    </>
  );
});

function EntityNodeInner({ data, selected }: NodeProps) {
  const nodeData = data as EntityNodeData;
  const entityColor = useStore((s) => s.appearance.entityColors?.[nodeData.entityType]);
  const nodeSize = useStore((s) => s.graphSettings.nodeSize);

  const color = entityColor || ENTITY_COLORS[nodeData.entityType] || '#64748b';
  const Icon = ICONS[nodeData.entityType] || Database;
  const scale = Math.max(0.85, Math.min(1.25, nodeSize || 1));
  const active = Boolean(selected || nodeData.selected || nodeData.highlighted);
  const dimmed = Boolean(nodeData.dimmed);
  const title = String(nodeData.label || 'Untitled entity');
  const typeLabel = String(nodeData.entityType || 'entity').replace(/_/g, ' ');
  const evCount = Number(nodeData.evidenceCount) || 0;
  const evSupport = nodeData.evidenceSupport || 'none';

  const style = useMemo(
    () =>
      ({
        '--entity-accent': color,
        minWidth: Math.round(176 * scale),
        maxWidth: Math.round(252 * scale),
        opacity: dimmed ? 0.2 : 1,
        filter: dimmed ? 'grayscale(0.55)' : undefined,
        transition: 'opacity 0.15s ease, filter 0.15s ease',
      }) as CSSProperties,
    [color, scale, dimmed]
  );

  return (
    <article
      className={`argus-entity-node${active ? ' is-active' : ''}${nodeData.pinned ? ' is-pinned' : ''}${dimmed ? ' is-dimmed' : ''}`}
      style={style}
      title={`${typeLabel}: ${title}${evCount ? ` · evidence ${evCount}` : ''}`}
      aria-label={`${typeLabel}: ${title}`}
    >
      <ConnectionHandles color={color} />
      <div className="argus-node-accent" />
      <div
        className="argus-node-content"
        style={{
          minHeight: Math.round(64 * scale),
          padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
        }}
      >
        <span className="argus-node-icon" aria-hidden="true">
          <Icon size={Math.round(17 * scale)} strokeWidth={1.8} />
        </span>
        <div className="argus-node-copy">
          <span className="argus-node-type">{typeLabel}</span>
          <span className="argus-node-title" style={{ fontSize: `${12.5 * scale}px` }}>
            {title}
          </span>
          {nodeData.subtitle ? <span className="argus-node-subtitle">{nodeData.subtitle}</span> : null}
        </div>
        {nodeData.pinned ? <span className="argus-node-pin" title="Pinned" aria-label="Pinned" /> : null}
        {evCount > 0 ? (
          <span
            className={`argus-node-ev-badge ${SUPPORT_CLASS[evSupport] || 'ev-none'}`}
            title={`Evidence: ${evCount} (${evSupport})`}
            aria-label={`Evidence ${evCount}`}
          >
            {evCount > 9 ? '9+' : evCount}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function propsEqual(a: NodeProps, b: NodeProps): boolean {
  if (a.selected !== b.selected) return false;
  const da = a.data as EntityNodeData;
  const db = b.data as EntityNodeData;
  return (
    da.label === db.label &&
    da.entityType === db.entityType &&
    da.subtitle === db.subtitle &&
    da.selected === db.selected &&
    da.highlighted === db.highlighted &&
    da.pinned === db.pinned &&
    da.dimmed === db.dimmed &&
    da.evidenceCount === db.evidenceCount &&
    da.evidenceSupport === db.evidenceSupport
  );
}

export default memo(EntityNodeInner, propsEqual);
