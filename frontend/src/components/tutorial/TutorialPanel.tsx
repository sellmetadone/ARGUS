import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { OSINT_TOOLS, SHODAN_QUERIES, OSINT_CATEGORY_LABELS } from '../../services/osintTools';

export default function TutorialPanel() {
  const { setPanel, appearance } = useStore();

  return (
    <div
      style={{
        width: 400,
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: 1 }}>
          ОБУЧЕНИЕ · OSINT · SHODAN
        </span>
        <button
          onClick={() => setPanel('tutorial', false)}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>
        <H>1. Граф расследования</H>
        <p>
          Узлы — <b>Entity</b> (domain, IP, person…). Линии — <b>Relationship</b>.
          Создайте кейс → добавьте сущности вручную или через Search / Maltego transforms.
        </p>

        <H>2. Базовый OSINT-цикл</H>
        <ol style={{ paddingLeft: 18, margin: '8px 0' }}>
          <li>Seed: domain / email / IP / username</li>
          <li>DNS + WHOIS + Certificate Transparency</li>
          <li>IP → ASN, hosting, open ports (Shodan/Censys)</li>
          <li>Email → breaches, related domains</li>
          <li>Свести всё на один граф, искать общие узлы</li>
        </ol>

        <H>3. Shodan — поиск устройств</H>
        <p>
          <b>Shodan</b> индексирует баннеры сервисов в интернете (не «сайты», а порты/устройства):
          камеры, роутеры, БД, промышленные контроллеры, веб-панели.
        </p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Фильтры: <code>port:</code> <code>product:</code> <code>country:</code> <code>org:</code>{' '}
          <code>hostname:</code> <code>http.title:</code> <code>ssl.cert.subject.cn:</code>
        </p>
        <p style={{ fontSize: 12 }}>
          В Argus: Search → Shodan-запросы / Open в shodan.io. API key (Settings) — для host lookup.
        </p>

        {SHODAN_QUERIES.slice(0, 8).map((q) => (
          <button
            key={q.query}
            type="button"
            onClick={() => window.open(`https://www.shodan.io/search?query=${encodeURIComponent(q.query)}`, '_blank')}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 10px',
              marginBottom: 6,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600, color: appearance.accentColor }}>{q.label}</div>
            <code style={{ fontSize: 10, color: '#94a3b8' }}>{q.query}</code>
            <div style={{ fontSize: 10, color: '#64748b' }}>{q.hint}</div>
          </button>
        ))}

        <H>4. Инструменты в Argus</H>
        <ul style={{ paddingLeft: 18, margin: '8px 0', fontSize: 12 }}>
          {OSINT_TOOLS.slice(0, 12).map((t) => (
            <li key={t.id}>
              <b>{t.name}</b> — {t.description}
            </li>
          ))}
          <li>…и другие в панели Search</li>
        </ul>

        <H>5. Расширенный OSINT-стек</H>
        <p style={{ fontSize: 12 }}>
          Username (Maigret / Sherlock / WhatsMyName), метаданные (ExifTool / FOCA),
          гео, reverse image, архивы, утечки, блокчейн, транспорт.
        </p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Граф: Focus mode (Obsidian), Layout force/radial/grid/hierarchy (Gephi + Linkurious).
        </p>

        <H>6. Консоль (CLI)</H>
        <p style={{ fontSize: 12 }}>
          <code>npm run argus</code> — меню: 1 браузер · 2 консольный поиск · 3 язык.
        </p>
        <H>7. Этика</H>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Используйте только легальные цели: свои активы, bug bounty в scope, открытые данные,
          санкционированные расследования.
        </p>
      </div>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 13, color: '#e2e8f0', margin: '16px 0 8px', fontWeight: 600 }}>{children}</h3>
  );
}
