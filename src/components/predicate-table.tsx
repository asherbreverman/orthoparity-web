import { useMemo, useState } from "react";
import { ArrowDownUp, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
export interface Column {
  key: string;
  label: string;
  mono?: boolean;
  max?: number;
}
export function PredicateTable({
  rows,
  columns,
  caption,
  empty = "No records in this view.",
}: {
  rows: object[];
  columns: Column[];
  caption?: string;
  empty?: string;
}) {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(null);
  const visible = useMemo(() => {
    const filtered = rows.filter((row) =>
      Object.values(row).some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(filter.toLowerCase()),
      ),
    ) as Record<string, unknown>[];
    if (sort)
      filtered.sort((a, b) => {
        const left = a[sort.key],
          right = b[sort.key];
        const order =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left ?? "").localeCompare(String(right ?? ""));
        return sort.descending ? -order : order;
      });
    return filtered;
  }, [rows, filter, sort]);
  return (
    <>
      <div className="table-toolbar">
        <label className="filter-input">
          <Search size={14} className="text-muted-foreground" />
          <input
            aria-label="Filter table"
            placeholder="Filter this table…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        <span className="text-xs text-muted-foreground">
          {visible.length} {visible.length === 1 ? "record" : "records"}
        </span>
      </div>
      <div className="data-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  aria-sort={
                    sort?.key === c.key ? (sort.descending ? "descending" : "ascending") : "none"
                  }
                >
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setSort({ key: c.key, descending: sort?.key === c.key && !sort.descending })
                    }
                  >
                    {c.label}
                    <ArrowDownUp size={12} />
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={index}>
                {columns.map((c) => {
                  const full = String(row[c.key] ?? "—");
                  const text = c.max && full.length > c.max ? `${full.slice(0, c.max)}…` : full;
                  const url =
                    typeof row["summary_url"] === "string" && /^https:\/\//.test(row["summary_url"])
                      ? row["summary_url"]
                      : null;
                  return (
                    <td key={c.key} title={full} className={c.mono ? "font-mono" : ""}>
                      {c.key === "knumber" && url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {text}
                          <ExternalLink size={10} className="ml-1 inline" />
                        </a>
                      ) : (
                        text
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className="empty-state">
            <p>{filter ? "No records match this filter." : empty}</p>
          </div>
        )}
      </div>
      {caption && <p className="table-caption">{caption}</p>}
    </>
  );
}
