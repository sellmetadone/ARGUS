# ARGUS — status

## PARTIALLY READY → Whiteboard pass (2026-11)

### Done
- **Whiteboard:** frames, notes, text, groups; multi-select (Shift + drag); align / distribute bar
- **CanvasEngine:** addFrame, groupSelected, computeAlign, whiteboard objects layer
- **Visual v2 graph:** Lucide cards, source/target ports, handle persistence
- **Map:** OSM embed + multi-point list, fit all, open OSM
- **No demo flash,** Inspector hooks fix, Viewport typecheck
- **License:** MIT

### Verify
```bash
cd frontend
npm install
npm run typecheck
npm run build
npm run dev
```

### Remaining (lower priority)
- CanvasEngine as sole interaction engine (still mirrors React Flow)
- Full Leaflet vector map
- Graph3D polish, bundle code-split
