import { useStore } from '../store/useStore';
import { t as translate, type LangCode } from './locales';

export function useT() {
  const lang = useStore((s) => s.appearance.language) as LangCode;
  return (key: string) => translate(lang || 'en', key);
}

export function useLang() {
  return useStore((s) => s.appearance.language) as LangCode;
}
