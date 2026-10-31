# ARGUS

Interactive investigation graph for cyber / OSINT analysis.

Argus links infrastructure and identity entities (domains, IPs, certificates, people, emails, phones, and related types) on a visual graph, with optional timeline, local case storage, OSINT lookup helpers, and a terminal search shell.

This repository is the application source. It is not a marketing site.

## Features

- **Investigation graph** — nodes and edges on React Flow; multi-side connection handles; edge styles (smoothstep, bezier, straight, step) and variants (solid, dashed, animated, thick)
- **Cases** — create, rename, clear, delete investigation cases
- **Entities & relationships** — typed model with confidence and source metadata
- **Undo / redo** — snapshot history for structural graph changes and node moves
- **Search panel** — manual entity add, DNS lookup via Cloudflare DoH, external OSINT tool links (WHOIS, crt.sh, Shodan pages, etc.)
- **Email / phone validation** — format checks, disposable-domain hints, optional MX lookup
- **Maltego-oriented export** — GraphML / CSV oriented for interchange; local transform stubs
- **Settings** — theme, language (15 locales), graph colors, wallpaper, focus mode, layout presets
- **CLI** — `npm run argus`: browser mode, console search, language selection; optional rainbow banner
- **Local persistence** — case snapshots in `localStorage` via `caseRepository`

## Stack

- React 19 + TypeScript
- Vite 6
- Zustand
- React Flow (`@xyflow/react`)
- Node.js CLI (`argus-cli.mjs`)

## Layout

```
frontend/          Web UI + CLI
  src/
    components/    UI panels and graph
    core/          event bus, module registry, case storage
    services/      OSINT, validation, Maltego helpers
    store/         Zustand application state
    types/         Entity and relationship types
  argus-cli.mjs    Terminal launcher / search shell
  argus.config.json
shared/            Shared type sketches
```

## Requirements

- Node.js 20+ (LTS recommended)
- npm 10+

## Install

```bash
cd frontend
npm install
```

## Run (web)

```bash
cd frontend
npm run dev
```

Open:

- http://127.0.0.1:3030/
- or http://argus.local:3030/ if `127.0.0.1 argus.local` is in your hosts file

## Run (CLI)

```bash
cd frontend
npm run argus
```

Menu:

1. Browser Argus — starts Vite and opens the UI when the port is ready
2. Console — search domain / IP / email / phone in the terminal
3. Language

One-shot search:

```bash
npm run argus -- search example.com
```

Windows: `START_ARGUS.bat` in the project root runs the same CLI entry.

## Build

```bash
cd frontend
npm run build
npm run preview
```

Optional typecheck (requires a complete `npm install`):

```bash
npm run typecheck
```

## Configuration

`frontend/argus.config.json` (CLI):

| Key | Meaning |
|-----|---------|
| `port` | Dev server port (default 3030) |
| `host` | Preferred hostname label (e.g. `argus.local`) |
| `fallbackHost` | Browser open target (default `127.0.0.1`) |
| `lang` | CLI language code |
| `shodanApiKey` | Optional; do not commit real keys |
| `rainbow` | ASCII banner animation |

Do not commit real API keys.

## Security notes

- No backend is required for the core UI; DNS/OSINT calls from the browser are limited by CORS and public endpoints.
- Case data in `localStorage` stays on the machine.
- Import only JSON you trust.

## Status

Application source is usable for local investigation workflows (graph, cases, search helpers, CLI). Module registry and case repository exist as integration layers and are partially wired.

Known limitations:

- Live multi-provider OSINT is not a full substitute for dedicated commercial platforms.
- 3D graph mode is experimental.
- Full automated test suite is not included in this tree.

## License

MIT — see [LICENSE](LICENSE).
