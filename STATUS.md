# ARGUS — implementation status

## Status: PARTIALLY READY

Core investigation UI and graph work on desktop. Not a finished CanvasEngine/whiteboard product.

### Maintenance (2026-11-02)

- Audited architecture: frontend-only (Vite + React 19 + Zustand + React Flow); no separate backend service
- BAT launchers (`START_ARGUS.bat`, `RUN_DEV.bat`) use `cd /d` and `frontend/package.json`
- **Fixed:** persisted cases were written via `caseRepository` but not reloaded on app start → `bootstrap.ts` + App hydrate
- **Fixed:** correlation batch link creation used stale relationship list mid-loop
- **Fixed:** relationship type from correlation sanitized against `RelationshipType`
- Dependencies not force-upgraded (React 19 / Vite 6 stack left as declared)
- Full `tsc`/production build not verified in CI sandbox this pass — run locally: `cd frontend && npm run typecheck && npm run build`

## Done

- Graph + tools, Inspector, Connection editor, schemas
- Analytics, Evidence, Correlation (create suspected links), optional local AI
- Temporal graph filter (Timeline)
- CanvasEngine mirror (viewport/tool/entities)
- en/ru i18n for main panels
- Case persist + **restore** from localStorage

## Known gaps

- Map placeholder
- Full CanvasEngine whiteboard (layers/groups/frames)
- Complete i18n for all LANG_META languages
- E2E on Windows CI
- Hydrate runs after first paint (brief demo flash possible if localStorage has data)

## Verify

```bash
cd frontend && npm install && npm run typecheck && npm run build && npm run dev
```
