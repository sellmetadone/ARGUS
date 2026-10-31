/**
 * Local AI Assistant — optional Ollama integration.
 * App works fully without this module. No automatic cloud uploads.
 */
export type AiConfig = {
  enabled: boolean;
  baseUrl: string;
  model: string;
  maxContextChars: number;
};

export type AiProviderStatus = {
  reachable: boolean;
  models: string[];
  error?: string;
};

export type AiPromptPreview = {
  system: string;
  user: string;
  approxChars: number;
};

const DEFAULT: AiConfig = {
  enabled: false,
  baseUrl: 'http://127.0.0.1:11434',
  model: 'llama3.2',
  maxContextChars: 8000,
};

const CFG_KEY = 'argus.ai.config';

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveAiConfig(cfg: Partial<AiConfig>): AiConfig {
  const next = { ...loadAiConfig(), ...cfg };
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export async function checkOllama(baseUrl?: string): Promise<AiProviderStatus> {
  const url = (baseUrl || loadAiConfig().baseUrl).replace(/\/$/, '');
  try {
    const res = await fetch(`${url}/api/tags`, { method: 'GET' });
    if (!res.ok) {
      return { reachable: false, models: [], error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const models = Array.isArray(data.models)
      ? data.models.map((m: { name?: string }) => m.name || '').filter(Boolean)
      : [];
    return { reachable: true, models };
  } catch (e) {
    return {
      reachable: false,
      models: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function buildCaseSummaryPrompt(payload: {
  caseName: string;
  entityCount: number;
  relationshipCount: number;
  topLabels: string[];
  graphMetrics?: string;
}): AiPromptPreview {
  const system =
    'You are an OSINT analysis assistant. Mark every inference as unconfirmed. Never invent sources. Never claim identity resolution. Reply in the user language.';
  const user = [
    `Case: ${payload.caseName}`,
    `Entities: ${payload.entityCount}, relationships: ${payload.relationshipCount}`,
    `Sample labels: ${payload.topLabels.join(', ')}`,
    payload.graphMetrics ? `Graph metrics: ${payload.graphMetrics}` : '',
    'Write a short neutral summary of the graph structure and suggest next investigative questions. Do not treat hypotheses as facts.',
  ]
    .filter(Boolean)
    .join('\n');
  return { system, user, approxChars: system.length + user.length };
}

export function truncateContext(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n…[truncated for safety]';
}

/**
 * Call local Ollama generate API. Caller must show preview and get user consent first.
 */
export async function generateLocal(
  prompt: AiPromptPreview,
  cfg?: AiConfig
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const c = cfg || loadAiConfig();
  if (!c.enabled) return { ok: false, error: 'AI module is disabled' };
  const url = c.baseUrl.replace(/\/$/, '') + '/api/generate';
  const body = {
    model: c.model,
    stream: false,
    system: prompt.system,
    prompt: truncateContext(prompt.user, c.maxContextChars),
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { ok: false, error: `Ollama HTTP ${res.status}` };
    }
    const data = await res.json();
    const text = String(data.response || data.message || '').trim();
    if (!text) return { ok: false, error: 'Empty model response' };
    return {
      ok: true,
      text:
        text +
        '\n\n—\n[ARGUS] Model output is unconfirmed. Review before any case change. AI cannot modify case data without your explicit action.',
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
