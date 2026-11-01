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
- Graph analytics services + panel
- Evidence / correlation / optional local AI panels
- en/ru strings for main chrome, settings, inspector, connections
- Desktop/laptop device profile

## In progress / partial

- Full localization of every panel string
- Bidirectional / per-edge style fully reflected on all edge states
- Temporal intelligence (deep time filters)
- Correlation → one-click “create relationship”
- CanvasEngine as single API (layers, groups, frames)

## Not done

- Full Whiteboard redesign as specified
- Map (Leaflet/MapLibre)
- Custom entity type builder UI
- Complete translations for all languages in LANG_META
- Automated E2E suite on Windows CI

## How to verify

```bash
cd frontend && npm install && npm run dev
```

1. Create case / entity / link  
2. Open Inspector + Connection editor  
3. Analytics → find path  
4. Reload page → case still present  
5. Settings → language RU/EN  
