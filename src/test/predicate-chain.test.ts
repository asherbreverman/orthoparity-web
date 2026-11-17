import { describe, expect, it } from "vitest";
import {
  cacheKey,
  filename,
  limitations,
  statistics,
  stopCounts,
  visibleTree,
  preferredSearchResults,
  type Chain,
  type DeviceNode,
  type ChainEdge,
} from "@/lib/predicate-chain";
const node = (
  knumber: string,
  generation: number,
  extra: Partial<DeviceNode> = {},
): DeviceNode => ({
  knumber,
  generation,
  device_name: "Device",
  applicant: "Printed applicant",
  decision_date: "2024-03-01",
  product_code: null,
  regulation_number: null,
  device_class: null,
  review_panel: null,
  summary_url: null,
  role: "primary",
  confidence: "HIGH",
  review_source: "parser",
  stop: null,
  ...extra,
});
const edge = (
  child: string,
  predicate: string,
  role = "primary",
  extra: Partial<ChainEdge> = {},
): ChainEdge => ({
  child,
  predicate,
  role,
  generation: 1,
  number_as_printed: null,
  confidence: "HIGH",
  review_decision: null,
  review_source: "parser",
  page: null,
  printed_label: null,
  evidence: null,
  ...extra,
});
const chain: Chain = {
  max_gen: 10,
  roots: ["K241487"],
  nodes: [
    node("K241487", 0),
    node("K200001", 1, { decision_date: "2020-01-01" }),
    node("K190001", 1),
    node("K100001", 2, { decision_date: "2010-01-01", stop: "TRUNCATED: limit" }),
    node("K090001", 2, { stop: "Not yet extracted" }),
  ],
  edges: [
    edge("K241487", "K200001"),
    edge("K241487", "K190001", "reference"),
    edge("K200001", "K100001"),
    edge("K190001", "K090001"),
    edge("K100001", "K200001"),
  ],
  flags: [],
};
describe("Predicate ancestry rules", () => {
  it('shows the two Interwedge matches without unrelated spelling suggestions', () => {
    const rows = [{knumber:'K261809',device_name:'Interwedge Standalone Lateral',applicant:'Globus',decision_date:null,match:'partial'}, {knumber:'K241487',device_name:'Interwedge Standalone Lateral',applicant:'Globus',decision_date:null,match:'partial'}, {knumber:'K241468',device_name:'Vertiwedge Intraosseous System',applicant:'Globus',decision_date:null,match:'close spelling'}];
    expect(preferredSearchResults(rows).map(row => row.knumber)).toEqual(['K261809','K241487']);
  });
  it('keeps close spelling matches when there are no direct matches', () => {
    const rows = [{knumber:'K241487',device_name:'Interwedge Standalone Lateral',applicant:'Globus',decision_date:null,match:'close spelling'}];
    expect(preferredSearchResults(rows)).toEqual(rows);
  });
  it("follows only primary edges reachable from subject devices", () => {
    expect(visibleTree(chain, true).nodes.map((n) => n.knumber)).toEqual([
      "K241487",
      "K200001",
      "K100001",
    ]);
  });
  it("includes reference branches in the full chain", () => {
    expect(visibleTree(chain, false).nodes).toHaveLength(5);
  });
  it("counts every node once as devices in chain", () => {
    expect(statistics(chain).devices).toBe(5);
  });
  it("finds the deepest generation", () => {
    expect(statistics(chain).deepest).toBe(2);
  });
  it("finds the earliest decision year reached", () => {
    expect(statistics(chain).earliest).toBe(2010);
  });
  it("counts branches stopped from nodes with a stop", () => {
    expect(statistics(chain).stopped).toBe(2);
  });
  it("counts only LOW edges whose review source is parser", () => {
    expect(
      statistics({
        ...chain,
        edges: [
          edge("A", "B", "primary", { confidence: "LOW" }),
          edge("A", "C", "primary", { confidence: "LOW", review_source: "Claude review" }),
          edge("A", "D", "primary", { confidence: "MEDIUM" }),
        ],
      }).low,
    ).toBe(1);
  });
  it("groups stops by the exact stop text", () => {
    expect(stopCounts(chain)).toEqual([
      { stop: "TRUNCATED: limit", count: 1 },
      { stop: "Not yet extracted", count: 1 },
    ]);
  });
  it("preserves limitations verbatim and in numeric order", () => {
    expect(
      limitations({
        limitation_10: "  Exact tenth.  ",
        limitation_02: "Second",
        limitation_01: "First",
        parser_version: "1",
      }),
    ).toEqual(["First", "Second", "  Exact tenth.  "]);
  });
  it("uses the requested sanitized product and dated export name", () => {
    expect(filename("Interwedge / family", "2026-11-17")).toBe(
      "Predicate_Chain_Interwedge_family_2026-11-17",
    );
  });
  it("caches per subject set and generation limit independent of ordering", () => {
    expect(cacheKey(["B", "A", "A"], 10)).toBe(cacheKey(["A", "B"], 10));
    expect(cacheKey(["A", "B"], 10)).not.toBe(cacheKey(["A", "B"], 9));
  });
});
