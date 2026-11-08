# ARGUS graph visual pass — handoff notes

Integrated into main ARGUS (visual v2).

## Changes
- Entity cards: Lucide icons by type, accent rail, subtitle from description/platform/value
- Distinct **source** (filled) and **target** (outlined) ports on all four sides
- `sourceHandle` / `targetHandle` persisted in relationship properties and restored on load
- Legacy handle ids (`s-top`, `t-left`) normalized to `source-top` / `target-left`
- Edge status styles: confirmed / assumed|suspected / unknown
- Graph CSS under `.argus-flow` / `.argus-entity-node`
- CanvasEngine remains a layout mirror; React Flow is the renderer

## Validate
```bash
cd frontend && npm install && npm run typecheck && npm run build && npm run dev
```
1. Hover node — 4 source + 4 target ports
2. Drag right source to left target
3. Reload case — sides retained
4. Themes Light/Dark/AMOLED
