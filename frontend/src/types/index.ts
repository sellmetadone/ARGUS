export type EntityType =
  | 'ip'
  | 'ipv6'
  | 'domain'
  | 'subdomain'
  | 'asn'
  | 'cidr'
  | 'nameserver'
  | 'mx'
  | 'dns_record'
  | 'certificate'
  | 'certificate_fingerprint'
  | 'url'
  | 'website'
  | 'technology'
  | 'http_header'
  | 'favicon_hash'
  | 'hosting_provider'
  | 'coordinates'
  | 'city'
  | 'country'
  | 'geolocation'
  | 'address'
  | 'person'
  | 'organization'
  | 'company'
  | 'email'
  | 'phone'
  | 'username'
  | 'social_account'
  | 'wallet'
  | 'hash'
  | 'file'
  | 'document'
  | 'note'
  | 'evidence';

export type RelationshipType =
  | 'resolves_to'
  | 'has_subdomain'
  | 'uses_certificate'
  | 'belongs_to'
  | 'announced_prefix'
  | 'uses'
  | 'hosted_on'
  | 'points_to'
  | 'issued_by'
  | 'contains'
  | 'related_to'
  | 'seen_with'
  | 'registered_by'
  | 'located_in'
  | 'communicates_with'
  | 'owns'
  | 'part_of'
  | 'works_at'
  | 'employs'
  | 'has_email'
  | 'has_phone'
  | 'lives_at'
  | 'member_of'
  | 'same_as'
  | 'controls';

export interface EntityProperties {
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface Entity {
  id: string;
  type: EntityType;
  label: string;
  properties: EntityProperties;
  caseId: string;
  createdAt: string;
  updatedAt: string;
  firstSeen?: string;
  lastSeen?: string;
  confidence?: number;
  notes?: string;
  tags?: string[];
  source?: string;
  position?: { x: number; y: number; z?: number };
}

export interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  caseId: string;
  properties: EntityProperties;
  firstSeen?: string;
  lastSeen?: string;
  confidence?: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  name: string;
  description?: string;
  status: 'open' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  entityId?: string;
  relationshipId?: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  properties?: EntityProperties;
}

export const ENTITY_COLORS: Record<EntityType, string> = {
  ip: '#3b82f6',
  ipv6: '#60a5fa',
  domain: '#8b5cf6',
  subdomain: '#a78bfa',
  asn: '#f59e0b',
  cidr: '#fbbf24',
  nameserver: '#10b981',
  mx: '#14b8a6',
  dns_record: '#06b6d4',
  certificate: '#ec4899',
  certificate_fingerprint: '#f472b6',
  url: '#6366f1',
  website: '#818cf8',
  technology: '#22c55e',
  http_header: '#84cc16',
  favicon_hash: '#a3e635',
  hosting_provider: '#ef4444',
  coordinates: '#f97316',
  city: '#fb923c',
  country: '#fdba74',
  geolocation: '#ea580c',
  address: '#f97316',
  person: '#e11d48',
  organization: '#be123c',
  company: '#9f1239',
  email: '#0ea5e9',
  phone: '#0284c7',
  username: '#7c3aed',
  social_account: '#db2777',
  wallet: '#ca8a04',
  hash: '#57534e',
  file: '#78716c',
  document: '#a8a29e',
  note: '#64748b',
  evidence: '#475569',
};

export const ENTITY_ICONS: Record<EntityType, string> = {
  ip: 'IP',
  ipv6: 'IP6',
  domain: 'DOM',
  subdomain: 'SUB',
  asn: 'ASN',
  cidr: 'NET',
  nameserver: 'NS',
  mx: 'MX',
  dns_record: 'DNS',
  certificate: 'CRT',
  certificate_fingerprint: 'FP',
  url: 'URL',
  website: 'WEB',
  technology: 'TECH',
  http_header: 'HDR',
  favicon_hash: 'ICO',
  hosting_provider: 'HOST',
  coordinates: 'GEO',
  city: 'CITY',
  country: 'CTRY',
  geolocation: 'LOC',
  address: 'ADDR',
  person: 'PER',
  organization: 'ORG',
  company: 'CO',
  email: 'MAIL',
  phone: 'TEL',
  username: 'USER',
  social_account: 'SOC',
  wallet: 'WAL',
  hash: 'HASH',
  file: 'FILE',
  document: 'DOC',
  note: 'NOTE',
  evidence: 'EV',
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  resolves_to: 'resolves to',
  has_subdomain: 'has subdomain',
  uses_certificate: 'uses certificate',
  belongs_to: 'belongs to',
  announced_prefix: 'announces',
  uses: 'uses',
  hosted_on: 'hosted on',
  points_to: 'points to',
  issued_by: 'issued by',
  contains: 'contains',
  related_to: 'related to',
  seen_with: 'seen with',
  registered_by: 'registered by',
  located_in: 'located in',
  communicates_with: 'communicates with',
  owns: 'owns',
  part_of: 'part of',
  works_at: 'works at',
  employs: 'employs',
  has_email: 'has email',
  has_phone: 'has phone',
  lives_at: 'lives at',
  member_of: 'member of',
  same_as: 'same as',
  controls: 'controls',
};
