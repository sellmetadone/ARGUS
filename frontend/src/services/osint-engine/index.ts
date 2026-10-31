/**
 * OSINT Engine — structured multi-step search with error isolation
 */
import { liveLookup } from '../osintLookup';
import { toolsForQuery, OSINT_TOOLS } from '../osintTools';
import { detectAndValidate } from '../validation';
import { eventBus, ArgusEvents } from '../../core/eventBus';
import type { LookupHit } from '../osintLookup';

export type OsintSearchResult = {
  query: string;
  validation: ReturnType<typeof detectAndValidate>;
  hits: LookupHit[];
  tools: ReturnType<typeof toolsForQuery>;
  errors: string[];
  ok: boolean;
};

export async function runOsintSearch(query: string): Promise<OsintSearchResult> {
  const q = query.trim();
  const errors: string[] = [];
  const validation = detectAndValidate(q);
  let hits: LookupHit[] = [];
  let tools: ReturnType<typeof toolsForQuery> = [];

  try {
    tools = toolsForQuery(q);
  } catch (e) {
    errors.push('tools:' + (e instanceof Error ? e.message : String(e)));
  }

  try {
    hits = await liveLookup(q);
  } catch (e) {
    errors.push('liveLookup:' + (e instanceof Error ? e.message : String(e)));
    hits = [];
  }

  const ok = errors.length === 0;
  if (ok) {
    eventBus.emit(ArgusEvents.SEARCH_DONE, { query: q, hits: hits.length });
  } else {
    eventBus.emit(ArgusEvents.SEARCH_DONE, { query: q, hits: hits.length, errors });
  }

  return { query: q, validation, hits, tools, errors, ok };
}

export function listTools() {
  return OSINT_TOOLS.map((t) => ({ id: t.id, name: t.name, category: t.category, desktop: !!t.desktop }));
}

/** @deprecated use listTools */
export function listProviders() {
  return listTools();
}

export const GITHUB_OSINT_CLIS = [
  { name: 'Sherlock', repo: 'https://github.com/sherlock-project/sherlock', use: 'username → sites' },
  { name: 'Maigret', repo: 'https://github.com/soxoj/maigret', use: 'username OSINT' },
  { name: 'theHarvester', repo: 'https://github.com/laramies/theHarvester', use: 'emails / hosts / names' },
  { name: 'Amass', repo: 'https://github.com/owasp-amass/amass', use: 'subdomain enum' },
  { name: 'Subfinder', repo: 'https://github.com/projectdiscovery/subfinder', use: 'passive subdomains' },
  { name: 'httpx', repo: 'https://github.com/projectdiscovery/httpx', use: 'probe HTTP' },
  { name: 'Nuclei', repo: 'https://github.com/projectdiscovery/nuclei', use: 'templates / vulns' },
  { name: 'Holehe', repo: 'https://github.com/megadose/holehe', use: 'email → registered sites' },
  { name: 'Photon', repo: 'https://github.com/s0md3v/Photon', use: 'crawler OSINT' },
  { name: 'ExifTool', repo: 'https://github.com/exiftool/exiftool', use: 'file metadata' },
];
