import { useMemo, useState } from 'react';
import type { EntityType } from '../../types';
import { useT } from '../../i18n/useT';

export type PickerItem = {
  type: EntityType;
  labelKey: string;
  descKey: string;
  category: string;
};

export const PICKER_TYPES: PickerItem[] = [
  { type: 'person', labelKey: 'type_person', descKey: 'type_person_desc', category: 'identity' },
  { type: 'organization', labelKey: 'type_organization', descKey: 'type_org_desc', category: 'identity' },
  { type: 'company', labelKey: 'type_company', descKey: 'type_org_desc', category: 'identity' },
  { type: 'username', labelKey: 'type_account', descKey: 'type_account_desc', category: 'identity' },
  { type: 'phone', labelKey: 'type_phone', descKey: 'type_phone_desc', category: 'contact' },
  { type: 'email', labelKey: 'type_email', descKey: 'type_email_desc', category: 'contact' },
  { type: 'domain', labelKey: 'type_domain', descKey: 'type_domain_desc', category: 'infra' },
  { type: 'ip', labelKey: 'type_ip', descKey: 'type_ip_desc', category: 'infra' },
  { type: 'website', labelKey: 'type_website', descKey: 'type_web_desc', category: 'infra' },
  { type: 'url', labelKey: 'type_url', descKey: 'type_web_desc', category: 'infra' },
  { type: 'address', labelKey: 'type_location', descKey: 'type_loc_desc', category: 'geo' },
  { type: 'document', labelKey: 'type_document', descKey: 'type_doc_desc', category: 'files' },
  { type: 'note', labelKey: 'type_custom', descKey: 'type_custom_desc', category: 'other' },
];

type Props = {
  x: number;
  y: number;
  onPick: (type: EntityType) => void;
  onClose: () => void;
};

export default function EntityTypePicker({ x, y, onPick, onClose }: Props) {
  const t = useT();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return PICKER_TYPES;
    return PICKER_TYPES.filter(
      (p) =>
        t(p.labelKey).toLowerCase().includes(qq) ||
        p.type.includes(qq) ||
        t(p.descKey).toLowerCase().includes(qq)
    );
  }, [q, t]);

  return (
    <div
      className="entity-type-menu"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('type_search')}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      />
      {list.map((p) => (
        <button
          key={p.type}
          type="button"
          className="entity-type-item"
          onClick={() => onPick(p.type)}
        >
          <div>
            <div>{t(p.labelKey)}</div>
            <div className="desc">{t(p.descKey)}</div>
          </div>
        </button>
      ))}
      {list.length === 0 && (
        <div style={{ padding: 8, color: 'var(--text-muted)', fontSize: 12 }}>{t('type_empty')}</div>
      )}
    </div>
  );
}
