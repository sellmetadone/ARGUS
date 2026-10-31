# ARGUS

Interactive investigation graph for cyber and OSINT analysis.

**Author:** [sellmetadone](https://github.com/sellmetadone)  
**Telegram:** [@sofia_white_death](https://t.me/sofia_white_death)  
**Channel:** [t.me/argus_platform](https://t.me/argus_platform)

Cases, entities, and relationships stay in the browser (`localStorage`). No backend is required for core use.

## Requirements

- Windows 10/11, macOS, or Linux
- **Node.js 20+** (LTS) with npm — https://nodejs.org/

## Quick start (Windows)

1. Download and unpack the repository.
2. Double-click **`START_ARGUS.bat`** in the project root.
3. Choose **1** (Web UI).
4. Open the URL printed in the terminal (usually `http://127.0.0.1:3030`).

First run installs npm dependencies automatically.

Optional: `INSTALL_ARGUS.bat`, `RUN_DEV.bat`.

## Terminal

`package.json` is in **`frontend/`**.

```bash
cd frontend
npm install
npm run dev
```

From repository root (proxy scripts):

```bash
npm run install:app
npm run dev
```

### Fix for ENOENT package.json on Windows

```bat
cd /d "C:\path\to\ARGUS-main\frontend"
npm run dev
```

Or use `START_ARGUS.bat` (`cd /d "%~dp0"` + enter `frontend`).

## Port

Default **3030**. If busy, Vite chooses the next free port — use the `Local:` line from the terminal.

## Features

- Investigation graph (React Flow)
- Cases with isolation
- Search + DNS lookups + OSINT links
- Timeline, settings, export helpers
- Integrity check (Settings → Validate active case)
- CLI menu / console search

## Privacy

Local `localStorage` only. No telemetry. Do not commit API keys.

## License

MIT — see [LICENSE](LICENSE).
