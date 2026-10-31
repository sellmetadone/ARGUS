export type LangCode =
  | 'en' | 'ru' | 'uk' | 'de' | 'zh' | 'ar' | 'es' | 'fr'
  | 'pt' | 'ja' | 'ko' | 'tr' | 'pl' | 'it' | 'hi';

export const LANG_META: Record<LangCode, { name: string; native: string; dir: 'ltr' | 'rtl' }> = {
  en: { name: 'English', native: 'English', dir: 'ltr' },
  ru: { name: 'Russian', native: 'Русский', dir: 'ltr' },
  uk: { name: 'Ukrainian', native: 'Українська', dir: 'ltr' },
  de: { name: 'German', native: 'Deutsch', dir: 'ltr' },
  zh: { name: 'Chinese', native: '中文', dir: 'ltr' },
  ar: { name: 'Arabic', native: 'العربية', dir: 'rtl' },
  es: { name: 'Spanish', native: 'Español', dir: 'ltr' },
  fr: { name: 'French', native: 'Français', dir: 'ltr' },
  pt: { name: 'Portuguese', native: 'Português', dir: 'ltr' },
  ja: { name: 'Japanese', native: '日本語', dir: 'ltr' },
  ko: { name: 'Korean', native: '한국어', dir: 'ltr' },
  tr: { name: 'Turkish', native: 'Türkçe', dir: 'ltr' },
  pl: { name: 'Polish', native: 'Polski', dir: 'ltr' },
  it: { name: 'Italian', native: 'Italiano', dir: 'ltr' },
  hi: { name: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
};

type Dict = Record<string, string>;

const en: Dict = {
  app_name: 'ARGUS',
  cases: 'Cases',
  new_case: 'New Case',
  entity: 'Entity',
  relationship: 'Relationship',
  properties: 'Properties',
  relations: 'Relations',
  connected: 'Connected',
  timeline: 'Timeline',
  search: 'Search',
  settings: 'Settings',
  map: 'Map',
  graph_search_placeholder: 'Search graph…',
  search_web: 'Web search',
  status_open: 'Open',
  status_closed: 'Closed',
  status_archived: 'Archived',
  export: 'Export',
  import: 'Import',
  undo: 'Undo',
  redo: 'Redo',
  clear: 'Clear',
  delete: 'Delete',
  add: 'Add',
  save: 'Save',
  cancel: 'Cancel',
  language: 'Language',
  theme: 'Theme',
  focus_mode: 'Focus mode',
  layout: 'Layout',
};

const ru: Dict = {
  ...en,
  cases: 'Кейсы',
  new_case: 'Новый кейс',
  entity: 'Сущность',
  relationship: 'Связь',
  properties: 'Свойства',
  relations: 'Связи',
  connected: 'Связано',
  timeline: 'Таймлайн',
  search: 'Поиск',
  settings: 'Настройки',
  map: 'Карта',
  graph_search_placeholder: 'Поиск по графу…',
  search_web: 'Веб-поиск',
  status_open: 'Открыт',
  status_closed: 'Закрыт',
  status_archived: 'Архив',
  export: 'Экспорт',
  import: 'Импорт',
  undo: 'Отмена',
  redo: 'Повтор',
  clear: 'Очистить',
  delete: 'Удалить',
  add: 'Добавить',
  save: 'Сохранить',
  cancel: 'Отмена',
  language: 'Язык',
  theme: 'Тема',
  focus_mode: 'Фокус',
  layout: 'Раскладка',
};

export const LOCALES: Record<LangCode, Dict> = {
  en, ru,
  uk: { ...ru }, de: { ...en }, zh: { ...en }, ar: { ...en },
  es: { ...en }, fr: { ...en }, pt: { ...en }, ja: { ...en },
  ko: { ...en }, tr: { ...en }, pl: { ...en }, it: { ...en }, hi: { ...en },
};

export function t(lang: LangCode, key: string): string {
  return LOCALES[lang]?.[key] || LOCALES.en[key] || key;
}
