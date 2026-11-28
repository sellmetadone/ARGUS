import { useEffect, useState } from 'react';
import { FileText, Plus, Trash2, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { listEvidence, createEvidence, updateEvidence, removeEvidence, assessmentNote, type EvidenceItem, type VerificationStatus, type EvidenceKind } from '../../services/intelligence/evidenceService';
import { useT } from '../../i18n/useT';

export default function EvidencePanel() {
  const t = useT();
  const { activeCaseId, selectedEntityId, setPanel } = useStore();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [kind, setKind] = useState<EvidenceKind>('url');
  const reload = () => setItems(activeCaseId ? listEvidence(activeCaseId) : []);
  useEffect(() => { reload(); }, [activeCaseId]);
  const add = () => {
    if (!activeCaseId || !title.trim()) return;
    createEvidence({
      caseId: activeCaseId,
      kind,
      title: title.trim(),
      content: content.trim(),
      verification: 'unverified',
      sourceReliability: 'unknown',
      claimCredibility: 'unknown',
      conclusionSupport: 'none',
      entityIds: selectedEntityId ? [selectedEntityId] : [],
      eventIds: [],
    });
    setTitle(''); setContent(''); reload();
  };

  return (
    <div className="argus-side-panel md-sheet-enter evidence-panel">
      <header className="argus-side-panel__header">
        <span className="argus-side-panel__title md-label-medium">
          <FileText size={16} style={{ marginRight: 8, verticalAlign: -3 }} />
          {t('evidence')}
        </span>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPanel('evidence', false)} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div className="argus-side-panel__body md-stagger">
        <p className="md-muted md-stagger-item">{t('evidence_disclaimer')}</p>
        <section className="md-section md-stagger-item">
          <h3 className="md-section__title">{t('evidence_add') || 'Add evidence'}</h3>
          <div className="md-section__body">
            <select className="md-select" value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)}>
              <option value="url">URL</option>
              <option value="note">Note</option>
              <option value="file">File</option>
              <option value="quote">Quote</option>
              <option value="other">Other</option>
            </select>
            <input className="md-select" placeholder={t('evidence_title') || 'Title'} value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="md-select" rows={3} placeholder={t('evidence_content') || 'Content / URL'} value={content} onChange={(e) => setContent(e.target.value)} style={{ minHeight: 72, resize: 'vertical' }} />
            <button type="button" className="btn btn-filled" onClick={add} disabled={!activeCaseId || !title.trim()}>
              <Plus size={14} /> {t('add') || 'Add'}
            </button>
          </div>
        </section>
        <section className="md-section md-stagger-item">
          <h3 className="md-section__title">{t('evidence_list') || 'Items'} ({items.length})</h3>
          <ul className="md-result-list">
            {items.length === 0 && <li className="md-muted">{t('evidence_empty') || 'No evidence yet'}</li>}
            {items.map((item) => (
              <li key={item.id} className="md-result-card">
                <div className="md-result-card__main">
                  <div className="md-result-card__title">{item.title}</div>
                  <div className="md-result-card__meta">{item.kind} · {item.verification}</div>
                  {item.content ? <div className="md-result-card__snippet">{item.content.slice(0, 120)}</div> : null}
                  <div className="md-chip-row" style={{ marginTop: 8 }}>
                    {(['unverified', 'corroborated', 'disputed', 'rejected'] as VerificationStatus[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`md-chip ${item.verification === v ? 'is-selected' : ''}`}
                        onClick={() => { updateEvidence(item.id, { verification: v }); reload(); }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="md-muted" style={{ marginTop: 6, marginBottom: 0, fontSize: 11 }}>
                    {assessmentNote(item)}
                  </p>
                </div>
                <div className="md-result-card__actions">
                  <button type="button" className="btn btn-ghost btn-icon btn-danger" title="Delete" onClick={() => { removeEvidence(item.id); reload(); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
