# ARGUS

Interactive investigation graph for cyber and OSINT analysis.

**Author:** [sellmetadone](https://github.com/sellmetadone)  
**Telegram:** [@sofia_white_death](https://t.me/sofia_white_death)  
**Channel:** [t.me/argus_platform](https://t.me/argus_platform)

Cases, entities, and relationships stay in the browser (`localStorage`). No backend is required for core use. Optional **Ollama** for local AI only.

## Requirements

- Windows 10/11, macOS, or Linux
- **Node.js 20+** (LTS) with npm — https://nodejs.org/

## Quick start (Windows)

1. Clone or download the repository.
2. Double-click **`START_ARGUS.bat`** in the project root (if present), **or**:

```bat
cd /d "C:\path\to\ARGUS\frontend"
npm install
npm run dev
```

3. Open the URL from the terminal (usually `http://127.0.0.1:3030`).

### Fix: `ENOENT package.json`

Always work in **`frontend/`** (that is where `package.json` lives), or use a root BAT with `cd /d "%~dp0frontend"`.

```bat
cd /d "C:\path\to\ARGUS\frontend"
npm run dev
```

### Port

Default **3030**. If busy, Vite picks the next free port — use the `Local:` line.

## From repository root

```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

## Features (current)

- Investigation graph (React Flow) with tools: select, pan, connect, double-click create
- Cases isolation + local persist
- **Object Inspector** (overview / schema data / sources / links / history)
- **Connection editor** (type, evidence status, confidence, direction, line style)
- **Entity schemas** by type (person, domain, IP, …)
- Graph analytics: metrics, shortest path, degree, centrality, components, isolates
- Evidence manager (local, verification statuses)
- Correlation helper, optional **local Ollama** AI (off by default)
- Timeline panel, search, settings (theme / language / integrity)
- Desktop-first device profile (laptop / desktop density)
- i18n: Russian + English primary

## Privacy

Local `localStorage` only for cases. No telemetry. Do not commit API keys. AI never runs without explicit consent and local Ollama.

## Status

See **[STATUS.md](STATUS.md)** for completed vs backlog (CanvasEngine, full whiteboard, map, etc.).

## License

MIT — see [LICENSE](LICENSE).
