import { useStore } from '../store/useStore';
import { t as translate, type LangCode } from './locales';
import { TEMPORAL_EN, TEMPORAL_RU } from './temporalStrings';

const EXTRA: Record<string, Record<string, string>> = {
  en: TEMPORAL_EN,
  ru: TEMPORAL_RU,
};

export function useT() {
  const lang = useStore((s) => s.appearance.language) as LangCode;
  return (key: string) => {
    const primary = translate(lang || 'en', key);
    if (primary !== key) return primary;
    const pack = EXTRA[lang] || EXTRA.en;
    return pack?.[key] || EXTRA.en[key] || key;
  };
}

export function useLang() {
  return useStore((s) => s.appearance.language) as LangCode;
}
