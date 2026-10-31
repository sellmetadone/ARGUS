/**
 * Email & phone validation for Argus
 * - Format checks (RFC-inspired / E.164-inspired)
 * - Disposable-email heuristics
 * - Optional live MX lookup (Cloudflare DoH)
 */

export type ValidationResult = {
  ok: boolean;
  value: string;
  normalized?: string;
  kind: 'email' | 'phone' | 'unknown';
  errors: string[];
  warnings: string[];
  details: Record<string, string | number | boolean | null>;
};

const DISPOSABLE_DOMAINS = new Set(
  [
    'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', '10minutemail.com',
    'tempmail.com', 'throwaway.email', 'yopmail.com', 'trashmail.com', 'getnada.com',
    'temp-mail.org', 'fakeinbox.com', 'sharklasers.com', 'mailnesia.com', 'maildrop.cc',
    'discard.email', 'tmpmail.org', 'tmpmail.net',
  ].map((d) => d.toLowerCase())
);

export function validateEmail(input: string, opts?: { checkDisposable?: boolean }): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const raw = (input || '').trim();
  const details: ValidationResult['details'] = {};

  if (!raw) {
    return { ok: false, value: raw, kind: 'email', errors: ['empty'], warnings, details };
  }

  if (raw.length > 254) errors.push('email_too_long');

  const at = raw.lastIndexOf('@');
  if (at < 1 || at === raw.length - 1) {
    errors.push('missing_at_or_domain');
    return { ok: false, value: raw, kind: 'email', errors, warnings, details };
  }

  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1).toLowerCase();
  details.local = local;
  details.domain = domain;

  if (local.length > 64) errors.push('local_part_too_long');
  if (local.startsWith('.') || local.endsWith('.')) errors.push('local_dot_edge');
  if (local.includes('..')) errors.push('local_consecutive_dots');
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) errors.push('local_invalid_chars');
  if (!/^[a-z0-9.-]+$/i.test(domain)) errors.push('domain_invalid_chars');
  if (domain.startsWith('-') || domain.endsWith('-') || domain.startsWith('.') || domain.endsWith('.')) {
    errors.push('domain_edge');
  }
  if (domain.includes('..')) errors.push('domain_consecutive_dots');
  if (!domain.includes('.')) errors.push('domain_no_tld');
  const labels = domain.split('.');
  if (labels.some((l) => !l || l.length > 63)) errors.push('domain_label_length');
  const tld = labels[labels.length - 1];
  if (tld && tld.length < 2) errors.push('tld_too_short');

  if (opts?.checkDisposable !== false && DISPOSABLE_DOMAINS.has(domain)) {
    warnings.push('disposable_domain');
    details.disposable = true;
  }

  const normalized = `${local}@${domain}`;
  const ok = errors.length === 0;
  return { ok, value: raw, normalized: ok ? normalized : undefined, kind: 'email', errors, warnings, details };
}

export function validatePhone(input: string, opts?: { defaultRegion?: string }): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const raw = (input || '').trim();
  const details: ValidationResult['details'] = {
    defaultRegion: opts?.defaultRegion || null,
  };

  if (!raw) {
    return { ok: false, value: raw, kind: 'phone', errors: ['empty'], warnings, details };
  }

  const hasPlus = raw.trim().startsWith('+');
  const digits = raw.replace(/\D/g, '');
  details.digitCount = digits.length;
  details.hasPlus = hasPlus;

  if (digits.length < 8) errors.push('too_short');
  if (digits.length > 15) errors.push('too_long_e164');
  if (/[a-zA-Z]/.test(raw.replace(/\s/g, ''))) errors.push('contains_letters');

  let e164: string | undefined;
  if (hasPlus && digits.length >= 8 && digits.length <= 15) {
    e164 = `+${digits}`;
    details.format = 'e164';
  } else if (!hasPlus && digits.length >= 10 && digits.length <= 15) {
    warnings.push('missing_country_code');
    e164 = digits;
    details.format = 'national';
  } else if (!hasPlus && digits.length >= 8 && digits.length < 10) {
    warnings.push('possibly_local_extension');
    details.format = 'local';
    e164 = digits;
  }

  if (hasPlus) {
    if (digits.startsWith('1') && digits.length === 11) details.regionHint = 'NANP';
    else if (digits.startsWith('7') && digits.length === 11) details.regionHint = 'RU/KZ';
    else if (digits.startsWith('380') && digits.length === 12) details.regionHint = 'UA';
    else if (digits.startsWith('49') && digits.length >= 11) details.regionHint = 'DE';
    else if (digits.startsWith('44') && digits.length >= 11) details.regionHint = 'UK';
    else if (digits.startsWith('86') && digits.length >= 12) details.regionHint = 'CN';
  }

  const ok = errors.length === 0;
  return {
    ok,
    value: raw,
    normalized: ok ? e164 : undefined,
    kind: 'phone',
    errors,
    warnings,
    details,
  };
}

export function detectAndValidate(input: string): ValidationResult {
  const s = input.trim();
  if (s.includes('@')) return validateEmail(s);
  const digitRatio = s.replace(/\D/g, '').length / Math.max(s.length, 1);
  if (digitRatio > 0.5 && s.replace(/\D/g, '').length >= 8) return validatePhone(s);
  return {
    ok: false,
    value: s,
    kind: 'unknown',
    errors: ['not_email_or_phone'],
    warnings: [],
    details: {},
  };
}

export async function validateEmailWithMx(input: string): Promise<ValidationResult> {
  const base = validateEmail(input);
  if (!base.ok || !base.details.domain) return base;

  try {
    const domain = String(base.details.domain);
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`;
    const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
    if (!res.ok) {
      base.warnings.push('mx_lookup_failed');
      return base;
    }
    const data = await res.json();
    const answers = data?.Answer || [];
    const mx = answers
      .filter((a: { type?: number }) => a.type === 15)
      .map((a: { data?: string }) => String(a.data || '').replace(/^\d+\s+/, '').replace(/\.$/, ''));
    base.details.mxCount = mx.length;
    base.details.mx = mx.slice(0, 5).join(', ') || null;
    if (mx.length === 0) {
      base.warnings.push('no_mx_records');
    }
  } catch {
    base.warnings.push('mx_lookup_error');
  }
  return base;
}
