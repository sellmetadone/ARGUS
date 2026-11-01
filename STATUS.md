# ARGUS — implementation status

Honest snapshot for contributors and testers.

## Status: PARTIALLY READY

Core investigation UI and graph work on desktop. Not a finished CanvasEngine/whiteboard product.

## Done

- Windows-oriented launch path (`frontend/package.json`, Vite)
- React Flow graph, provider, loop fixes
- Cases, entities, relationships, basic persist
- Double-click entity create + type picker
- Connection editor + store update/remove
- Entity schemas + Object Inspector
- Graph analytics services + panel (themed + i18n)
- Evidence / correlation / optional local AI panels (themed + i18n)
- Welcome screen localized + theme-aware
- en/ru strings for main chrome, settings, inspector, connections, analytics, evidence, AI, correlation
- Desktop/laptop device profile
- README + this STATUS file
- CanvasEngine **scaffold** (`canvas/engine/types.ts`, `CanvasEngine.ts`) — not full whiteboard yet

## Partial

- Bidirectional edge markers / all line styles in every edge state
- Temporal intelligence (deep time filters on graph)
- Correlation → one-click create relationship
- CanvasEngine wired as single renderer (still React Flow primary)
- Timeline / Search / Command palette / Tutorial full i18n

## Not done

- Full Whiteboard redesign (layers UI, frames, groups, multi-select align)
- Map (Leaflet/MapLibre)
- Custom entity type builder UI
- Complete translations for all languages in LANG_META
- Automated E2E on Windows CI

## How to verify

```bash
cd frontend && npm install && npm run dev
```

1. Welcome → New canvas / language in Settings  
2. Create entity / link / Inspector / Connection editor  
3. Analytics → find path  
4. Evidence / Correlate / AI (optional Ollama)  
5. Reload page → case still present  
