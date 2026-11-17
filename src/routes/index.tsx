import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Search,
  Moon,
  Sun,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Info,
  Download,
  FileSpreadsheet,
  Network,
  Table2,
  Flag,
  CircleStop,
  GitBranch,
  Layers,
  CalendarDays,
  AlertTriangle,
  ArrowRight,
  X,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PredicateTable, type Column } from "@/components/predicate-table";
import {
  dateLabel,
  limitations,
  methodology,
  statistics,
  stopCounts,
  type BrandFamily,
  type Chain,
  type Meta,
  type SearchResult,
} from "@/lib/predicate-chain";
import {
  getFamily,
  getMeta,
  isDataConnected,
  lookupChain,
  searchDevices,
} from "@/lib/predicate-data";
import { exportTree, exportWorkbook } from "@/lib/predicate-export";

const PredicateTree = lazy(() => import("@/components/predicate-tree"));
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Predicate Chain — FDA 510(k) Orthopedic Ancestry" },
      {
        name: "description",
        content:
          "Explore ancestor chains for orthopedic FDA 510(k) clearances. Compare devices, review predicate evidence, and export research from public FDA data.",
      },
      { property: "og:title", content: "Predicate Chain — FDA 510(k) Orthopedic Ancestry" },
      {
        property: "og:description",
        content:
          "A public, read-only research tool for orthopedic device predicate ancestry, evidence and benchmarking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
const benchmarkColumns: Column[] = [
  { key: "generation", label: "Generation" },
  { key: "role", label: "Role" },
  { key: "knumber", label: "K-number", mono: true },
  { key: "device_name", label: "Device name" },
  { key: "applicant", label: "Applicant (as printed)" },
  { key: "decision_date", label: "Decision date" },
  { key: "product_code", label: "Product code" },
  { key: "regulation_number", label: "Regulation number" },
  { key: "device_class", label: "Device class" },
  { key: "review_panel", label: "Review panel" },
  { key: "segment", label: "Unofficial segment" },
  { key: "confidence", label: "Confidence" },
  { key: "review_source", label: "Review source" },
  { key: "stop", label: "Where the chain stops" },
];
const edgeColumns: Column[] = [
  { key: "generation", label: "Generation" },
  { key: "child", label: "Child", mono: true },
  { key: "number_as_printed", label: "Number as printed", mono: true },
  { key: "predicate", label: "Number used", mono: true },
  { key: "role", label: "Role" },
  { key: "confidence", label: "Confidence" },
  { key: "review_decision", label: "Review decision" },
  { key: "review_source", label: "Review source" },
  { key: "page", label: "Page" },
  { key: "evidence", label: "Evidence", max: 200 },
];
const flagColumns: Column[] = [
  { key: "flag_id", label: "Flag ID" },
  { key: "knumber", label: "K-number", mono: true },
  { key: "flag_type", label: "Flag type" },
  { key: "number", label: "Number", mono: true },
  { key: "detail", label: "Detail" },
  { key: "review_decision", label: "Review decision" },
];
const excludedColumns: Column[] = [
  { key: "knumber", label: "K-number", mono: true },
  { key: "device_name", label: "Device name" },
  { key: "applicant", label: "Applicant" },
  { key: "decision_date", label: "Decision date" },
  { key: "reason", label: "Reason" },
];
const tabs = [
  { id: "benchmark", label: "Benchmark", icon: Table2 },
  { id: "tree", label: "Tree", icon: Network },
  { id: "flags", label: "Flags", icon: Flag },
  { id: "stops", label: "Where branches stop", icon: CircleStop },
  { id: "edges", label: "Edges", icon: GitBranch },
];
function ChainGlyph({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 112 68"
      className={small ? "brand-icon" : "chain-glyph"}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M56 20v14M22 34h68M22 34v12M56 34v12M90 34v12"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect x="42" y="2" width="28" height="18" rx="3" fill="currentColor" />
      <rect x="8" y="46" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
      <rect x="42" y="46" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
      <rect x="76" y="46" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function Index() {
  const connected = isDataConnected();
  const [dark, setDark] = useState(false);
  const [meta, setMeta] = useState<Meta>({});
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [family, setFamily] = useState<BrandFamily | null>(null);
  const [allFamily, setAllFamily] = useState(false);
  const [chain, setChain] = useState<Chain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("benchmark");
  const [primaryOnly, setPrimaryOnly] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const request = useRef(0);
  const treeElement = useRef<HTMLDivElement>(null);
  const queryRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (connected)
      getMeta()
        .then(setMeta)
        .catch((e) => setError(e.message));
  }, [connected]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      return;
    }
    const abort = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      setSearched(false);
      searchDevices(query.trim(), abort.signal)
        .then((rows) => {
          if (!abort.signal.aborted) {
            setResults(rows);
            setSearched(true);
          }
        })
        .catch((e) => {
          if (!abort.signal.aborted) {
            setError(e.message);
            setResults([]);
          }
        })
        .finally(() => {
          if (!abort.signal.aborted) setSearching(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [query]);
  async function choose(device: SearchResult) {
    const id = ++request.current;
    setSelected(device);
    setShowResults(false);
    setQuery("");
    setLoading(true);
    setChain(null);
    setFamily(null);
    setAllFamily(false);
    setError("");
    try {
      const brand = await getFamily(device.knumber);
      if (id !== request.current) return;
      setFamily(brand);
      const data = await lookupChain([device.knumber], Number(meta.max_generations) || 10);
      if (id === request.current) setChain(data);
    } catch (e) {
      if (id === request.current)
        setError(e instanceof Error ? e.message : "The device could not be loaded. Try again.");
    } finally {
      if (id === request.current) setLoading(false);
    }
  }
  async function changeFamily(all: boolean) {
    if (!selected || !family) return;
    const id = ++request.current;
    setAllFamily(all);
    setLoading(true);
    setChain(null);
    setError("");
    try {
      const data = await lookupChain(
        all ? family.family.map((d) => d.knumber) : [selected.knumber],
        Number(meta.max_generations) || 10,
      );
      if (id === request.current) setChain(data);
    } catch (e) {
      if (id === request.current)
        setError(e instanceof Error ? e.message : "The chain could not be loaded.");
    } finally {
      if (id === request.current) setLoading(false);
    }
  }
  async function download(type: "xlsx" | "svg" | "png") {
    if (!chain || !selected) return;
    setDownloading(true);
    setError("");
    try {
      const product = allFamily && family ? `${family.brand} family` : selected.device_name;
      if (type === "xlsx") await exportWorkbook(chain, meta, product, family);
      else if (treeElement.current) await exportTree(treeElement.current, type, product);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The download could not be created.");
    } finally {
      setDownloading(false);
    }
  }
  const stats = chain ? statistics(chain) : null;
  const stops = chain ? stopCounts(chain) : [];
  const sorted = chain
    ? [...chain.nodes].sort(
        (a, b) => a.generation - b.generation || a.knumber.localeCompare(b.knumber),
      )
    : [];
  const metrics = [
    { label: "Devices in chain", value: stats?.devices, icon: Layers },
    { label: "Deepest generation", value: stats?.deepest, icon: GitBranch },
    { label: "Earliest decision year", value: stats?.earliest, icon: CalendarDays },
    { label: "Branches stopped", value: stats?.stopped, icon: CircleStop },
    { label: "Unreviewed LOW edges", value: stats?.low, icon: AlertTriangle },
  ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="/" className="brandmark">
          <ChainGlyph small />
          Predicate Chain
        </a>
        <div className="flex items-center gap-6">
          <span className="public-label flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} />
            Public data. Independent research.
          </span>
          <Button
            variant="ghost"
            size="icon"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>
      <main>
        <section className="intro">
          <div className="eyebrow">FDA 510(k) · Orthopedic devices</div>
          <h1>Predicate Chain</h1>
          <p>Ancestor chains for FDA 510(k) orthopedic clearances, built from public FDA data.</p>
          <div className="metadata">
            <CalendarDays size={13} />
            {meta.exported_utc
              ? `Data as of ${meta.exported_utc}. Parser ${meta.parser_version ?? "—"}.`
              : connected
                ? "Loading data release information…"
                : "Data release information unavailable."}
          </div>
        </section>
        <section className="search-area">
          <label htmlFor="device-search" className="search-label">
            Find a device
          </label>
          <div className="search-box">
            <Search size={20} className="text-muted-foreground" />
            <input
              ref={queryRef}
              id="device-search"
              placeholder="K-number, product name, or company (for example K241487, Interwedge, Globus)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
                setError("");
              }}
              onFocus={() => setShowResults(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowResults(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  setShowResults(true);
                  if (results.length === 1 && results[0]) void choose(results[0]);
                }
              }}
              aria-expanded={showResults && Boolean(query)}
              aria-controls="device-results"
              autoComplete="off"
            />
            {query && (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  queryRef.current?.focus();
                }}
              >
                <X />
              </Button>
            )}
            <Button
              className="search-submit"
              onClick={() => {
                setShowResults(true);
                queryRef.current?.focus();
              }}
            >
              {searching ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <>
                  Search
                  <ArrowRight />
                </>
              )}
            </Button>
          </div>
          {showResults && query && (searching || searched) && (
            <div id="device-results" className="search-results" aria-live="polite">
              {searching ? (
                <p className="p-5 text-sm text-muted-foreground">Searching clearances…</p>
              ) : results.length ? (
                results.map((r) => (
                  <Button
                    variant="ghost"
                    className="search-result"
                    key={r.knumber}
                    onClick={() => void choose(r)}
                  >
                    <span className="font-mono text-primary">{r.knumber}</span>
                    <span className="result-name">
                      <span>
                        {r.device_name}
                        {r.match === "close spelling" && (
                          <span className="ml-2 rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground">
                            close spelling
                          </span>
                        )}
                      </span>
                      <small>{r.applicant}</small>
                    </span>
                    <time>{dateLabel(r.decision_date)}</time>
                  </Button>
                ))
              ) : (
                <p className="p-5 text-sm text-muted-foreground">
                  No matching devices. Try fewer words or a K-number.
                </p>
              )}
            </div>
          )}
        </section>
        {!connected && (
          <div className="notice">
            <Info size={16} />
            <p>
              The research data is not connected yet. No device records or research findings are
              shown.
            </p>
          </div>
        )}
        {error && (
          <div role="alert" className="notice">
            <AlertTriangle size={16} />
            <span>{error}</span>
            {selected && !loading && (
              <Button size="sm" variant="outline" onClick={() => void choose(selected)}>
                Retry
              </Button>
            )}
          </div>
        )}
        {selected && (
          <section className="selected-device">
            <div className="eyebrow">
              Selected clearance · <span className="font-mono">{selected.knumber}</span>
            </div>
            <h2 className="mt-3">{selected.device_name}</h2>
            <p className="text-sm text-muted-foreground">
              {selected.applicant} <span className="mx-2">·</span>{" "}
              {dateLabel(selected.decision_date)}
            </p>
            {family && family.family.length > 1 && (
              <div className="segmented" aria-label="Clearance scope">
                <Button
                  variant="ghost"
                  aria-pressed={!allFamily}
                  disabled={loading}
                  onClick={() => void changeFamily(false)}
                >
                  This clearance only
                </Button>
                <Button
                  variant="ghost"
                  aria-pressed={allFamily}
                  disabled={loading}
                  onClick={() => void changeFamily(true)}
                >
                  All {family.family.length} clearances for the {family.brand} brand by this
                  applicant
                </Button>
              </div>
            )}
            {Boolean(family?.excluded.length) && (
              <details className="mt-4">
                <summary className="text-xs text-muted-foreground">
                  Excluded name matches ({family?.excluded.length})
                </summary>
                <PredicateTable rows={family?.excluded ?? []} columns={excludedColumns} />
              </details>
            )}
          </section>
        )}
        <section aria-label="Chain overview">
          <div className="section-heading">
            <h2>Chain overview</h2>
            <p>
              {chain
                ? `${chain.roots.length} subject clearance${chain.roots.length > 1 ? "s" : ""} · ${chain.max_gen}-generation limit`
                : "No device selected"}
            </p>
          </div>
          <div className="summary-grid">
            {metrics.map((m) => (
              <div className="metric" key={m.label}>
                <div className="metric-label">
                  {m.label}
                  <m.icon size={14} />
                </div>
                <div className="metric-value">
                  {loading ? <div className="skeleton h-7 w-14" /> : (m.value ?? "—")}
                </div>
              </div>
            ))}
          </div>
          {chain?.nodes.some((n) => n.stop?.startsWith("TRUNCATED")) && (
            <div className="notice">
              <AlertTriangle size={16} />
              Some branches reached the {chain.max_gen}-generation limit.
            </div>
          )}
          <details className="limitations">
            <summary>
              <Info size={15} className="text-primary" />
              Read before using
              <ChevronDown size={15} />
            </summary>
            {limitations(meta).length ? (
              <ol>
                {limitations(meta).map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                {connected
                  ? "Limitations are not available in this data release."
                  : "The published limitations will appear when the research data is connected."}
              </p>
            )}
          </details>
        </section>
        <section className="workspace" aria-label="Chain details">
          <div className="workspace-tabs" role="tablist">
            {tabs.map((t) => (
              <Button
                variant="ghost"
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-controls="chain-panel"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                <t.icon size={14} />
                {t.label}
                {chain && ["flags", "edges"].includes(t.id) && (
                  <span className="tab-count">
                    {t.id === "flags" ? chain.flags.length : chain.edges.length}
                  </span>
                )}
              </Button>
            ))}
          </div>
          <div id="chain-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {loading ? (
              <div className="p-6" aria-label="Loading predicate chain" role="status">
                <p className="mb-6 text-sm text-muted-foreground">Tracing the predicate chain…</p>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton mb-4 h-9 w-full" />
                ))}
              </div>
            ) : !chain ? (
              <>
                <div className="table-toolbar">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Table2 size={14} />
                    {tabs.find((t) => t.id === tab)?.label}
                  </span>
                  <span className="text-xs text-muted-foreground">0 records</span>
                </div>
                <div className="empty-state">
                  <ChainGlyph />
                  <h3>Your research starts with a device</h3>
                  <p>
                    Search for a clearance to view its predicate ancestry and supporting evidence.
                  </p>
                </div>
                <p className="table-caption">
                  Applicant names appear as printed at clearance, with no parent-company roll-up.
                  Segments are unofficial labels.
                </p>
              </>
            ) : tab === "benchmark" ? (
              <PredicateTable
                key="benchmark"
                rows={sorted}
                columns={benchmarkColumns}
                caption="Applicant names appear as printed at clearance, with no parent-company roll-up. Segments are unofficial labels."
              />
            ) : tab === "flags" ? (
              <PredicateTable
                key="flags"
                rows={chain.flags}
                columns={flagColumns}
                empty="No flags reported for this chain."
              />
            ) : tab === "stops" ? (
              <PredicateTable
                key="stops"
                rows={stops}
                columns={[
                  { key: "stop", label: "Where the chain stops" },
                  { key: "count", label: "Number of devices" },
                ]}
                caption="Where the paper trail ends. A stop says nothing about whether a device is the original of its lineage."
              />
            ) : tab === "edges" ? (
              <PredicateTable key="edges" rows={chain.edges} columns={edgeColumns} />
            ) : (
              <>
                <div className="table-toolbar">
                  <div className="segmented" aria-label="Tree scope">
                    <Button
                      variant="ghost"
                      aria-pressed={primaryOnly}
                      onClick={() => setPrimaryOnly(true)}
                    >
                      Primary predicates only
                    </Button>
                    <Button
                      variant="ghost"
                      aria-pressed={!primaryOnly}
                      onClick={() => setPrimaryOnly(false)}
                    >
                      Full chain
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">Ancestors only</span>
                </div>
                {!primaryOnly && chain.nodes.length > 300 && (
                  <div className="notice">
                    <Info size={16} />
                    This chain has more than 300 devices. The SVG download is recommended.
                  </div>
                )}
                <div ref={treeElement} className="tree-canvas">
                  <ClientOnly fallback={<div className="empty-state">Loading tree…</div>}>
                    <Suspense fallback={<div className="empty-state">Loading tree…</div>}>
                      <PredicateTree chain={chain} primaryOnly={primaryOnly} />
                    </Suspense>
                  </ClientOnly>
                </div>
                <div className="tree-legend">
                  <span>
                    <i className="legend-swatch subject" />
                    Subject
                  </span>
                  <span>
                    <i className="legend-swatch primary" />
                    Primary
                  </span>
                  <span>
                    <i className="legend-swatch" />
                    Reference
                  </span>
                  <span>
                    <i className="legend-swatch combined" />
                    Primary + reference
                  </span>
                  <span>
                    <i className="legend-swatch unextracted" />
                    Not yet extracted
                  </span>
                  <span>
                    <i className="legend-line" />
                    Device → predicate
                  </span>
                  <span>
                    <i className="legend-line reference" />
                    Reference edge
                  </span>
                  <span>
                    <i className="legend-line low" />
                    Unreviewed LOW
                  </span>
                  <span>Dashed border: stopped</span>
                  <span className="text-destructive">Red border: TRUNCATED</span>
                  <span>Corrected label: number as printed</span>
                </div>
              </>
            )}
          </div>
        </section>
        <section className="downloads">
          <div>
            <h3>Take the evidence with you</h3>
            <p>Research files include methodology, limitations, and review fields.</p>
          </div>
          <div className="download-actions">
            <Button
              variant="outline"
              size="sm"
              disabled={!chain || loading || downloading}
              onClick={() => void download("xlsx")}
            >
              <FileSpreadsheet />
              Excel workbook
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!chain || tab !== "tree" || loading || downloading}
              title="Available in the Tree tab"
              onClick={() => void download("svg")}
            >
              <Download />
              Tree SVG
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!chain || tab !== "tree" || loading || downloading}
              title="Available in the Tree tab"
              onClick={() => void download("png")}
            >
              <Download />
              Tree PNG
            </Button>
          </div>
        </section>
        <details className="about" id="about">
          <summary>
            <ChevronRight size={15} />
            About this research & methodology
          </summary>
          <ul>
            {methodology.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </details>
      </main>
      <footer className="footer">
        <p>
          Independent research tool built from public FDA data, provided as is, not regulatory
          advice, and the author's personal work and views. Open source under the MIT License,
          Copyright (c) 2026 Asher Breverman.
        </p>
        <span>
          <ShieldCheck size={13} />
          Public · Read-only · No account needed
        </span>
      </footer>
    </div>
  );
}
