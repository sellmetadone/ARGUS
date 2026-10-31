/** Graph Intelligence — deterministic analytics over entities + relationships. */
import type { Entity, Relationship } from '../../types';

export type GraphSnapshot = { entities: Entity[]; relationships: Relationship[] };
export type NodeDegree = { id: string; label: string; type: string; degree: number; inDegree: number; outDegree: number };
export type ComponentInfo = { id: number; nodeIds: string[]; size: number };
export type PathResult = { path: string[]; length: number };
export type CentralityScore = { id: string; label: string; type: string; degreeCentrality: number; betweenness: number };
export type GraphMetrics = { nodeCount: number; edgeCount: number; density: number; componentCount: number; largestComponentSize: number; isolateCount: number; avgDegree: number; maxDegree: number };

function adjList(entities: Entity[], relationships: Relationship[]): Map<string, Set<string>> {
  const ids = new Set(entities.map((e) => e.id));
  const g = new Map<string, Set<string>>();
  for (const e of entities) g.set(e.id, new Set());
  for (const r of relationships) {
    if (!ids.has(r.sourceId) || !ids.has(r.targetId)) continue;
    g.get(r.sourceId)!.add(r.targetId);
    g.get(r.targetId)!.add(r.sourceId);
  }
  return g;
}

function directedAdj(entities: Entity[], relationships: Relationship[]) {
  const ids = new Set(entities.map((e) => e.id));
  const out = new Map<string, Set<string>>();
  const inn = new Map<string, Set<string>>();
  for (const e of entities) { out.set(e.id, new Set()); inn.set(e.id, new Set()); }
  for (const r of relationships) {
    if (!ids.has(r.sourceId) || !ids.has(r.targetId)) continue;
    out.get(r.sourceId)!.add(r.targetId);
    inn.get(r.targetId)!.add(r.sourceId);
  }
  return { out, inn };
}

export function computeDegrees(snap: GraphSnapshot): NodeDegree[] {
  const { out, inn } = directedAdj(snap.entities, snap.relationships);
  return snap.entities.map((e) => {
    const od = out.get(e.id)?.size ?? 0;
    const id = inn.get(e.id)?.size ?? 0;
    return { id: e.id, label: e.label, type: e.type, degree: od + id, inDegree: id, outDegree: od };
  }).sort((a, b) => b.degree - a.degree);
}

export function findIsolates(snap: GraphSnapshot): Entity[] {
  const iso = new Set(computeDegrees(snap).filter((d) => d.degree === 0).map((d) => d.id));
  return snap.entities.filter((e) => iso.has(e.id));
}

export function connectedComponents(snap: GraphSnapshot): ComponentInfo[] {
  const g = adjList(snap.entities, snap.relationships);
  const seen = new Set<string>();
  const components: ComponentInfo[] = [];
  let cid = 0;
  for (const e of snap.entities) {
    if (seen.has(e.id)) continue;
    const stack = [e.id];
    const nodes: string[] = [];
    seen.add(e.id);
    while (stack.length) {
      const u = stack.pop()!;
      nodes.push(u);
      for (const v of g.get(u) || []) {
        if (!seen.has(v)) { seen.add(v); stack.push(v); }
      }
    }
    components.push({ id: cid++, nodeIds: nodes, size: nodes.length });
  }
  return components.sort((a, b) => b.size - a.size);
}

export function shortestPath(snap: GraphSnapshot, fromId: string, toId: string): PathResult | null {
  if (fromId === toId) return { path: [fromId], length: 0 };
  const g = adjList(snap.entities, snap.relationships);
  if (!g.has(fromId) || !g.has(toId)) return null;
  const prev = new Map<string, string | null>();
  const q = [fromId];
  prev.set(fromId, null);
  while (q.length) {
    const u = q.shift()!;
    if (u === toId) break;
    for (const v of g.get(u) || []) {
      if (prev.has(v)) continue;
      prev.set(v, u);
      q.push(v);
    }
  }
  if (!prev.has(toId)) return null;
  const path: string[] = [];
  let cur: string | null = toId;
  while (cur) { path.push(cur); cur = prev.get(cur) ?? null; }
  path.reverse();
  return { path, length: path.length - 1 };
}

export function findAllPaths(snap: GraphSnapshot, fromId: string, toId: string, maxDepth = 6, maxPaths = 20): PathResult[] {
  const g = adjList(snap.entities, snap.relationships);
  const results: PathResult[] = [];
  const visited = new Set<string>();
  function dfs(u: string, path: string[]) {
    if (results.length >= maxPaths || path.length > maxDepth + 1) return;
    if (u === toId && path.length > 1) { results.push({ path: [...path], length: path.length - 1 }); return; }
    for (const v of g.get(u) || []) {
      if (visited.has(v)) continue;
      visited.add(v); path.push(v); dfs(v, path); path.pop(); visited.delete(v);
    }
  }
  if (!g.has(fromId) || !g.has(toId)) return [];
  visited.add(fromId);
  dfs(fromId, [fromId]);
  return results.sort((a, b) => a.length - b.length);
}

export function commonNeighbors(snap: GraphSnapshot, a: string, b: string): string[] {
  const g = adjList(snap.entities, snap.relationships);
  const na = g.get(a); const nb = g.get(b);
  if (!na || !nb) return [];
  return [...na].filter((x) => x !== b && nb.has(x));
}

export function computeMetrics(snap: GraphSnapshot): GraphMetrics {
  const n = snap.entities.length;
  const ids = new Set(snap.entities.map((e) => e.id));
  const m = snap.relationships.filter((r) => ids.has(r.sourceId) && ids.has(r.targetId)).length;
  const density = n < 2 ? 0 : (2 * m) / (n * (n - 1));
  const comps = connectedComponents(snap);
  const degrees = computeDegrees(snap);
  const sumDeg = degrees.reduce((s, d) => s + d.degree, 0);
  return {
    nodeCount: n, edgeCount: m, density: Number(density.toFixed(4)),
    componentCount: comps.length, largestComponentSize: comps[0]?.size ?? 0,
    isolateCount: degrees.filter((d) => d.degree === 0).length,
    avgDegree: n ? Number((sumDeg / n).toFixed(3)) : 0, maxDegree: degrees[0]?.degree ?? 0,
  };
}

export function computeCentrality(snap: GraphSnapshot, maxPairs = 400): CentralityScore[] {
  const degrees = computeDegrees(snap);
  const maxDeg = Math.max(1, ...degrees.map((d) => d.degree));
  const ids = snap.entities.map((e) => e.id);
  const between = new Map<string, number>();
  for (const id of ids) between.set(id, 0);
  const pairs: [string, string][] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j]]);
  let sample = pairs;
  if (pairs.length > maxPairs) {
    const step = Math.ceil(pairs.length / maxPairs);
    sample = pairs.filter((_, idx) => idx % step === 0).slice(0, maxPairs);
  }
  for (const [s, t] of sample) {
    const path = shortestPath(snap, s, t);
    if (!path || path.path.length < 3) continue;
    for (let k = 1; k < path.path.length - 1; k++) {
      const mid = path.path[k];
      between.set(mid, (between.get(mid) || 0) + 1);
    }
  }
  const maxB = Math.max(1, ...[...between.values()]);
  return degrees.map((d) => ({
    id: d.id, label: d.label, type: d.type,
    degreeCentrality: Number((d.degree / maxDeg).toFixed(4)),
    betweenness: Number(((between.get(d.id) || 0) / maxB).toFixed(4)),
  }));
}

export function filterByTypes(snap: GraphSnapshot, entityTypes?: string[], relationshipTypes?: string[]): GraphSnapshot {
  const ents = entityTypes?.length ? snap.entities.filter((e) => entityTypes.includes(e.type)) : snap.entities;
  const ids = new Set(ents.map((e) => e.id));
  let rels = snap.relationships.filter((r) => ids.has(r.sourceId) && ids.has(r.targetId));
  if (relationshipTypes?.length) rels = rels.filter((r) => relationshipTypes.includes(r.type));
  return { entities: ents, relationships: rels };
}

export function compareSubgraphs(idsA: string[], idsB: string[]) {
  const a = new Set(idsA); const b = new Set(idsB);
  return { shared: idsA.filter((id) => b.has(id)), onlyA: idsA.filter((id) => !b.has(id)), onlyB: idsB.filter((id) => !a.has(id)) };
}
