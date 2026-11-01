import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { loadAiConfig, saveAiConfig, checkOllama, buildCaseSummaryPrompt, generateLocal, type AiConfig, type AiProviderStatus } from '../../services/intelligence/aiService';
import { computeMetrics } from '../../services/intelligence/graphIntelligence';
import { useT } from '../../i18n/useT';

export default function AiAssistantPanel() {
  const t = useT();
  const { activeCaseId, cases, getEntitiesForCase, getRelationshipsForCase, setPanel } = useStore();
  const [cfg, setCfg] = useState<AiConfig>(() => loadAiConfig());
  const [status, setStatus] = useState<AiProviderStatus | null>(null);
  const [preview, setPreview] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const update = (partial: Partial<AiConfig>) => setCfg(saveAiConfig(partial));
  const probe = async () => setStatus(await checkOllama(cfg.baseUrl));
  const prepare = () => {
    if (!activeCaseId) return;
    const entities = getEntitiesForCase(activeCaseId);
    const relationships = getRelationshipsForCase(activeCaseId);
    const c = cases.find((x) => x.id === activeCaseId);
    const m = computeMetrics({ entities, relationships });
    const p = buildCaseSummaryPrompt({
      caseName: c?.name || activeCaseId,
      entityCount: entities.length,
      relationshipCount: relationships.length,
      topLabels: entities.slice(0, 12).map((e) => e.label),
      graphMetrics: `nodes=${m.nodeCount} edges=${m.edgeCount} density=${m.density}`,
    });
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
    const p = buildCaseSummaryPrompt({
      caseName: c?.name || activeCaseId,
      entityCount: entities.length,
      relationshipCount: relationships.length,
      topLabels: entities.slice(0, 12).map((e) => e.label),
      graphMetrics: `nodes=${m.nodeCount} edges=${m.edgeCount}`,
    });
    const res = await generateLocal(p, cfg);
    setBusy(false);
    setOutput(res.ok ? res.text : `${t('ai_error')}: ${res.error}`);
  };

  return (
    <div className="argus-panel" style={{ width: 360, background: 'var(--panel)', borderLeft: '1px solid var(--border)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'var(--text)' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><Bot size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{t('ai_title')}</span>
        <button type="button" className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setPanel('ai', false)}><X size={14} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: 12 }}>{t('ai_intro')}</p>
        <label style={row}><input type="checkbox" checked={cfg.enabled} onChange={(e) => update({ enabled: e.target.checked })} />{t('ai_enable')}</label>
        <label style={{ display: 'block', marginTop: 8 }}>{t('ai_base')}<input value={cfg.baseUrl} onChange={(e) => update({ baseUrl: e.target.value })} style={inp} /></label>
        <label style={{ display: 'block', marginTop: 8 }}>{t('ai_model')}<input value={cfg.model} onChange={(e) => update({ model: e.target.value })} style={inp} /></label>
        <button type="button" className="btn btn-secondary" onClick={probe} style={{ marginTop: 8 }}>{t('ai_check')}</button>
        {status && (
          <div style={{ marginTop: 8, fontSize: 11 }}>
            {status.reachable
              ? `${t('ai_ok')}: ${status.models.join(', ') || '(none)'}`
              : `${t('ai_fail')}: ${status.error}`}
          </div>
        )}
        <button type="button" className="btn btn-secondary" onClick={prepare} style={{ marginTop: 12 }} disabled={!activeCaseId}>{t('ai_preview')}</button>
        {preview && <pre style={{ marginTop: 8, padding: 8, background: 'var(--bg)', borderRadius: 6, fontSize: 10, whiteSpace: 'pre-wrap', color: 'var(--text)', maxHeight: 160, overflow: 'auto' }}>{preview}</pre>}
        <label style={{ ...row, marginTop: 10 }}><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{t('ai_consent')}</label>
        <button type="button" className="btn btn-primary" onClick={run} style={{ marginTop: 8 }} disabled={!cfg.enabled || !consent || busy}>
          {busy ? t('ai_busy') : t('ai_run')}
        </button>
        {output && <pre style={{ marginTop: 12, padding: 8, background: 'var(--bg)', borderRadius: 6, fontSize: 11, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{output}</pre>}
      </div>
    </div>
  );
}

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' };
const inp: React.CSSProperties = { display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, boxSizing: 'border-box' };
