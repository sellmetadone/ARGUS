import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useT } from '../../i18n/useT';
import { OSINT_TOOLS, SHODAN_QUERIES } from '../../services/osintTools';

export default function TutorialPanel() {
  const t = useT();
  const { setPanel, appearance } = useStore();

  return (
    <div className="argus-side-panel md-sheet-enter tutorial-panel">
      <header className="argus-side-panel__header">
        <span className="argus-side-panel__title md-label-medium">{t('tutorial') || 'Tutorial'}</span>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPanel('tutorial', false)} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div className="argus-side-panel__body md-stagger">
        <div style={{ flex: 1, overflowY: 'auto', padding: 4, fontSize: 13, color: 'var(--md-sys-color-on-surface, var(--text))', lineHeight: 1.55 }}>
          <H>1. Graph investigation</H>
          <p>
            Nodes are <b>Entity</b> (domain, IP, person…). Edges are <b>Relationship</b>.
            Create a case → add entities manually or via Search / transforms.
          </p>

          <H>2. Basic OSINT cycle</H>
          <ol style={{ paddingLeft: 18, margin: '8px 0' }}>
            <li>Seed: domain / email / IP / username</li>
            <li>DNS + WHOIS + Certificate Transparency</li>
            <li>IP → ASN, hosting, open ports (Shodan/Censys)</li>
            <li>Email → breaches, related domains</li>
            <li>Merge on one graph, look for shared nodes</li>
          </ol>

          <H>3. Shodan</H>
          <p>
            Shodan indexes service banners (ports/devices). Filters:{' '}
            <code>port:</code> <code>product:</code> <code>country:</code> <code>org:</code>
          </p>
          <p className="md-muted" style={{ fontSize: 12 }}>
            In Argus: Search → Shodan queries. API key in Settings for host lookup.
          </p>

          {SHODAN_QUERIES.slice(0, 8).map((q) => (
            <button
              key={q.query}
              type="button"
              className="md-result-card"
              style={{ width: '100%', textAlign: 'left', marginBottom: 6, cursor: 'pointer', border: '1px solid var(--md-sys-color-outline-variant, var(--border))' }}
              onClick={() => window.open(`https://www.shodan.io/search?query=${encodeURIComponent(q.query)}`, '_blank')}
            >
              <div className="md-result-card__title" style={{ color: appearance.accentColor }}>{q.label}</div>
              <code className="md-result-card__meta">{q.query}</code>
              <div className="md-muted" style={{ fontSize: 10 }}>{q.hint}</div>
            </button>
          ))}

          <H>4. Tools in Argus</H>
          <ul style={{ paddingLeft: 18, margin: '8px 0', fontSize: 12 }}>
            {OSINT_TOOLS.slice(0, 12).map((tool) => (
              <li key={tool.id}>
                <b>{tool.name}</b> — {tool.description}
              </li>
            ))}
          </ul>

          <H>5. CLI</H>
          <p style={{ fontSize: 12 }}>
            <code>npm run argus</code> — menu: browser · console search · language.
          </p>
          <H>6. Ethics</H>
          <p className="md-muted" style={{ fontSize: 12 }}>
            Use only for lawful purposes: own assets, in-scope bug bounty, open data, authorized investigations.
          </p>
        </div>
      </div>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="md-section__title" style={{ margin: '16px 0 8px', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>
      {children}
    </h3>
  );
}
