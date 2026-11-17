export type LangCode =
  | 'en'
  | 'ru'
  | 'uk'
  | 'de'
  | 'fr'
  | 'es'
  | 'pt'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'tr'
  | 'pl'
  | 'it'
  | 'nl';

export const LANG_META: Record<LangCode, { name: string; native: string; dir: 'ltr' | 'rtl' }> = {
  en: { name: 'English', native: 'English', dir: 'ltr' },
  ru: { name: 'Russian', native: 'Русский', dir: 'ltr' },
  uk: { name: 'Ukrainian', native: 'Українська', dir: 'ltr' },
  de: { name: 'German', native: 'Deutsch', dir: 'ltr' },
  fr: { name: 'French', native: 'Français', dir: 'ltr' },
  es: { name: 'Spanish', native: 'Español', dir: 'ltr' },
  pt: { name: 'Portuguese', native: 'Português', dir: 'ltr' },
  zh: { name: 'Chinese', native: '中文', dir: 'ltr' },
  ja: { name: 'Japanese', native: '日本語', dir: 'ltr' },
  ko: { name: 'Korean', native: '한국어', dir: 'ltr' },
  ar: { name: 'Arabic', native: 'العربية', dir: 'rtl' },
  tr: { name: 'Turkish', native: 'Türkçe', dir: 'ltr' },
  pl: { name: 'Polish', native: 'Polski', dir: 'ltr' },
  it: { name: 'Italian', native: 'Italiano', dir: 'ltr' },
  nl: { name: 'Dutch', native: 'Nederlands', dir: 'ltr' },
};

type Dict = Record<string, string>;

const en: Dict = {
  app_name: 'ARGUS',
  cases: 'Cases', entities: 'Entities', relationships: 'Links', evidence: 'Evidence',
  create_entity: 'Create entity', connect: 'Connect', select: 'Select', hand: 'Pan',
  wb_frame: 'Frame', wb_text: 'Text', wb_shape: 'Shape', wb_pen: 'Pen', wb_stamp: 'Stamp',
  wb_group: 'Group', wb_hint: 'Shift+drag · Frame · Pen · Shapes',
  align_left: 'Align left', align_center: 'Align center', align_right: 'Align right',
  align_top: 'Align top', align_middle: 'Align middle', align_bottom: 'Align bottom',
  align_distribute_h: 'Distribute H', align_distribute_v: 'Distribute V',
  notes: 'Notes', settings: 'Settings', search: 'Search', timeline: 'Timeline', map: 'Map',
  save: 'Save', export: 'Export', import: 'Import', delete: 'Delete', cancel: 'Cancel',
  theme: 'Theme', language: 'Language', dark: 'Dark', light: 'Light', amoled: 'AMOLED',
  confidence: 'Confidence', source: 'Source', tags: 'Tags',
  field_label: 'Label', field_notes: 'Notes', field_tags: 'Tags',
};

const ru: Dict = {
  app_name: 'ARGUS',
  cases: 'Кейсы', entities: 'Сущности', relationships: 'Связи', evidence: 'Доказательства',
  create_entity: 'Создать сущность', connect: 'Связь', select: 'Выбор', hand: 'Перемещение',
  wb_frame: 'Рамка', wb_text: 'Текст', wb_shape: 'Фигура', wb_pen: 'Перо', wb_stamp: 'Штамп',
  wb_group: 'Группа', wb_hint: 'Shift+drag · Рамка · Перо · Фигуры',
  align_left: 'По левому краю', align_center: 'По центру', align_right: 'По правому краю',
  align_top: 'По верхнему краю', align_middle: 'Посередине', align_bottom: 'По нижнему краю',
  align_distribute_h: 'Распределить гориз.', align_distribute_v: 'Распределить верт.',
  notes: 'Заметки', settings: 'Настройки', search: 'Поиск', timeline: 'Таймлайн', map: 'Карта',
  save: 'Сохранить', export: 'Экспорт', import: 'Импорт', delete: 'Удалить', cancel: 'Отмена',
  theme: 'Тема', language: 'Язык', dark: 'Тёмная', light: 'Светлая', amoled: 'AMOLED',
  confidence: 'Уверенность', source: 'Источник', tags: 'Теги',
  field_label: 'Название', field_notes: 'Заметки', field_tags: 'Теги',
};

const dictionaries: Record<LangCode, Dict> = {
  en,
  ru,
  uk: { ...en },
  de: { ...en },
  fr: { ...en },
  es: { ...en },
  pt: { ...en },
  zh: { ...en },
  ja: { ...en },
  ko: { ...en },
  ar: { ...en },
  tr: { ...en },
  pl: { ...en },
  it: { ...en },
  nl: { ...en },
};

export function t(lang: LangCode, key: string): string {
  return dictionaries[lang]?.[key] || dictionaries.en[key] || key;
}

export function getDict(lang: LangCode): Dict {
  return dictionaries[lang] || dictionaries.en;
}
