# ARGUS graph visual pass — handoff notes

Integrated into main ARGUS. React Flow remains the renderer; CanvasEngine stays a layout mirror.

## Integrated
- `EntityNode` — type marker, accent rail, selected/hover/pinned, low-noise handles
- Graph CSS under `.argus-flow` / `.argus-entity-node` for light analytical look
- Edge status: confirmed (green), assumed/suspected (amber dashed), unknown (muted dashed); path highlight wins
- Wider default auto-layout spacing (250×150)
- Preserved: delete/Backspace, onNodesDelete, temporal filter, CanvasEngine sync, correlation links

## Validate locally
```bash
cd frontend && npm install && npm run typecheck && npm run build && npm run dev
```
Check selection, drag, pin, connect, delete, themes, reload case, double-click create.
