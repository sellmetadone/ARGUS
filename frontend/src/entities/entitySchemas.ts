/**
 * Entity schemas — UI/validation structure per type.
 * Data still lives on Entity.properties; schemas do not change case JSON format.
 */
import type { EntityType } from '../types';

export type FieldKind = 'text' | 'textarea' | 'url' | 'email' | 'phone' | 'number' | 'date' | 'tags' | 'mono';

export type SchemaField = {
  key: string;
  /** i18n key or plain label fallback */
  labelKey: string;
  kind: FieldKind;
  /** If true, field value is also used / mirrored as entity.label when set */
  isLabel?: boolean;
  placeholder?: string;
};

export type EntitySchema = {
  type: EntityType;
  labelKey: string;
  category: 'identity' | 'contact' | 'infra' | 'geo' | 'files' | 'other';
  fields: SchemaField[];
};

const commonMeta: SchemaField[] = [
  { key: 'aliases', labelKey: 'field_aliases', kind: 'tags' },
  { key: 'description', labelKey: 'field_description', kind: 'textarea' },
  { key: 'tags', labelKey: 'field_tags', kind: 'tags' },
];

export const ENTITY_SCHEMAS: Partial<Record<EntityType, EntitySchema>> = {
  person: {
    type: 'person',
    labelKey: 'type_person',
    category: 'identity',
    fields: [
      { key: 'firstName', labelKey: 'field_first_name', kind: 'text' },
      { key: 'lastName', labelKey: 'field_last_name', kind: 'text' },
      { key: 'fullName', labelKey: 'field_full_name', kind: 'text', isLabel: true },
      { key: 'photoUrl', labelKey: 'field_photo', kind: 'url' },
      { key: 'profileLinks', labelKey: 'field_profiles', kind: 'textarea' },
      { key: 'identifiers', labelKey: 'field_identifiers', kind: 'textarea' },
      ...commonMeta,
    ],
  },
  organization: {
    type: 'organization',
    labelKey: 'type_organization',
    category: 'identity',
    fields: [
      { key: 'name', labelKey: 'field_name', kind: 'text', isLabel: true },
      { key: 'altNames', labelKey: 'field_alt_names', kind: 'tags' },
      { key: 'orgType', labelKey: 'field_org_type', kind: 'text' },
      { key: 'website', labelKey: 'field_website', kind: 'url' },
      { key: 'contacts', labelKey: 'field_contacts', kind: 'textarea' },
      { key: 'addresses', labelKey: 'field_addresses', kind: 'textarea' },
      ...commonMeta,
    ],
  },
  company: {
    type: 'company',
    labelKey: 'type_company',
    category: 'identity',
    fields: [
      { key: 'name', labelKey: 'field_name', kind: 'text', isLabel: true },
      { key: 'altNames', labelKey: 'field_alt_names', kind: 'tags' },
      { key: 'orgType', labelKey: 'field_org_type', kind: 'text' },
      { key: 'website', labelKey: 'field_website', kind: 'url' },
      { key: 'registrationId', labelKey: 'field_reg_id', kind: 'mono' },
      ...commonMeta,
    ],
  },
  username: {
    type: 'username',
    labelKey: 'type_account',
    category: 'identity',
    fields: [
      { key: 'username', labelKey: 'field_username', kind: 'mono', isLabel: true },
      { key: 'platform', labelKey: 'field_platform', kind: 'text' },
      { key: 'profileUrl', labelKey: 'field_profile_url', kind: 'url' },
      { key: 'userId', labelKey: 'field_user_id', kind: 'mono' },
      { key: 'discoveredAt', labelKey: 'field_discovered', kind: 'date' },
      ...commonMeta,
    ],
  },
  social_account: {
    type: 'social_account',
    labelKey: 'type_account',
    category: 'identity',
    fields: [
      { key: 'username', labelKey: 'field_username', kind: 'mono', isLabel: true },
      { key: 'platform', labelKey: 'field_platform', kind: 'text' },
      { key: 'profileUrl', labelKey: 'field_profile_url', kind: 'url' },
      { key: 'userId', labelKey: 'field_user_id', kind: 'mono' },
      ...commonMeta,
    ],
  },
  phone: {
    type: 'phone',
    labelKey: 'type_phone',
    category: 'contact',
    fields: [
      { key: 'number', labelKey: 'field_phone_number', kind: 'phone', isLabel: true },
      { key: 'country', labelKey: 'field_country', kind: 'text' },
      { key: 'phoneType', labelKey: 'field_phone_type', kind: 'text' },
      ...commonMeta,
    ],
  },
  email: {
    type: 'email',
    labelKey: 'type_email',
    category: 'contact',
    fields: [
      { key: 'address', labelKey: 'field_email', kind: 'email', isLabel: true },
      { key: 'domain', labelKey: 'field_email_domain', kind: 'mono' },
      ...commonMeta,
    ],
  },
  domain: {
    type: 'domain',
    labelKey: 'type_domain',
    category: 'infra',
    fields: [
      { key: 'domain', labelKey: 'field_domain', kind: 'mono', isLabel: true },
      { key: 'registrar', labelKey: 'field_registrar', kind: 'text' },
      { key: 'registeredAt', labelKey: 'field_registered', kind: 'date' },
      { key: 'relatedIps', labelKey: 'field_related_ips', kind: 'textarea' },
      ...commonMeta,
    ],
  },
  subdomain: {
    type: 'subdomain',
    labelKey: 'type_domain',
    category: 'infra',
    fields: [
      { key: 'domain', labelKey: 'field_domain', kind: 'mono', isLabel: true },
      { key: 'parentDomain', labelKey: 'field_parent_domain', kind: 'mono' },
      ...commonMeta,
    ],
  },
  ip: {
    type: 'ip',
    labelKey: 'type_ip',
    category: 'infra',
    fields: [
      { key: 'address', labelKey: 'field_ip', kind: 'mono', isLabel: true },
      { key: 'version', labelKey: 'field_ip_version', kind: 'text' },
      { key: 'asn', labelKey: 'field_asn', kind: 'mono' },
      { key: 'org', labelKey: 'field_asn_org', kind: 'text' },
      { key: 'relatedDomains', labelKey: 'field_related_domains', kind: 'textarea' },
      ...commonMeta,
    ],
  },
  ipv6: {
    type: 'ipv6',
    labelKey: 'type_ip',
    category: 'infra',
    fields: [
      { key: 'address', labelKey: 'field_ip', kind: 'mono', isLabel: true },
      { key: 'asn', labelKey: 'field_asn', kind: 'mono' },
      ...commonMeta,
    ],
  },
  website: {
    type: 'website',
    labelKey: 'type_website',
    category: 'infra',
    fields: [
      { key: 'url', labelKey: 'field_url', kind: 'url', isLabel: true },
      { key: 'title', labelKey: 'field_site_title', kind: 'text' },
      { key: 'domain', labelKey: 'field_domain', kind: 'mono' },
      ...commonMeta,
    ],
  },
  url: {
    type: 'url',
    labelKey: 'type_url',
    category: 'infra',
    fields: [
      { key: 'url', labelKey: 'field_url', kind: 'url', isLabel: true },
      { key: 'title', labelKey: 'field_site_title', kind: 'text' },
      ...commonMeta,
    ],
  },
  address: {
    type: 'address',
    labelKey: 'type_location',
    category: 'geo',
    fields: [
      { key: 'name', labelKey: 'field_place_name', kind: 'text', isLabel: true },
      { key: 'street', labelKey: 'field_street', kind: 'text' },
      { key: 'city', labelKey: 'field_city', kind: 'text' },
      { key: 'country', labelKey: 'field_country', kind: 'text' },
      { key: 'lat', labelKey: 'field_lat', kind: 'number' },
      { key: 'lng', labelKey: 'field_lng', kind: 'number' },
      { key: 'precision', labelKey: 'field_geo_precision', kind: 'text' },
      ...commonMeta,
    ],
  },
  city: {
    type: 'city',
    labelKey: 'type_location',
    category: 'geo',
    fields: [
      { key: 'name', labelKey: 'field_place_name', kind: 'text', isLabel: true },
      { key: 'country', labelKey: 'field_country', kind: 'text' },
      { key: 'lat', labelKey: 'field_lat', kind: 'number' },
      { key: 'lng', labelKey: 'field_lng', kind: 'number' },
      ...commonMeta,
    ],
  },
  document: {
    type: 'document',
    labelKey: 'type_document',
    category: 'files',
    fields: [
      { key: 'title', labelKey: 'field_doc_title', kind: 'text', isLabel: true },
      { key: 'docType', labelKey: 'field_doc_type', kind: 'text' },
      { key: 'date', labelKey: 'field_doc_date', kind: 'date' },
      { key: 'fileRef', labelKey: 'field_file_ref', kind: 'url' },
      ...commonMeta,
    ],
  },
  file: {
    type: 'file',
    labelKey: 'type_document',
    category: 'files',
    fields: [
      { key: 'title', labelKey: 'field_doc_title', kind: 'text', isLabel: true },
      { key: 'hash', labelKey: 'field_hash', kind: 'mono' },
      { key: 'fileRef', labelKey: 'field_file_ref', kind: 'url' },
      ...commonMeta,
    ],
  },
  note: {
    type: 'note',
    labelKey: 'type_custom',
    category: 'other',
    fields: [
      { key: 'title', labelKey: 'field_name', kind: 'text', isLabel: true },
      { key: 'body', labelKey: 'field_description', kind: 'textarea' },
      { key: 'tags', labelKey: 'field_tags', kind: 'tags' },
    ],
  },
  evidence: {
    type: 'evidence',
    labelKey: 'type_document',
    category: 'files',
    fields: [
      { key: 'title', labelKey: 'field_doc_title', kind: 'text', isLabel: true },
      { key: 'body', labelKey: 'field_description', kind: 'textarea' },
      { key: 'fileRef', labelKey: 'field_file_ref', kind: 'url' },
      ...commonMeta,
    ],
  },
};

/** Fallback for types without a dedicated schema */
export const GENERIC_SCHEMA: EntitySchema = {
  type: 'note',
  labelKey: 'type_custom',
  category: 'other',
  fields: [
    { key: 'title', labelKey: 'field_name', kind: 'text', isLabel: true },
    { key: 'value', labelKey: 'field_value', kind: 'mono' },
    ...commonMeta,
  ],
};

export function getSchema(type: EntityType): EntitySchema {
  return ENTITY_SCHEMAS[type] || { ...GENERIC_SCHEMA, type };
}

export function defaultProperties(type: EntityType): Record<string, string> {
  const schema = getSchema(type);
  const props: Record<string, string> = {};
  for (const f of schema.fields) {
    props[f.key] = '';
  }
  return props;
}

export function defaultLabel(type: EntityType): string {
  const map: Partial<Record<EntityType, string>> = {
    person: 'New person',
    organization: 'New organization',
    company: 'New company',
    username: 'username',
    social_account: 'account',
    phone: '+000',
    email: 'name@example.com',
    domain: 'example.com',
    ip: '0.0.0.0',
    website: 'https://',
    url: 'https://',
    address: 'Location',
    document: 'Document',
    note: 'Note',
  };
  return map[type] || `New ${type}`;
}
