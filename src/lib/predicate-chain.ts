export interface SearchResult {
  knumber: string;
  device_name: string;
  applicant: string;
  decision_date: string | null;
  segment?: string;
  in_starting_set?: boolean;
  match?: string;
}
export function preferredSearchResults(rows: SearchResult[]) {
  const direct = rows.filter(row => row.match !== 'close spelling');
  return direct.length ? direct : rows;
}
export interface DeviceNode extends SearchResult {
  generation: number;
  product_code: string | null;
  regulation_number: string | null;
  device_class: string | number | null;
  review_panel: string | null;
  summary_url: string | null;
  role: string;
  confidence: string | null;
  review_source: string | null;
  stop: string | null;
}
export interface ChainEdge {
  generation: number;
  child: string;
  predicate: string;
  number_as_printed: string | null;
  role: string;
  confidence: string;
  review_decision: string | null;
  review_source: string;
  page: string | number | null;
  printed_label: string | null;
  evidence: string | null;
}
export interface ChainFlag {
  flag_id: string | number;
  knumber: string;
  flag_type: string;
  number: string | null;
  detail: string;
  review_decision: string | null;
}
export interface ExcludedDevice extends SearchResult {
  reason: string;
}
export interface BrandFamily {
  brand: string;
  family: SearchResult[];
  excluded: ExcludedDevice[];
}
export interface Chain {
  max_gen: number;
  roots: string[];
  nodes: DeviceNode[];
  edges: ChainEdge[];
  flags: ChainFlag[];
}
export interface Meta {
  [key: string]: string | undefined;
  parser_version?: string;
  tool_version?: string;
  max_generations?: string;
  exported_utc?: string;
  starting_set_clearances?: string;
}
export const methodology = [
  "Each clearance's 510(k) Summary PDF was downloaded from FDA once and read by software (text layer, repaired fonts, or OCR for scans).",
  "Predicates are the K-numbers (and De Novo and PMA numbers) each Summary cites. Company and device names come from FDA records by number, never from the PDF text.",
  "The chain follows every numbered predicate, generation by generation, up to the generation limit. Each device appears once, at its nearest generation.",
  "Confidence: HIGH means the number sits in a labeled predicate section and is found in FDA records; MEDIUM means it appears elsewhere in the Summary; LOW means the number was read from a scan and matches neither FDA's device name nor the company, or is not in FDA records.",
  'Review source: "Claude review" marks decisions from an AI review of the highest-traffic flagged documents, recorded with reasoning; "parser" means no one reviewed that edge.',
];
export function limitations(meta: Meta) {
  return Object.keys(meta)
    .filter((k) => /^limitation_\d+$/.test(k))
    .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1]))
    .map((k) => meta[k] ?? "");
}
export function statistics(chain: Chain) {
  const years = chain.nodes.map((n) => Number(n.decision_date?.slice(0, 4))).filter((y) => y > 0);
  return {
    devices: chain.nodes.length,
    deepest: Math.max(0, ...chain.nodes.map((n) => n.generation)),
    earliest: years.length ? Math.min(...years) : null,
    stopped: chain.nodes.filter((n) => n.stop).length,
    low: chain.edges.filter((e) => e.confidence === "LOW" && e.review_source === "parser").length,
  };
}
export function visibleTree(chain: Chain, primaryOnly: boolean) {
  if (!primaryOnly) return { nodes: chain.nodes, edges: chain.edges };
  const reached = new Set(chain.roots);
  const outgoing = new Map<string, ChainEdge[]>();
  for (const edge of chain.edges) {
    if (edge.role !== "primary") continue;
    outgoing.set(edge.child, [...(outgoing.get(edge.child) ?? []), edge]);
  }
  const queue = [...chain.roots];
  for (let i = 0; i < queue.length; i++)
    for (const edge of outgoing.get(queue[i] ?? "") ?? [])
      if (!reached.has(edge.predicate)) {
        reached.add(edge.predicate);
        queue.push(edge.predicate);
      }
  return {
    nodes: chain.nodes.filter((n) => reached.has(n.knumber)),
    edges: chain.edges.filter(
      (e) => e.role === "primary" && reached.has(e.child) && reached.has(e.predicate),
    ),
  };
}
export function stopCounts(chain: Chain) {
  const counts = new Map<string, number>();
  for (const n of chain.nodes) if (n.stop) counts.set(n.stop, (counts.get(n.stop) ?? 0) + 1);
  return [...counts].map(([stop, count]) => ({ stop, count })).sort((a, b) => b.count - a.count);
}
export function filename(product: string, date: string) {
  return `OrthoParity_${product.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "devices"}_${date}`;
}
export function cacheKey(roots: string[], max: number) {
  return `${[...new Set(roots)].sort().join(",")}:${max}`;
}
export function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
}
