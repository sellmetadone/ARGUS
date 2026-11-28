import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  loadAiConfig,
  saveAiConfig,
  checkOllama,
  buildCaseSummaryPrompt,
  generateLocal,
  type AiConfig,
  type AiProviderStatus,
} from '../../services/intelligence/aiService';
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
    setConsent(false);
    setOutput('');
  };
  const run = async () => {
    if (!consent || !activeCaseId) return;
    setBusy(true);
    setOutput('');
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
    <div className="argus-side-panel md-sheet-enter ai-panel">
      <header className="argus-side-panel__header">
        <span className="argus-side-panel__title md-label-medium">
          <Bot size={16} style={{ marginRight: 8, verticalAlign: -3 }} />
          {t('ai_title')}
        </span>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPanel('ai', false)} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div className="argus-side-panel__body md-stagger">
        <p className="md-muted md-stagger-item">{t('ai_intro')}</p>
        <label className="md-switch-row md-stagger-item">
          <span>{t('ai_enable')}</span>
          <input type="checkbox" className="md-switch" checked={cfg.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
        </label>
        <label className="md-field-label" htmlFor="ai-base">{t('ai_base')}</label>
        <input id="ai-base" className="md-select" value={cfg.baseUrl} onChange={(e) => update({ baseUrl: e.target.value })} />
        <label className="md-field-label" htmlFor="ai-model">{t('ai_model')}</label>
        <input id="ai-model" className="md-select" value={cfg.model} onChange={(e) => update({ model: e.target.value })} />
        <button type="button" className="btn btn-outlined" onClick={probe}>{t('ai_check')}</button>
        {status && (
          <div className="md-muted" style={{ fontSize: 11 }}>
            {status.reachable
              ? `${t('ai_ok')}: ${status.models.join(', ') || '(none)'}`
              : `${t('ai_fail')}: ${status.error}`}
          </div>
        )}
        <button type="button" className="btn btn-outlined" onClick={prepare} disabled={!activeCaseId}>{t('ai_preview')}</button>
        {preview && <pre className="md-stagger-item" style={{ padding: 8, background: 'var(--md-sys-color-surface-container-highest, var(--bg))', borderRadius: 8, fontSize: 10, whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{preview}</pre>}
        <label className="md-switch-row">
          <span>{t('ai_consent')}</span>
          <input type="checkbox" className="md-switch" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        </label>
        <button type="button" className="btn btn-filled" onClick={run} disabled={!cfg.enabled || !consent || busy}>
          {busy ? t('ai_busy') : t('ai_run')}
        </button>
        {output && <pre style={{ padding: 8, background: 'var(--md-sys-color-surface-container-highest, var(--bg))', borderRadius: 8, fontSize: 11, whiteSpace: 'pre-wrap' }}>{output}</pre>}
      </div>
    </div>
  );
}
