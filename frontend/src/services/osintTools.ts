export type OsintTool = {
  id: string;
  name: string;
  description: string;
  category: string;
  url?: string;
  desktop?: boolean;
};

export const OSINT_CATEGORY_LABELS: Record<string, string> = {
  infra: 'Infrastructure',
  identity: 'Identity',
  breach: 'Breaches',
  archive: 'Archives',
  geo: 'Geo',
  other: 'Other',
};

export const OSINT_TOOLS: OsintTool[] = [
  { id: 'whois', name: 'WHOIS', description: 'Domain registration', category: 'infra', url: 'https://who.is/whois/' },
  { id: 'crtsh', name: 'crt.sh', description: 'Certificate Transparency', category: 'infra', url: 'https://crt.sh/?q=' },
  { id: 'shodan', name: 'Shodan', description: 'Device / banner search', category: 'infra', url: 'https://www.shodan.io/search?query=' },
  { id: 'censys', name: 'Censys', description: 'Internet scan data', category: 'infra', url: 'https://search.censys.io/search?resource=hosts&q=' },
  { id: 'hibp', name: 'Have I Been Pwned', description: 'Email breach check', category: 'breach', url: 'https://haveibeenpwned.com/account/' },
  { id: 'virustotal', name: 'VirusTotal', description: 'URL / domain / IP reputation', category: 'infra', url: 'https://www.virustotal.com/gui/search/' },
  { id: 'urlscan', name: 'urlscan.io', description: 'URL scan', category: 'infra', url: 'https://urlscan.io/search/#' },
  { id: 'archive', name: 'Archive.today', description: 'Page snapshot', category: 'archive', url: 'https://archive.ph/?run=1&url=' },
  { id: 'wayback', name: 'Wayback Machine', description: 'Historical snapshots', category: 'archive', url: 'https://web.archive.org/web/*/' },
];

export const SHODAN_QUERIES = [
  { label: 'Apache servers', query: 'apache', hint: 'product:Apache' },
  { label: 'Open RDP', query: 'port:3389', hint: 'Remote Desktop' },
  { label: 'Webcam', query: 'webcam', hint: 'title:camera' },
  { label: 'MongoDB open', query: 'product:MongoDB', hint: 'port:27017' },
];

export function toolsForQuery(q: string): OsintTool[] {
  return OSINT_TOOLS.map((t) => ({
    ...t,
    url: t.url ? `${t.url}${encodeURIComponent(q)}` : undefined,
  }));
}

export async function shodanHostLookup(ip: string, apiKey: string): Promise<Record<string, unknown> | null> {
  if (!apiKey || !ip) return null;
  try {
    const res = await fetch(
      `https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${encodeURIComponent(apiKey)}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
