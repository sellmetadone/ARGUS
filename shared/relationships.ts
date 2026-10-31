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

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  resolves_to: 'resolves to',
  has_subdomain: 'has subdomain',
  uses_certificate: 'uses certificate',
  belongs_to: 'belongs to',
  announced_prefix: 'announced prefix',
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
