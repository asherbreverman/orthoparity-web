import {
  filename,
  limitations,
  methodology,
  statistics,
  type BrandFamily,
  type Chain,
  type Meta,
} from "./predicate-chain";
export async function exportWorkbook(
  chain: Chain,
  meta: Meta,
  product: string,
  family: BrandFamily | null,
) {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  const append = (name: string, rows: unknown[][]) => {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = (rows[0] ?? []).map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(book, sheet, name);
  };
  const objects = (name: string, rows: object[], columns: string[]) =>
    append(name, [
      columns,
      ...rows.map((r) => columns.map((k) => (r as Record<string, unknown>)[k] ?? "")),
    ]);
  const stats = statistics(chain);
  const date = new Date().toISOString().slice(0, 10);
  append("Summary", [
    ["Item", "Value"],
    ["Product", product],
    ["Subject devices", chain.roots.join(", ")],
    ["Date", date],
    ["Parser version", meta.parser_version],
    ["Generation limit", chain.max_gen],
    ["Devices in chain", stats.devices],
    ["Deepest generation", stats.deepest],
    ["Earliest decision year", stats.earliest ?? ""],
    ["Branches stopped", stats.stopped],
    ["Unreviewed LOW edges", stats.low],
  ]);
  const nodeFields = [
    "knumber",
    "generation",
    "device_name",
    "applicant",
    "decision_date",
    "product_code",
    "regulation_number",
    "device_class",
    "review_panel",
    "segment",
    "in_starting_set",
    "summary_url",
    "role",
    "confidence",
    "review_source",
    "stop",
  ];
  const edgeFields = [
    "generation",
    "child",
    "number_as_printed",
    "predicate",
    "role",
    "confidence",
    "review_decision",
    "review_source",
    "page",
    "printed_label",
    "evidence",
  ];
  const sorted = [...chain.nodes].sort(
    (a, b) => a.generation - b.generation || a.knumber.localeCompare(b.knumber),
  );
  objects("Benchmark", sorted, [
    "generation",
    "role",
    "knumber",
    "device_name",
    "applicant",
    "decision_date",
    "product_code",
    "regulation_number",
    "device_class",
    "review_panel",
    "segment",
    "confidence",
    "review_source",
    "stop",
  ]);
  objects("Edges", chain.edges, edgeFields);
  objects("Nodes", chain.nodes, nodeFields);
  const companies = new Map<string, typeof chain.nodes>();
  for (const node of chain.nodes)
    companies.set(node.applicant, [...(companies.get(node.applicant) ?? []), node]);
  append("Companies", [
    ["Applicant", "Number of devices", "First generation", "Last generation", "K-numbers"],
    ...[...companies]
      .sort(([a], [b]) => (a ?? '').localeCompare(b ?? ''))
      .map(([applicant, nodes]) => [
        applicant,
        nodes.length,
        Math.min(...nodes.map((n) => n.generation)),
        Math.max(...nodes.map((n) => n.generation)),
        nodes.map((n) => n.knumber).join(", "),
      ]),
  ]);
  objects("Flags", chain.flags, [
    "flag_id",
    "knumber",
    "flag_type",
    "number",
    "detail",
    "review_decision",
  ]);
  objects("Excluded name matches", family?.excluded ?? [], [
    "knumber",
    "device_name",
    "applicant",
    "decision_date",
    "reason",
  ]);
  append("Reviewer_Checklist", [
    [...edgeFields, "Reviewer agrees (Y/N)", "Reviewer notes", "Reviewer name", "Date"],
    ...chain.edges.map((edge) => [
      ...edgeFields.map((k) => (edge as unknown as Record<string, unknown>)[k] ?? ""),
      "",
      "",
      "",
      "",
    ]),
  ]);
  append("Methodology_and_Limitations", [
    ["Type", "Text"],
    ...methodology.map((text) => ["Methodology", text]),
    ...limitations(meta).map((text) => ["Limitation", text]),
  ]);
  XLSX.writeFile(book, `${filename(product, date)}.xlsx`);
}
export async function exportTree(element: HTMLElement, type: "svg" | "png", product: string) {
  const { toSvg, toPng } = await import("html-to-image");
  const backgroundColor = getComputedStyle(element).backgroundColor;
  const url = await (type === "svg" ? toSvg : toPng)(element, {
    backgroundColor,
    pixelRatio: 2,
    filter: (node) =>
      !(
        node instanceof HTMLElement &&
        (node.classList.contains("react-flow__controls") ||
          node.classList.contains("react-flow__minimap"))
      ),
  });
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename(product, new Date().toISOString().slice(0, 10))}.${type}`;
  link.click();
}
