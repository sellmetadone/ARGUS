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
  timeline: 'Timeline', settings: 'Settings', search: 'Search', analytics: 'Analytics',
  correlation: 'Correlation', ai_assistant: 'AI Assistant', tutorial: 'Tutorial',
  search_web: 'Web search', status_open: 'Open', status_closed: 'Closed', status_archived: 'Archived',
  new_case: 'New case', import: 'Import', export: 'Export', delete: 'Delete', save: 'Save',
  cancel: 'Cancel', close: 'Close', add: 'Add', edit: 'Edit', apply: 'Apply',
  language: 'Language', theme: 'Theme', theme_light: 'Light', theme_dark: 'Dark', theme_amoled: 'AMOLED',
  density: 'Density', density_compact: 'Compact', density_comfortable: 'Comfortable', density_spacious: 'Spacious',
  graph: 'Graph', map: 'Map', command: 'Command', maltego: 'Maltego',
  create_entity: 'Create entity', connect: 'Connect', select: 'Select', hand: 'Pan',
  undo: 'Undo', redo: 'Redo', layout: 'Layout', fit_view: 'Fit view',
  confidence: 'Confidence', source: 'Source', notes: 'Notes', tags: 'Tags',
  field_label: 'Label', field_notes: 'Notes', field_tags: 'Tags',
  field_ip: 'IP address', field_domain: 'Domain', field_email: 'Email', field_phone: 'Phone',
  field_url: 'URL', field_hash: 'Hash', field_asn: 'ASN', field_cidr: 'CIDR',
  field_city: 'City', field_country: 'Country', field_address: 'Address',
  field_lat: 'Latitude', field_lng: 'Longitude', field_geo_precision: 'Geo precision',
  field_person: 'Person', field_org: 'Organization', field_company: 'Company',
  field_username: 'Username', field_platform: 'Platform', field_wallet: 'Wallet',
  field_file: 'File', field_document: 'Document', field_evidence: 'Evidence',
  field_related_ips: 'Related IPs', field_related_domains: 'Related domains',
  field_tech: 'Technology', field_header: 'HTTP header', field_favicon: 'Favicon hash',
  field_hosting: 'Hosting provider', field_cert: 'Certificate', field_fp: 'Fingerprint',
  field_nameserver: 'Nameserver', field_mx: 'MX', field_dns: 'DNS record',
  field_subdomain: 'Subdomain', field_website: 'Website',
  rel_confidence: 'Confidence', rel_source: 'Source', rel_source_ph: 'Reference URL or note',
  inspector: 'INSPECTOR', insp_overview: 'Overview', insp_data: 'Data', insp_sources: 'Sources',
  insp_relations: 'Links', insp_history: 'History', insp_type: 'Type', insp_created: 'Created',
  insp_updated: 'Updated', insp_first_seen: 'First seen', insp_last_seen: 'Last seen',
  insp_source_hint: 'Source is a reference string only — not automatic verification.',
  insp_no_relations: 'No relationships for this entity.',
  insp_history_hint: 'Recent workspace edits (undo stack labels).', insp_no_history: 'No history yet.',
  insp_pin: 'Pin', insp_unpin: 'Unpin', insp_delete_confirm: 'Delete this entity?',
  insp_show_on_map: 'Show on map',
  type_person: 'Person', type_organization: 'Organization', type_company: 'Company',
  type_ip: 'IP', type_domain: 'Domain', type_email: 'Email', type_phone: 'Phone',
  type_coordinates: 'Coordinates', type_city: 'City', type_country: 'Country',
  type_address: 'Address', type_geolocation: 'Geolocation',
  home: 'Home', map_title: 'Geospatial map', map_planned: 'Leaflet / MapLibre — planned',
  map_no_points: 'No entities with coordinates. Set lat/lng on coordinates, city, or address.',
  map_points: 'point(s)', map_fit_all: 'Fit all', map_open_osm: 'Open in OpenStreetMap ↗',
  welcome_title: 'ARGUS', welcome_sub: 'Intelligence workspace',
  welcome_new: 'New investigation', welcome_open: 'Open case',
  author: 'sellmetadone', channel: 'Telegram channel',
  analytics_title: 'Graph analytics', analytics_nodes: 'Nodes', analytics_edges: 'Edges',
  analytics_path_len: 'Shortest path length', analytics_paths: 'simple path(s)', analytics_common: 'common neighbors',
  corr_title: 'Correlation', corr_run: 'Find links', corr_apply: 'Add selected',
  ai_title: 'Local AI', ai_hint: 'Optional Ollama — app works without it',
  evidence_title: 'Evidence', timeline_title: 'Timeline',
  settings_title: 'Settings', settings_appearance: 'Appearance', settings_graph: 'Graph',
  settings_language: 'Language', settings_data: 'Data',
};

const ru: Dict = {
  app_name: 'ARGUS',
  cases: 'Кейсы', entities: 'Сущности', relationships: 'Связи', evidence: 'Доказательства',
  timeline: 'Таймлайн', settings: 'Настройки', search: 'Поиск', analytics: 'Аналитика',
  correlation: 'Корреляция', ai_assistant: 'ИИ-ассистент', tutorial: 'Обучение',
  search_web: 'Веб-поиск', status_open: 'Открыт', status_closed: 'Закрыт', status_archived: 'Архив',
  new_case: 'Новый кейс', import: 'Импорт', export: 'Экспорт', delete: 'Удалить', save: 'Сохранить',
  cancel: 'Отмена', close: 'Закрыть', add: 'Добавить', edit: 'Изменить', apply: 'Применить',
  language: 'Язык', theme: 'Тема', theme_light: 'Светлая', theme_dark: 'Тёмная', theme_amoled: 'AMOLED',
  density: 'Плотность', density_compact: 'Компактная', density_comfortable: 'Обычная', density_spacious: 'Просторная',
  graph: 'Граф', map: 'Карта', command: 'Команда', maltego: 'Maltego',
  create_entity: 'Создать сущность', connect: 'Связь', select: 'Выбор', hand: 'Перемещение',
  undo: 'Отменить', redo: 'Повторить', layout: 'Раскладка', fit_view: 'Вписать',
  confidence: 'Уверенность', source: 'Источник', notes: 'Заметки', tags: 'Теги',
  field_label: 'Название', field_notes: 'Заметки', field_tags: 'Теги',
  field_ip: 'IP-адрес', field_domain: 'Домен', field_email: 'Email', field_phone: 'Телефон',
  field_url: 'URL', field_hash: 'Хеш', field_asn: 'ASN', field_cidr: 'CIDR',
  field_city: 'Город', field_country: 'Страна', field_address: 'Адрес',
  field_lat: 'Широта', field_lng: 'Долгота', field_geo_precision: 'Точность гео',
  field_person: 'Персона', field_org: 'Организация', field_company: 'Компания',
  field_username: 'Имя пользователя', field_platform: 'Платформа', field_wallet: 'Кошелёк',
  field_file: 'Файл', field_document: 'Документ', field_evidence: 'Доказательство',
  field_related_ips: 'Связанные IP', field_related_domains: 'Связанные домены',
  field_tech: 'Технология', field_header: 'HTTP-заголовок', field_favicon: 'Favicon hash',
  field_hosting: 'Хостинг', field_cert: 'Сертификат', field_fp: 'Отпечаток',
  field_nameserver: 'Nameserver', field_mx: 'MX', field_dns: 'DNS-запись',
  field_subdomain: 'Поддомен', field_website: 'Сайт',
  rel_confidence: 'Уверенность', rel_source: 'Источник', rel_source_ph: 'Ссылка или заметка',
  inspector: 'ИНСПЕКТОР', insp_overview: 'Обзор', insp_data: 'Данные', insp_sources: 'Источники',
  insp_relations: 'Связи', insp_history: 'История', insp_type: 'Тип', insp_created: 'Создано',
  insp_updated: 'Обновлено', insp_first_seen: 'Впервые', insp_last_seen: 'Последний раз',
  insp_source_hint: 'Источник — только ссылка, не автоматическое подтверждение.',
  insp_no_relations: 'Нет связей у этой сущности.',
  insp_history_hint: 'Недавние правки рабочей области (метки undo).', insp_no_history: 'История пуста.',
  insp_pin: 'Закрепить', insp_unpin: 'Открепить', insp_delete_confirm: 'Удалить эту сущность?',
  insp_show_on_map: 'Показать на карте',
  type_person: 'Персона', type_organization: 'Организация', type_company: 'Компания',
  type_ip: 'IP', type_domain: 'Домен', type_email: 'Email', type_phone: 'Телефон',
  type_coordinates: 'Координаты', type_city: 'Город', type_country: 'Страна',
  type_address: 'Адрес', type_geolocation: 'Геолокация',
  home: 'Домой', map_title: 'Геокарта', map_planned: 'Leaflet / MapLibre — в планах',
  map_no_points: 'Нет сущностей с координатами. Укажите lat/lng у coordinates, city или address.',
  map_points: 'точек', map_fit_all: 'Все точки', map_open_osm: 'Открыть в OpenStreetMap ↗',
  welcome_title: 'ARGUS', welcome_sub: 'Рабочее пространство расследований',
  welcome_new: 'Новое расследование', welcome_open: 'Открыть кейс',
  author: 'sellmetadone', channel: 'Telegram-канал',
  analytics_title: 'Аналитика графа', analytics_nodes: 'Узлы', analytics_edges: 'Рёбра',
  analytics_path_len: 'Длина кратчайшего пути', analytics_paths: 'простых путей', analytics_common: 'общие соседи',
  corr_title: 'Корреляция', corr_run: 'Найти связи', corr_apply: 'Добавить выбранные',
  ai_title: 'Локальный ИИ', ai_hint: 'Опционально Ollama — приложение работает без него',
  evidence_title: 'Доказательства', timeline_title: 'Таймлайн',
  settings_title: 'Настройки', settings_appearance: 'Оформление', settings_graph: 'Граф',
  settings_language: 'Язык', settings_data: 'Данные',
};

const packs: Partial<Record<LangCode, Dict>> = { en, ru };

export function t(lang: LangCode, key: string): string {
  const pack = packs[lang] || en;
  return pack[key] || en[key] || key;
}

export function resolveLang(code: string | undefined | null): LangCode {
  if (code && code in LANG_META) return code as LangCode;
  return 'en';
}
