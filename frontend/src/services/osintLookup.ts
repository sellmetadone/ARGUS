/** Real lookups that work from the browser (CORS-friendly where possible). */

export type LookupHit = {
  id: string;
  title: string;
  type: string;
  snippet: string;
  source: string;
  confidence: number;
  category: 'infra' | 'identity' | 'doc' | 'osint' | 'live';
  url?: string;
  addable: boolean;
};

function detectKind(q: string): 'email' | 'phone' | 'ip' | 'domain' | 'general' {
  const s = q.trim();
  if (/^[\w.+-]+@[\w.-]+\.\w{2,}$/i.test(s)) return 'email';
  if (/^\+?[\d\s().-]{8,}$/.test(s) && /\d{5,}/.test(s)) return 'phone';
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) return 'ip';
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s) && !s.includes(' ')) return 'domain';
  return 'general';
}

async function dnsQuery(name: string, type: string): Promise<any> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!res.ok) throw new Error(`DNS ${type} failed`);
  return res.json();
}

/** Live multi-source lookup for Argus search panel */
export async function liveLookup(query: string): Promise<LookupHit[]> {
  const q = query.trim();
  if (!q) return [];
  const kind = detectKind(q);
  const hits: LookupHit[] = [];
  let n = 0;
  const id = () => `live-${++n}`;

  const tools: { title: string; url: string; source: string; type: string }[] = [
    { title: `Google: ${q}`, url: `https://www.google.com/search?q=${encodeURIComponent(q)}`, source: 'Google', type: 'url' },
    { title: `DuckDuckGo: ${q}`, url: `https://duckduckgo.com/?q=${encodeURIComponent(q)}`, source: 'DuckDuckGo', type: 'url' },
    { title: `Bing: ${q}`, url: `https://www.bing.com/search?q=${encodeURIComponent(q)}`, source: 'Bing', type: 'url' },
  ];

  if (kind === 'domain' || kind === 'general') {
    const domain = kind === 'domain' ? q : q.includes('.') ? q.split(/\s+/)[0] : '';
    if (domain && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      tools.push(
        { title: `WHOIS ${domain}`, url: `https://who.is/whois/${encodeURIComponent(domain)}`, source: 'who.is', type: 'domain' },
        { title: `crt.sh ${domain}`, url: `https://crt.sh/?q=${encodeURIComponent(domain)}`, source: 'crt.sh', type: 'certificate' },
        { title: `SecurityTrails ${domain}`, url: `https://securitytrails.com/domain/${encodeURIComponent(domain)}/dns`, source: 'SecurityTrails', type: 'domain' },
        { title: `VirusTotal ${domain}`, url: `https://www.virustotal.com/gui/domain/${encodeURIComponent(domain)}`, source: 'VirusTotal', type: 'domain' },
        { title: `urlscan ${domain}`, url: `https://urlscan.io/search/#${encodeURIComponent(domain)}`, source: 'urlscan', type: 'url' },
        { title: `Shodan ${domain}`, url: `https://www.shodan.io/search?query=hostname:${encodeURIComponent(domain)}`, source: 'Shodan', type: 'domain' },
      );

      try {
        const a = await dnsQuery(domain, 'A');
        const answers = a?.Answer || [];
        for (const ans of answers) {
          if (ans.type === 1 && ans.data) {
            hits.push({
              id: id(),
              title: ans.data,
              type: 'ip',
              snippet: `A-запись для ${domain} (TTL ${ans.TTL ?? '—'})`,
              source: 'Cloudflare DNS',
              confidence: 95,
              category: 'live',
              addable: true,
            });
          }
        }
        hits.push({
          id: id(),
          title: domain,
          type: 'domain',
          snippet: answers.length ? `DNS OK · ${answers.length} A record(s)` : 'Домен запрошен через DNS',
          source: 'Cloudflare DNS',
          confidence: 98,
          category: 'live',
          addable: true,
        });
      } catch (e) {
        hits.push({
          id: id(),
          title: domain,
          type: 'domain',
          snippet: `DNS error: ${e instanceof Error ? e.message : 'fail'} — добавьте вручную`,
          source: 'DNS',
          confidence: 40,
          category: 'infra',
          addable: true,
        });
      }

      try {
        const mx = await dnsQuery(domain, 'MX');
        for (const ans of mx?.Answer || []) {
          if (ans.data) {
            const host = String(ans.data).replace(/^\d+\s+/, '').replace(/\.$/, '');
            hits.push({
              id: id(),
              title: host,
              type: 'mx',
              snippet: `MX для ${domain}`,
              source: 'Cloudflare DNS',
              confidence: 90,
              category: 'live',
              addable: true,
            });
          }
        }
      } catch {
        /* ignore */
      }

      try {
        const ns = await dnsQuery(domain, 'NS');
        for (const ans of ns?.Answer || []) {
          if (ans.data) {
            hits.push({
              id: id(),
              title: String(ans.data).replace(/\.$/, ''),
              type: 'nameserver',
              snippet: `NS для ${domain}`,
              source: 'Cloudflare DNS',
              confidence: 90,
              category: 'live',
              addable: true,
            });
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (kind === 'ip') {
    tools.push(
      { title: `Shodan ${q}`, url: `https://www.shodan.io/host/${encodeURIComponent(q)}`, source: 'Shodan', type: 'ip' },
      { title: `VirusTotal ${q}`, url: `https://www.virustotal.com/gui/ip-address/${encodeURIComponent(q)}`, source: 'VirusTotal', type: 'ip' },
      { title: `IP info ${q}`, url: `https://ipinfo.io/${encodeURIComponent(q)}`, source: 'ipinfo.io', type: 'ip' },
    );
    hits.push({
      id: id(),
      title: q,
      type: 'ip',
      snippet: 'IPv4 — можно добавить в граф',
      source: 'Input',
      confidence: 100,
      category: 'live',
      addable: true,
    });
  }

  if (kind === 'email') {
    const domain = q.split('@')[1];
    tools.push(
      { title: `Hunter domain ${domain}`, url: `https://hunter.io/search/${encodeURIComponent(domain || q)}`, source: 'Hunter', type: 'email' },
      { title: `Have I Been Pwned`, url: `https://haveibeenpwned.com/account/${encodeURIComponent(q)}`, source: 'HIBP', type: 'email' },
    );
    hits.push({
      id: id(),
      title: q,
      type: 'email',
      snippet: 'Email — добавить в граф',
      source: 'Input',
      confidence: 100,
      category: 'live',
      addable: true,
    });
    if (domain) {
      hits.push({
        id: id(),
        title: domain,
        type: 'domain',
        snippet: 'Домен из email',
        source: 'Parsed',
        confidence: 95,
        category: 'live',
        addable: true,
      });
    }
  }

  if (kind === 'phone') {
    hits.push({
      id: id(),
      title: q,
      type: 'phone',
      snippet: 'Телефон — добавить в граф',
      source: 'Input',
      confidence: 100,
      category: 'live',
      addable: true,
    });
  }

  if (kind === 'general') {
    hits.push(
      {
        id: id(),
        title: q,
        type: 'person',
        snippet: 'Как person entity',
        source: 'Manual type',
        confidence: 50,
        category: 'identity',
        addable: true,
      },
      {
        id: id(),
        title: q,
        type: 'company',
        snippet: 'Как company entity',
        source: 'Manual type',
        confidence: 50,
        category: 'identity',
        addable: true,
      },
      {
        id: id(),
        title: q,
        type: 'note',
        snippet: 'Как заметка / IOC текст',
        source: 'Manual type',
        confidence: 40,
        category: 'doc',
        addable: true,
      },
    );
  }

  for (const tool of tools) {
    hits.push({
      id: id(),
      title: tool.title,
      type: tool.type,
      snippet: 'Открыть в браузере (реальный поиск)',
      source: tool.source,
      confidence: 0,
      category: 'osint',
      url: tool.url,
      addable: false,
    });
  }

  return hits;
}

export function detectEntityType(value: string): string {
  return detectKind(value) === 'general' ? 'note' : detectKind(value);
}
