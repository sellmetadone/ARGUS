import { memo, type CSSProperties } from 'react';
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

/**
 * One handle per side, type=source. With ConnectionMode.Loose, edges can
 * start and end on any side — path direction matches drag (down stays down).
 * Avoid separate source+target on the same side (RF often picks the wrong one).
 */
function ConnectionHandles({ color }: { color: string }) {
  const base: CSSProperties = {
    width: 11,
    height: 11,
    border: '2px solid var(--panel, #fff)',
    borderRadius: 999,
    background: color,
    opacity: 0,
    transition: 'opacity .14s ease, transform .14s ease, box-shadow .14s ease',
    zIndex: 5,
  };
  const sides: { position: Position; id: string }[] = [
    { position: Position.Top, id: 'top' },
    { position: Position.Right, id: 'right' },
    { position: Position.Bottom, id: 'bottom' },
    { position: Position.Left, id: 'left' },
  ];
  return (
    <>
      {sides.map(({ position, id }) => (
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
}

function EntityNode({ data, selected }: NodeProps) {
  const nodeData = data as EntityNodeData;
  const appearance = useStore((s) => s.appearance);
  const graphSettings = useStore((s) => s.graphSettings);
  const color = appearance.entityColors?.[nodeData.entityType] || ENTITY_COLORS[nodeData.entityType] || '#64748b';
  const Icon = ICONS[nodeData.entityType] || Database;
  // Scale via size, NOT CSS transform — transform breaks RF handle geometry & edge paths
  const scale = Math.max(0.85, Math.min(1.25, graphSettings.nodeSize || 1));
  const active = Boolean(selected || nodeData.selected || nodeData.highlighted);
  const title = String(nodeData.label || 'Untitled entity');
  const typeLabel = String(nodeData.entityType || 'entity').replace(/_/g, ' ');

  return (
    <article
      className={`argus-entity-node${active ? ' is-active' : ''}${nodeData.pinned ? ' is-pinned' : ''}`}
      style={
        {
          '--entity-accent': color,
          minWidth: Math.round(176 * scale),
          maxWidth: Math.round(252 * scale),
        } as CSSProperties
      }
      title={`${typeLabel}: ${title}`}
      aria-label={`${typeLabel}: ${title}`}
    >
      <ConnectionHandles color={color} />
      <div className="argus-node-accent" />
      <div className="argus-node-content" style={{ minHeight: Math.round(64 * scale), padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px` }}>
        <span className="argus-node-icon" aria-hidden="true">
          <Icon size={Math.round(17 * scale)} strokeWidth={1.8} />
        </span>
        <div className="argus-node-copy">
          <span className="argus-node-type">{typeLabel}</span>
          <span className="argus-node-title" style={{ fontSize: `${12.5 * scale}px` }}>{title}</span>
          {nodeData.subtitle && <span className="argus-node-subtitle">{nodeData.subtitle}</span>}
        </div>
        {nodeData.pinned && <span className="argus-node-pin" title="Pinned" aria-label="Pinned" />}
      </div>
    </article>
  );
}

export default memo(EntityNode);
