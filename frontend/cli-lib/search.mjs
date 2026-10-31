import { detectKind, validateEmailWithMx, validatePhone, dnsQuery } from './validate.mjs';

const tools = (q, kind) => {
  const enc = encodeURIComponent(q);
  const list = [
    { name: 'Google', url: `https://www.google.com/search?q=${enc}` },
    { name: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${enc}` },
    { name: 'Bing', url: `https://www.bing.com/search?q=${enc}` },
  ];
  if (kind === 'domain') {
    list.push(
      { name: 'WHOIS', url: `https://who.is/whois/${enc}` },
      { name: 'crt.sh', url: `https://crt.sh/?q=${enc}` },
      { name: 'SecurityTrails', url: `https://securitytrails.com/domain/${enc}/dns` },
      { name: 'Shodan', url: `https://www.shodan.io/search?query=hostname:${enc}` },
      { name: 'VirusTotal', url: `https://www.virustotal.com/gui/domain/${enc}` },
    );
  }
  if (kind === 'ip') {
    list.push(
      { name: 'Shodan Host', url: `https://www.shodan.io/host/${enc}` },
      { name: 'IPinfo', url: `https://ipinfo.io/${enc}` },
      { name: 'AbuseIPDB', url: `https://www.abuseipdb.com/check/${enc}` },
      { name: 'VirusTotal', url: `https://www.virustotal.com/gui/ip-address/${enc}` },
    );
  }
  if (kind === 'email') {
    const domain = q.split('@')[1] || '';
    list.push(
      { name: 'HIBP', url: `https://haveibeenpwned.com/account/${enc}` },
      { name: 'Hunter', url: `https://hunter.io/search/${encodeURIComponent(domain)}` },
    );
  }
  if (kind === 'phone') {
    list.push({ name: 'Google phone', url: `https://www.google.com/search?q=${enc}` });
  }
  if (kind === 'general') {
    list.push(
      { name: 'WhatsMyName', url: `https://whatsmyname.app/?q=${enc}` },
      { name: 'Intelligence X', url: `https://intelx.io/?s=${enc}` },
      { name: 'Blockchair', url: `https://blockchair.com/search?q=${enc}` },
      { name: 'Archive.today', url: `https://archive.ph/?run=1&url=${enc}` },
    );
  }
  return list;
};

export async function runSearch(query) {
  const q = query.trim();
  const kind = detectKind(q);
  const result = {
    query: q,
    kind,
    validation: null,
    dns: {},
    links: tools(q, kind),
    records: [],
  };

  if (kind === 'email') result.validation = await validateEmailWithMx(q);
  else if (kind === 'phone') result.validation = validatePhone(q);

  if (kind === 'domain') {
    for (const type of ['A', 'AAAA', 'MX', 'NS', 'TXT']) {
      try {
        const data = await dnsQuery(q, type);
        const answers = (data.Answer || []).map((a) => a.data);
        result.dns[type] = answers;
        answers.forEach((d) => result.records.push({ type, data: d }));
      } catch (e) {
        result.dns[type] = { error: e.message };
      }
    }
  }
  if (kind === 'ip') result.records.push({ type: 'IP', data: q });

  if (kind === 'email' && result.validation?.details?.domain) {
    try {
      const data = await dnsQuery(result.validation.details.domain, 'MX');
      result.dns.MX = (data.Answer || []).map((a) => a.data);
    } catch { /* ignore */ }
  }
  return result;
}

export function formatSearchResult(result) {
  const lines = [];
  lines.push(`Query: ${result.query}`);
  lines.push(`Type:  ${result.kind}`);
  if (result.validation) {
    const v = result.validation;
    lines.push(`Valid: ${v.ok ? 'YES' : 'NO'}  normalized=${v.normalized || '—'}`);
    if (v.errors?.length) lines.push(`Errors: ${v.errors.join(', ')}`);
    if (v.warnings?.length) lines.push(`Warn:   ${v.warnings.join(', ')}`);
    if (v.details?.mx) lines.push(`MX:     ${v.details.mx}`);
    if (v.details?.regionHint) lines.push(`Region: ${v.details.regionHint}`);
  }
  if (result.records?.length) {
    lines.push('DNS / records:');
    result.records.slice(0, 20).forEach((r) => lines.push(`  [${r.type}] ${r.data}`));
  }
  lines.push('OSINT links:');
  result.links.forEach((l) => lines.push(`  ${l.name}: ${l.url}`));
  return lines.join('\n');
}
