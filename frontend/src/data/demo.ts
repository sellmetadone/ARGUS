import type { Case, Entity, Relationship, TimelineEvent } from '../types';

const CASE_ID = 'case-001';

export const demoCases: Case[] = [
  {
    id: CASE_ID,
    name: 'Investigation #001 — example.com',
    description: 'Анализ инфраструктуры example.com',
    status: 'open',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-09-07T18:00:00Z',
    tags: ['infrastructure'],
  },
  {
    id: 'case-002',
    name: 'Investigation #002 — APT activity',
    status: 'open',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-09-05T12:00:00Z',
  },
];

export const demoEntities: Entity[] = [
  {
    id: 'ent-domain-example',
    type: 'domain',
    label: 'example.com',
    properties: { registrar: 'Example Registrar Inc.' },
    caseId: CASE_ID,
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-09-07T12:00:00Z',
    confidence: 100,
    source: 'WHOIS',
    position: { x: 400, y: 300 },
  },
  {
    id: 'ent-ip-185',
    type: 'ip',
    label: '185.10.10.10',
    properties: { country: 'NL', org: 'Example Hosting BV' },
    caseId: CASE_ID,
    createdAt: '2026-07-04T11:00:00Z',
    updatedAt: '2026-09-07T12:00:00Z',
    confidence: 98,
    source: 'DNS A',
    position: { x: 700, y: 200 },
  },
  {
    id: 'ent-sub-mail',
    type: 'subdomain',
    label: 'mail.example.com',
    properties: { parent: 'example.com' },
    caseId: CASE_ID,
    createdAt: '2026-07-05T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    confidence: 95,
    position: { x: 200, y: 450 },
  },
  {
    id: 'ent-email',
    type: 'email',
    label: 'admin@example.com',
    properties: {},
    caseId: CASE_ID,
    createdAt: '2026-07-10T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    confidence: 90,
    position: { x: 250, y: 200 },
  },
];

export const demoRelationships: Relationship[] = [
  {
    id: 'rel-1',
    type: 'resolves_to',
    sourceId: 'ent-domain-example',
    targetId: 'ent-ip-185',
    caseId: CASE_ID,
    properties: {},
    confidence: 98,
    source: 'DNS',
    createdAt: '2026-07-04T11:00:00Z',
    updatedAt: '2026-09-07T12:00:00Z',
  },
  {
    id: 'rel-2',
    type: 'has_subdomain',
    sourceId: 'ent-domain-example',
    targetId: 'ent-sub-mail',
    caseId: CASE_ID,
    properties: {},
    confidence: 95,
    createdAt: '2026-07-05T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rel-3',
    type: 'has_email',
    sourceId: 'ent-domain-example',
    targetId: 'ent-email',
    caseId: CASE_ID,
    properties: {},
    confidence: 90,
    createdAt: '2026-07-10T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
];

export const demoTimeline: TimelineEvent[] = [
  {
    id: 'tl-1',
    caseId: CASE_ID,
    entityId: 'ent-domain-example',
    type: 'discovery',
    title: 'Domain example.com added',
    timestamp: '2026-07-01T10:00:00Z',
  },
  {
    id: 'tl-2',
    caseId: CASE_ID,
    entityId: 'ent-ip-185',
    type: 'dns',
    title: 'Resolved to 185.10.10.10',
    timestamp: '2026-07-04T11:00:00Z',
  },
];
