const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'yopmail.com', 'trashmail.com', 'getnada.com', 'throwaway.email', 'maildrop.cc',
]);

export function validateEmail(input) {
  const errors = [];
  const warnings = [];
  const raw = (input || '').trim();
  const details = {};
  if (!raw) return { ok: false, value: raw, kind: 'email', errors: ['empty'], warnings, details };
  if (raw.length > 254) errors.push('email_too_long');
  const at = raw.lastIndexOf('@');
  if (at < 1 || at === raw.length - 1) {
    return { ok: false, value: raw, kind: 'email', errors: ['missing_at_or_domain'], warnings, details };
  }
  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1).toLowerCase();
  details.local = local;
  details.domain = domain;
  if (local.length > 64) errors.push('local_part_too_long');
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) errors.push('local_dots');
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) errors.push('local_invalid_chars');
  if (!/^[a-z0-9.-]+$/i.test(domain) || !domain.includes('.')) errors.push('domain_invalid');
  if (domain.includes('..')) errors.push('domain_dots');
  if (DISPOSABLE.has(domain)) {
    warnings.push('disposable_domain');
    details.disposable = true;
  }
  const ok = errors.length === 0;
  return { ok, value: raw, normalized: ok ? `${local}@${domain}` : undefined, kind: 'email', errors, warnings, details };
}

export function validatePhone(input) {
  const errors = [];
  const warnings = [];
  const raw = (input || '').trim();
  const details = {};
  if (!raw) return { ok: false, value: raw, kind: 'phone', errors: ['empty'], warnings, details };
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  details.digitCount = digits.length;
  details.hasPlus = hasPlus;
  if (digits.length < 8) errors.push('too_short');
  if (digits.length > 15) errors.push('too_long_e164');
  if (/[a-zA-Z]/.test(raw)) errors.push('contains_letters');
  let normalized;
  if (hasPlus && digits.length >= 8 && digits.length <= 15) {
    normalized = `+${digits}`;
    details.format = 'e164';
  } else if (digits.length >= 10) {
    warnings.push('missing_country_code');
    normalized = digits;
    details.format = 'national';
  } else {
    details.format = 'local';
    normalized = digits;
  }
  if (hasPlus) {
    if (digits.startsWith('380') && digits.length === 12) details.regionHint = 'UA';
    else if (digits.startsWith('7') && digits.length === 11) details.regionHint = 'RU/KZ';
    else if (digits.startsWith('1') && digits.length === 11) details.regionHint = 'NANP';
    else if (digits.startsWith('49')) details.regionHint = 'DE';
  }
  const ok = errors.length === 0;
  return { ok, value: raw, normalized: ok ? normalized : undefined, kind: 'phone', errors, warnings, details };
}

export function detectKind(q) {
  const s = q.trim();
  if (/^[\w.+-]+@[\w.-]+\.\w{2,}$/i.test(s)) return 'email';
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) return 'ip';
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s) && !s.includes(' ')) return 'domain';
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 8 && digits.length / Math.max(s.length, 1) > 0.5) return 'phone';
  return 'general';
}

export async function dnsQuery(name, type) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!res.ok) throw new Error(`DNS ${type} HTTP ${res.status}`);
  return res.json();
}

export async function validateEmailWithMx(input) {
  const base = validateEmail(input);
  if (!base.ok) return base;
  try {
    const data = await dnsQuery(base.details.domain, 'MX');
    const mx = (data.Answer || [])
      .filter((a) => a.type === 15)
      .map((a) => String(a.data || '').replace(/^\d+\s+/, '').replace(/\.$/, ''));
    base.details.mxCount = mx.length;
    base.details.mx = mx.slice(0, 5).join(', ') || null;
    if (!mx.length) base.warnings.push('no_mx_records');
  } catch {
    base.warnings.push('mx_lookup_error');
  }
  return base;
}
