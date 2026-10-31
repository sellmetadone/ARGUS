/** Maltego interchange helpers (GraphML / transform stubs) */

export function entitiesToGraphML(
  entities: { id: string; label: string; type: string }[],
  relationships: { id: string; sourceId: string; targetId: string; type: string }[]
): string {
  const nodes = entities
    .map(
      (e) =>
        `  <node id="${escapeXml(e.id)}">\n    <data key="label">${escapeXml(e.label)}</data>\n    <data key="type">${escapeXml(e.type)}</data>\n  </node>`
    )
    .join('\n');
  const edges = relationships
    .map(
      (r) =>
        `  <edge id="${escapeXml(r.id)}" source="${escapeXml(r.sourceId)}" target="${escapeXml(r.targetId)}">\n    <data key="type">${escapeXml(r.type)}</data>\n  </edge>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n  <key id="label" for="node" attr.name="label" attr.type="string"/>\n  <key id="type" for="node" attr.name="type" attr.type="string"/>\n  <key id="type" for="edge" attr.name="type" attr.type="string"/>\n  <graph id="G" edgedefault="directed">\n${nodes}\n${edges}\n  </graph>\n</graphml>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const TRANSFORM_STUBS = [
  { id: 'dns_to_ip', label: 'DNS to IP', input: 'domain' },
  { id: 'domain_to_email', label: 'Domain to Email', input: 'domain' },
  { id: 'ip_to_asn', label: 'IP to ASN', input: 'ip' },
];
