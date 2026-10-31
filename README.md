# ARGUS

Interactive investigation graph for cyber and OSINT analysis.

**Author:** [sellmetadone](https://github.com/sellmetadone)  
**Telegram:** [@sofia_white_death](https://t.me/sofia_white_death)  
**Channel:** [t.me/argus_platform](https://t.me/argus_platform)

Argus links infrastructure and identity entities on a visual graph: domains, IPs, certificates, people, emails, phones, organizations, and related types. Cases are stored locally in the browser. A terminal shell supports search workflows alongside the web UI.

## Features

- **Investigation graph** — React Flow canvas with multi-side connection handles, edge styles and variants
- **Cases** — create, rename, clear, and delete investigation cases
- **Entities and relationships** — typed model with confidence and source metadata
- **Undo / redo** — snapshot history for structural graph changes and node moves
- **Search panel** — DNS lookup via Cloudflare DoH, links to external OSINT tools
- **Email / phone validation** — format checks, disposable-domain hints, optional MX lookup
- **Maltego-oriented export** — GraphML and CSV interchange helpers
- **Settings** — theme, language (15 locales), graph colors, focus mode, layout presets
- **CLI** — `npm run argus`: open browser, console search, or language selection
- **Local persistence** — case snapshots in `localStorage`

## Stack

- React 19 + TypeScript · Vite 6 · Zustand · React Flow (`@xyflow/react`) · Node.js CLI

## Requirements

- **Node.js 20+** (LTS recommended)
- npm 10+

## Install & run

```bash
# 1. Clone or download ZIP and unpack
cd ARGUS-main/frontend   # or ARGUS/frontend

npm install
npm run dev
```

Open the URL printed by Vite, usually:

- **http://127.0.0.1:3030**

If port 3030 is busy, Vite will pick the next free port — **read the terminal output**.

### CLI menu

```bash
cd frontend
npm run argus
```

Windows: double-click `START_ARGUS.bat` in the repository root.

### If the page is blank

1. Open the browser **DevTools → Console** (F12) and send any red error text.
2. Confirm you are in the **`frontend`** folder (where `package.json` is) before `npm install` / `npm run dev`.
3. Try another port: `npx vite --port 5173 --host 127.0.0.1`
4. Hard refresh: Ctrl+Shift+R

## Configuration

`frontend/argus.config.json` — `port` (default 3030), language, theme.  
Optional Shodan API key: Settings panel → stored only in browser `localStorage`.

## License

MIT — see [LICENSE](LICENSE).

---

© ARGUS · author **sellmetadone** · Telegram [@sofia_white_death](https://t.me/sofia_white_death) · [argus_platform](https://t.me/argus_platform)
