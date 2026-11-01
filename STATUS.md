# ARGUS — status

## PARTIALLY READY

### 2026-11-02 batch

- **No demo flash:** Zustand initializes via `bootstrapAppState()` / `getInitialCaseData()` at create time
- **Map:** `MapPanel` — OSM embed + entity list with lat/lng properties (no Leaflet dep)
- **CanvasEngine:** layers, notes, undo/redo canvas history; still mirrors React Flow for entities
- **CI:** `.github/workflows/ci.yml` — typecheck + production build on Ubuntu + Windows; E2E smoke on Windows (Playwright)
- **Scripts:** `npm run build` = typecheck + vite build; `npm run test:e2e`

### Verify locally

```bash
cd frontend
npm install
npm run typecheck
npm run build
npm run preview
# optional:
npx playwright install chromium
npm run test:e2e
```

### Remaining

- Full whiteboard (frames, multi-select align) beyond engine scaffold
- Map is OSM embed, not interactive vector layers
- package-lock may need refresh after playwright add (`npm install`)
