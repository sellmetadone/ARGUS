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
    <div className="argus-panel" style={{ width: 340, background: 'var(--panel)', borderLeft: '1px solid var(--border)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'var(--text)' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><FileText size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{t('evidence')}</span>
        <button type="button" className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setPanel('evidence', false)}><X size={14} /></button>
      </div>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)', fontSize: 12 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{t('evidence_disclaimer')}</div>
        <select value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)} style={inp}>
          <option value="url">URL</option>
          <option value="note">Note</option>
          <option value="file">File</option>
          <option value="quote">Quote</option>
          <option value="other">Other</option>
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('evidence_title')} style={{ ...inp, marginTop: 6 }} />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('evidence_content')} rows={2} style={{ ...inp, marginTop: 6, resize: 'vertical' }} />
        <button type="button" className="btn btn-primary" onClick={add} style={{ marginTop: 8 }} disabled={!activeCaseId}><Plus size={12} /> {t('evidence_add')}</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {items.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('evidence_empty')}</div>}
        {items.map((item) => (
          <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
            <div style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>{item.content}</div>
            <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 11 }}>{assessmentNote(item)}</div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(['unverified', 'pending', 'corroborated', 'disputed', 'refuted'] as VerificationStatus[]).map((v) => (
                <button key={v} type="button" onClick={() => { updateEvidence(item.id, { verification: v }, 'verification_change'); reload(); }} className={item.verification === v ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: 10, padding: '2px 6px' }}>{v}</button>
              ))}
            </div>
            <button type="button" className="btn btn-danger" onClick={() => { removeEvidence(item.id); reload(); }} style={{ marginTop: 8 }}><Trash2 size={12} /> {t('delete')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, boxSizing: 'border-box' };
