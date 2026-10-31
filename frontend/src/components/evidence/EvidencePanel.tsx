import { useEffect, useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { listEvidence, createEvidence, updateEvidence, removeEvidence, assessmentNote, type EvidenceItem, type VerificationStatus, type EvidenceKind } from '../../services/intelligence/evidenceService';

export default function EvidencePanel() {
  const { activeCaseId, selectedEntityId, appearance } = useStore();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [kind, setKind] = useState<EvidenceKind>('url');
  const reload = () => setItems(activeCaseId ? listEvidence(activeCaseId) : []);
  useEffect(() => { reload(); }, [activeCaseId]);
  const add = () => {
    if (!activeCaseId || !title.trim()) return;
    createEvidence({ caseId: activeCaseId, kind, title: title.trim(), content: content.trim(), verification: 'unverified', sourceReliability: 'unknown', claimCredibility: 'unknown', conclusionSupport: 'none', entityIds: selectedEntityId ? [selectedEntityId] : [], eventIds: [] });
    setTitle(''); setContent(''); reload();
  };
  const panelBg = appearance.theme === 'light' ? '#fff' : '#0f172a';
  return (
    <div style={{ width: 340, background: panelBg, borderLeft: '1px solid #1e293b', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e293b', fontWeight: 600, fontSize: 13 }}><FileText size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Evidence Manager</div>
      <div style={{ padding: 12, borderBottom: '1px solid #1e293b', fontSize: 12 }}>
        <div style={{ color: '#64748b', marginBottom: 8 }}>URL presence does not confirm a claim. Set reliability and verification explicitly.</div>
        <select value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)} style={inp}><option value="url">URL</option><option value="note">Note</option><option value="file">File</option><option value="quote">Quote</option><option value="other">Other</option></select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={{ ...inp, marginTop: 6 }} />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="URL, path, or text" rows={2} style={{ ...inp, marginTop: 6, resize: 'vertical' }} />
        <button type="button" onClick={add} style={btn} disabled={!activeCaseId}><Plus size={12} /> Add evidence</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {items.length === 0 && <div style={{ fontSize: 12, color: '#64748b' }}>No evidence for this case.</div>}
        {items.map((item) => (
          <div key={item.id} style={{ border: '1px solid #1e293b', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{item.title}</div>
            <div style={{ color: '#94a3b8', wordBreak: 'break-all' }}>{item.content}</div>
            <div style={{ marginTop: 6, color: '#64748b', fontSize: 11 }}>{assessmentNote(item)}</div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(['unverified', 'pending', 'corroborated', 'disputed', 'refuted'] as VerificationStatus[]).map((v) => (
                <button key={v} type="button" onClick={() => { updateEvidence(item.id, { verification: v }, 'verification_change'); reload(); }} style={{ ...chip, borderColor: item.verification === v ? '#6366f1' : '#334155', color: item.verification === v ? '#c7d2fe' : '#94a3b8' }}>{v}</button>
              ))}
            </div>
            <button type="button" onClick={() => { removeEvidence(item.id); reload(); }} style={{ ...btn, marginTop: 8, background: 'transparent', borderColor: '#7f1d1d', color: '#fca5a5' }}><Trash2 size={12} /> Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 12, boxSizing: 'border-box' };
const btn: React.CSSProperties = { marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid #4f46e5', borderRadius: 6, color: '#c7d2fe', cursor: 'pointer', fontSize: 12 };
const chip: React.CSSProperties = { padding: '2px 6px', borderRadius: 4, border: '1px solid #334155', background: 'transparent', fontSize: 10, cursor: 'pointer' };
