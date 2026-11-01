import type { Entity, EntityType } from '../types';
import { defaultLabel, defaultProperties, getSchema } from './entitySchemas';

export type CreateEntityInput = {
  type: EntityType;
  caseId: string;
  position?: { x: number; y: number };
  label?: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
  source?: string;
  confidence?: number;
};

/** Build a full Entity with schema-initialized properties (no store side effects). */
export function createEntityFromSchema(input: CreateEntityInput): Entity {
  const now = new Date().toISOString();
  const schema = getSchema(input.type);
  const base = defaultProperties(input.type);
  const properties = { ...base, ...(input.properties || {}) };

  let label = input.label || defaultLabel(input.type);
  const labelField = schema.fields.find((f) => f.isLabel);
  if (labelField && properties[labelField.key]) {
    label = String(properties[labelField.key]);
  }

  return {
    id: `ent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: input.type,
    label,
    properties,
    caseId: input.caseId,
    createdAt: now,
    updatedAt: now,
    position: input.position,
    confidence: input.confidence ?? 50,
    source: input.source || 'Manual',
    tags: [],
  };
}

/** When a schema field marked isLabel changes, return the label to sync. */
export function labelFromProperties(
  type: EntityType,
  properties: Record<string, unknown>,
  fallback: string
): string {
  const schema = getSchema(type);
  const labelField = schema.fields.find((f) => f.isLabel);
  if (labelField) {
    const v = properties[labelField.key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return fallback;
}
