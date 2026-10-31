import { useState } from 'react';
import { Bot } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { loadAiConfig, saveAiConfig, checkOllama, buildCaseSummaryPrompt, generateLocal, type AiConfig, type AiProviderStatus } from '../../services/intelligence/aiService';
import { computeMetrics } from '../../services/intelligence/graphIntelligence';

export default function AiAssistantPanel() {
  const { activeCaseId, cases, getEntitiesForCase, getRelationshipsForCase, appearance } = useStore();
  const [cfg, setCfg] = useState<AiConfig>(() => loadAiConfig());
  const [status, setStatus] = useState<AiProviderStatus | null>(null);
  const [preview, setPreview] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const panelBg = appearance.theme === 'light' ? '#fff' : '#0f172a';
  const update = (partial: Partial<AiConfig>) => setCfg(saveAiConfig(partial));
  const probe = async () => setStatus(await checkOllama(cfg.baseUrl));
  const prepare = () => {
    if (!activeCaseId) return;
    const entities = getEntitiesForCase(activeCaseId);
    const relationships = getRelationshipsForCase(activeCaseId);
    const c = cases.find((x) => x.id === activeCaseId);
    const m = computeMetrics({ entities, relationships });
    const p = buildCaseSummaryPrompt({ caseName: c?.name || activeCaseId, entityCount: entities.length, relationshipCount: relationships.length, topLabels: entities.slice(0, 12).map((e) => e.label), graphMetrics: `nodes=${m.nodeCount} edges=${m.edgeCount} density=${m.density}` });
    setPreview(`SYSTEM:\n${p.system}\n\nUSER (${p.approxChars} chars):\n${p.user}`);
    setConsent(false); setOutput('');
  };
  const run = async () => {
    if (!consent || !activeCaseId) return;
    setBusy(true); setOutput('');
    const entities = getEntitiesForCase(activeCaseId);
    const relationships = getRelationshipsForCase(activeCaseId);
    const c = cases.find((x) => x.id === activeCaseId);
    const m = computeMetrics({ entities, relationships });
    const p = buildCaseSummaryPrompt({ caseName: c?.name || activeCaseId, entityCount: entities.length, relationshipCount: relationships.length, topLabels: entities.slice(0, 12).map((e) => e.label), graphMetrics: `nodes=${m.nodeCount} edges=${m.edgeCount}` });
    const res = await generateLocal(p, cfg);
    setBusy(false);
    setOutput(res.ok ? res.text : `Error: ${res.error}`);
  };
  return (
    <div style={{ width: 360, background: panelBg, borderLeft: '1px solid #1e293b', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e293b', fontWeight: 600, fontSize: 13 }}><Bot size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Local AI Assistant</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, fontSize: 12, color: '#94a3b8' }}>
        <p style={{ marginBottom: 12 }}>Optional. Uses only local Ollama. Disabled by default. AI cannot change case data.</p>
        <label style={row}><input type="checkbox" checked={cfg.enabled} onChange={(e) => update({ enabled: e.target.checked })} />Enable AI module</label>
        <label style={{ display: 'block', marginTop: 8 }}>API base URL<input value={cfg.baseUrl} onChange={(e) => update({ baseUrl: e.target.value })} style={inp} /></label>
        <label style={{ display: 'block', marginTop: 8 }}>Model<input value={cfg.model} onChange={(e) => update({ model: e.target.value })} style={inp} /></label>
        <button type="button" onClick={probe} style={btn}>Check Ollama</button>
        {status && <div style={{ marginTop: 8, fontSize: 11 }}>{status.reachable ? `Reachable. Models: ${status.models.join(', ') || '(none)'}` : `Unreachable: ${status.error}`}</div>}
        <button type="button" onClick={prepare} style={{ ...btn, marginTop: 12 }} disabled={!activeCaseId}>Preview data sent to model</button>
        {preview && <pre style={{ marginTop: 8, padding: 8, background: '#1e293b', borderRadius: 6, fontSize: 10, whiteSpace: 'pre-wrap', color: '#cbd5e1', maxHeight: 160, overflow: 'auto' }}>{preview}</pre>}
        <label style={{ ...row, marginTop: 10 }}><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I allow sending the previewed text to local Ollama</label>
        <button type="button" onClick={run} style={btn} disabled={!cfg.enabled || !consent || busy}>{busy ? 'Generating…' : 'Generate summary draft'}</button>
        {output && <pre style={{ marginTop: 12, padding: 8, background: '#1e293b', borderRadius: 6, fontSize: 11, whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{output}</pre>}
      </div>
    </div>
  );
}
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0' };
const inp: React.CSSProperties = { display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 12, boxSizing: 'border-box' };
const btn: React.CSSProperties = { marginTop: 8, padding: '6px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid #4f46e5', borderRadius: 6, color: '#c7d2fe', cursor: 'pointer', fontSize: 12 };
