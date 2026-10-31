# ARGUS

Interactive investigation graph for cyber and OSINT analysis.

Argus links infrastructure and identity entities on a visual graph: domains, IPs, certificates, people, emails, phones, organizations, and related types. Cases are stored locally in the browser. A terminal shell supports search workflows alongside the web UI.

This repository contains the application source only.

## Features

- **Investigation graph** — React Flow canvas with multi-side connection handles, edge styles (smoothstep, bezier, straight, step) and variants (solid, dashed, animated, thick)
- **Cases** — create, rename, clear, and delete investigation cases
- **Entities and relationships** — typed model with confidence and source metadata
- **Undo / redo** — snapshot history for structural graph changes and node moves
- **Search panel** — manual entity add, DNS lookup via Cloudflare DoH, links to external OSINT tools (WHOIS, crt.sh, Shodan pages, and others)
- **Email / phone validation** — format checks, disposable-domain hints, optional MX lookup
- **Maltego-oriented export** — GraphML and CSV interchange helpers; local transform stubs
- **Settings** — theme, language (15 locales), graph colors, wallpaper, focus mode, layout presets
- **CLI** — `npm run argus`: open browser, console search, or language selection
- **Local persistence** — case snapshots in `localStorage` through `caseRepository`

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
    services/      OSINT helpers, validation, Maltego helpers
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

## Run

Web UI (default host `0.0.0.0`, port `3030`):

```bash
cd frontend
npm run dev
```

Then open `http://127.0.0.1:3030` (or `http://argus.local:3030` if you map the host in `/etc/hosts`).

CLI menu:

```bash
cd frontend
npm run argus
```

Run both (dev server in background + CLI):

```bash
cd frontend
npm run both
```

Windows helper: `START_ARGUS.bat` in the repository root.

## Configuration

`frontend/argus.config.json`:

| Key | Meaning |
|-----|---------|
| `port` | Dev server port (default 3030) |
| `host` | Preferred hostname label |
| `fallbackHost` | Bind / open fallback (`127.0.0.1`) |
| `lang` | Default UI language code |
| `theme` | Default theme id |

Vite config binds `0.0.0.0:3030`. Optional Shodan API key is entered in Settings and stored only in browser `localStorage` (`argus_shodan_key`). Do not commit real API keys.

## Development

```bash
cd frontend
npm run typecheck
npm run build
npm run preview
```

## Architecture notes

- **UI** lives under `components/`; graph rendering is isolated in `GraphCanvas` + `EntityNode`.
- **State** is centralized in Zustand (`store/useStore.ts`) with explicit history snapshots for undo/redo.
- **Persistence** goes through `core/storage/caseRepository.ts` (localStorage index + per-case documents).
- **Modules** are registered via `core/moduleRegistry.ts` (scaffold for future panel/command plugins).
- **OSINT** providers are link catalogs and lightweight client helpers in `services/`; no backend secrets are required for core operation.

## Current status

Application source is usable for local investigation graphs, case management, export helpers, and the CLI shell. Some OSINT integrations are catalog links or optional client-side lookups rather than full automated pipelines. Module registry wiring is intentional and gradual.

## Known limitations

- No server-side multi-user collaboration
- 3D graph mode is optional and lightweight
- Full CLI equivalents of tools such as theHarvester or Amass are not bundled; the catalog points to external tools
- Case data stays in the browser; clear site data removes it

## License

MIT — see [LICENSE](LICENSE).
