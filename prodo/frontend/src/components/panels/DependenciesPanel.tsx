"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { usePMStore } from "@/lib/store";

/* ── Types ─────────────────────────────────────────────── */

interface Task {
  id: string;
  title: string;
  status: string;
}

interface Dependency {
  id: string;
  predecessor: string;
  predecessor_title?: string;
  predecessor_status?: string;
  successor: string;
  successor_title?: string;
  successor_status?: string;
  dependency_type: string;
  lag_days: number;
}

interface DependenciesPanelProps {
  projectId: string;
  tasks: Task[];
}

/* ── Status palette ───────────────────────────────────── */

const STATUS_DOT: Record<string, string> = {
  done: "#97c459",
  in_progress: "#ef9f27",
  active: "#d85a30",
  blocked: "#e24b4a",
  todo: "#85b7eb",
  backlog: "#888780",
};

const STATUS_PILL: Record<string, { bg: string; border: string; text: string; dashed?: boolean }> = {
  done:        { bg: "#c0dd97", border: "#639922", text: "#173404" },
  in_progress: { bg: "#faeeda", border: "#ba7517", text: "#412402" },
  active:      { bg: "#faece7", border: "#993c1d", text: "#4a1b0c" },
  blocked:     { bg: "#fcebeb", border: "#e24b4a", text: "#501313" },
  todo:        { bg: "#e6f1fb", border: "#378add", text: "#0c447c", dashed: true },
  backlog:     { bg: "#f1efe8", border: "#888780", text: "#888780" },
};

/* ── Helpers ──────────────────────────────────────────── */

function dotColor(status: string): string {
  return STATUS_DOT[status] ?? "#888780";
}

function isCriticalPath(dep: Dependency): boolean {
  const critical = ["blocked", "in_progress"];
  return (
    critical.includes(dep.predecessor_status ?? "") &&
    critical.includes(dep.successor_status ?? "")
  );
}

function truncate(s: string, max = 18): string {
  return s.length > max ? s.slice(0, max) + "\u2026" : s;
}

/* ── Searchable Select ────────────────────────────────── */

function SearchableSelect({
  tasks,
  value,
  onChange,
  placeholder = "pick task\u2026",
}: {
  tasks: Task[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = tasks.find((t) => t.id === value);
  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-white border rounded-md px-2.5 py-1.5 text-xs min-w-[140px] justify-between"
        style={{ borderColor: "#E9E5E4" }}
      >
        <span className="flex items-center gap-1.5 truncate">
          {selected ? (
            <>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: dotColor(selected.status) }}
              />
              <span className="truncate">{truncate(selected.title)}</span>
            </>
          ) : (
            <span style={{ color: "#888780" }}>{placeholder}</span>
          )}
        </span>
        <span style={{ color: "#888780", fontSize: 10 }}>&#9662;</span>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-56 bg-white border rounded-lg shadow-lg overflow-hidden"
          style={{ borderColor: "#E9E5E4" }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search\u2026"
            className="w-full text-xs px-3 py-2 border-b outline-none"
            style={{ borderColor: "#E9E5E4" }}
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs" style={{ color: "#888780" }}>
                No tasks found
              </div>
            )}
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-neutral-50 text-left"
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor(t.status) }}
                />
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Visual Graph (read-only) ─────────────────────────── */

function VisualGraph({ deps, tasks }: { deps: Dependency[]; tasks: Task[] }) {
  const taskMap = useMemo(() => {
    const m = new Map<string, Task>();
    tasks.forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  const critical = deps.filter(isCriticalPath);
  const other = deps.filter((d) => !isCriticalPath(d));

  function PillNode({ taskId, status }: { taskId: string; status?: string }) {
    const t = taskMap.get(taskId);
    const s = status ?? t?.status ?? "backlog";
    const style = STATUS_PILL[s] ?? STATUS_PILL.backlog;
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 shrink-0"
        style={{
          height: 28,
          backgroundColor: style.bg,
          border: `1.5px ${style.dashed ? "dashed" : "solid"} ${style.border}`,
          color: style.text,
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        {s === "blocked" && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "#e24b4a" }}
          />
        )}
        <span className="truncate max-w-[100px]">{t ? truncate(t.title, 14) : "?"}</span>
      </div>
    );
  }

  function Arrow() {
    return (
      <svg width="28" height="12" viewBox="0 0 28 12" className="shrink-0" style={{ margin: "0 -2px" }}>
        <line x1="0" y1="6" x2="22" y2="6" stroke="#888780" strokeWidth="1.2" />
        <polygon points="22,2 28,6 22,10" fill="#888780" />
      </svg>
    );
  }

  function Row({ items }: { items: Dependency[] }) {
    if (items.length === 0) return null;
    // collect unique task IDs in order
    const seen = new Set<string>();
    const ordered: { id: string; status: string }[] = [];
    items.forEach((d) => {
      if (!seen.has(d.predecessor)) {
        seen.add(d.predecessor);
        ordered.push({ id: d.predecessor, status: d.predecessor_status ?? "backlog" });
      }
      if (!seen.has(d.successor)) {
        seen.add(d.successor);
        ordered.push({ id: d.successor, status: d.successor_status ?? "backlog" });
      }
    });
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {ordered.map((node, i) => (
          <div key={node.id} className="flex items-center gap-1">
            {i > 0 && <Arrow />}
            <PillNode taskId={node.id} status={node.status} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-4 flex flex-col justify-center gap-3 overflow-x-auto"
      style={{ backgroundColor: "#f1efe8", height: 180 }}
    >
      {critical.length > 0 && (
        <div>
          <div className="text-[10px] font-medium mb-1.5" style={{ color: "#501313" }}>
            critical path
          </div>
          <Row items={critical} />
        </div>
      )}
      {other.length > 0 && (
        <div>
          <div className="text-[10px] font-medium mb-1.5" style={{ color: "#888780" }}>
            other
          </div>
          <Row items={other} />
        </div>
      )}
      {deps.length === 0 && (
        <div className="flex items-center justify-center h-full text-xs" style={{ color: "#888780" }}>
          No dependencies yet
        </div>
      )}
    </div>
  );
}

/* ── Main Panel ───────────────────────────────────────── */

export default function DependenciesPanel({ projectId, tasks }: DependenciesPanelProps) {
  const fetchDependencies = usePMStore(s => s.fetchDependencies);
  const createDependency = usePMStore(s => s.createDependency);
  const deleteDependency = usePMStore(s => s.deleteDependency);
  const [deps, setDeps] = useState<Dependency[]>([]);
  const [predecessorId, setPredecessorId] = useState("");
  const [successorId, setSuccessorId] = useState("");
  const [depType, setDepType] = useState("FS");
  const [lagDays, setLagDays] = useState(0);
  const [adding, setAdding] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [error, setError] = useState("");
  const typeRef = useRef<HTMLDivElement>(null);

  /* ── Fetch ── */
  const load = useCallback(async () => {
    try {
      const data: any = await fetchDependencies(projectId);
      if (Array.isArray(data)) setDeps(data);
      else if (data?.results) setDeps(data.results);
      setError("");
    } catch (e: any) {
      setError(e.message || "Unable to load dependencies");
    }
  }, [fetchDependencies, projectId]);

  useEffect(() => { load(); }, [load]);

  /* close type dropdown on outside click */
  useEffect(() => {
    function h(e: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Enrich deps with task info ── */
  const taskMap = useMemo(() => {
    const m = new Map<string, Task>();
    tasks.forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  const enriched: Dependency[] = useMemo(
    () =>
      deps.map((d) => {
        const p = taskMap.get(d.predecessor);
        const s = taskMap.get(d.successor);
        return {
          ...d,
          predecessor_title: d.predecessor_title ?? p?.title ?? "Unknown",
          predecessor_status: d.predecessor_status ?? p?.status ?? "backlog",
          successor_title: d.successor_title ?? s?.title ?? "Unknown",
          successor_status: d.successor_status ?? s?.status ?? "backlog",
        };
      }),
    [deps, taskMap],
  );

  const criticalCount = enriched.filter(isCriticalPath).length;

  /* ── Add ── */
  async function handleAdd() {
    if (!predecessorId || !successorId || adding) return;
    setAdding(true);
    try {
      const created = await createDependency({
        predecessor: predecessorId,
        successor: successorId,
        dependency_type: depType,
        lag_days: lagDays,
      });
      if (created) {
        setDeps((prev) => [...prev, created]);
        setPredecessorId("");
        setSuccessorId("");
        setDepType("FS");
        setLagDays(0);
      }
    } catch (e: any) {
      setError(e.message || "Unable to add dependency");
    } finally {
      setAdding(false);
    }
  }

  /* ── Delete ── */
  async function handleDelete(id: string) {
    try {
      await deleteDependency(id);
      setDeps((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      setError(e.message || "Unable to delete dependency");
    }
  }

  /* ── Dep type options ── */
  const DEP_TYPES = ["FS", "SS", "FF", "SF"];

  return (
    <div
      className="flex flex-col font-sans"
      style={{
        backgroundColor: "var(--neutral-50, #faf9f6)",
        padding: 32,
        gap: 18,
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span style={{ fontSize: 14, fontWeight: 500, color: "#1a1917" }}>
            Dependencies
          </span>
          <span style={{ fontSize: 11, color: "#888780" }}>
            {enriched.length} edge{enriched.length !== 1 ? "s" : ""} &middot;{" "}
            {criticalCount} on critical path
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* critical path pill */}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
            style={{
              fontSize: 11,
              backgroundColor: "#fcebeb",
              border: "1px solid #f09595",
              color: "#501313",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#e24b4a" }}
            />
            critical path
          </span>
          {/* other pill */}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
            style={{
              fontSize: 11,
              backgroundColor: "#f1efe8",
              color: "#888780",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#888780" }}
            />
            other
          </span>
        </div>
      </div>
      {error && <div className="text-xs rounded-md px-3 py-2" style={{ background: "#fcebeb", color: "#991B1B" }}>{error}</div>}

      {/* ── Visual graph ─────────────────────────────────── */}
      <VisualGraph deps={enriched} tasks={tasks} />

      {/* ── Add dependency row ───────────────────────────── */}
      <div
        className="flex items-center gap-2.5 flex-wrap"
        style={{
          backgroundColor: "#f1efe8",
          borderRadius: 8,
          padding: "10px 12px",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: "#888780" }}>add:</span>

        {/* Predecessor */}
        <SearchableSelect
          tasks={tasks}
          value={predecessorId}
          onChange={setPredecessorId}
          placeholder="pick task\u2026"
        />

        {/* Type selector */}
        <div ref={typeRef} className="relative">
          <button
            type="button"
            onClick={() => setTypeOpen(!typeOpen)}
            className="flex items-center gap-1 bg-white border rounded-md px-2.5 py-1.5 text-xs font-medium"
            style={{ borderColor: "#E9E5E4", color: "#1a1917" }}
          >
            {depType.toLowerCase()} <span style={{ fontSize: 10, color: "#888780" }}>&#9662;</span>
          </button>
          {typeOpen && (
            <div
              className="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg overflow-hidden"
              style={{ borderColor: "#E9E5E4" }}
            >
              {DEP_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setDepType(t);
                    setTypeOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-xs hover:bg-neutral-50 text-left"
                >
                  {t.toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Successor */}
        <SearchableSelect
          tasks={tasks}
          value={successorId}
          onChange={setSuccessorId}
          placeholder="pick task\u2026"
        />

        {/* Lag */}
        <span style={{ fontSize: 12, fontWeight: 500, color: "#888780" }}>lag</span>
        <input
          type="number"
          min={0}
          value={lagDays}
          onChange={(e) => setLagDays(Math.max(0, parseInt(e.target.value) || 0))}
          className="text-xs text-center border rounded-md bg-white outline-none"
          style={{ width: 40, padding: "6px 4px", borderColor: "#E9E5E4" }}
          placeholder="0d"
        />

        {/* Add button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !predecessorId || !successorId}
          className="rounded-md px-3.5 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#378add" }}
        >
          {adding ? "adding\u2026" : "add"}
        </button>
      </div>

      {/* ── Dependency table ─────────────────────────────── */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "0.5px solid #E9E5E4" }}
      >
        {/* Header row */}
        <div
          className="grid items-center px-3 py-2"
          style={{
            backgroundColor: "#f1efe8",
            gridTemplateColumns: "1fr 60px 1fr 40px 28px",
            gap: 8,
          }}
        >
          {["PREDECESSOR", "TYPE", "SUCCESSOR", "LAG", ""].map((label) => (
            <span
              key={label || "_del"}
              style={{
                fontSize: 10,
                fontWeight: 500,
                textTransform: "uppercase",
                color: "#888780",
                textAlign: label === "TYPE" || label === "LAG" ? "center" : "left",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Data rows */}
        {enriched.length === 0 && (
          <div className="px-3 py-4 text-center text-xs" style={{ color: "#888780" }}>
            No dependencies
          </div>
        )}
        {enriched.map((dep) => {
          const critical = isCriticalPath(dep);
          return (
            <div
              key={dep.id}
              className="grid items-center px-3 py-2 border-t"
              style={{
                gridTemplateColumns: "1fr 60px 1fr 40px 28px",
                gap: 8,
                borderColor: "#E9E5E4",
                backgroundColor: critical ? "#fcebeb" : "transparent",
                color: critical ? "#501313" : "#1a1917",
              }}
            >
              {/* Predecessor */}
              <div className="flex items-center gap-1.5 min-w-0">
                {critical && (
                  <span
                    className="inline-block w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ backgroundColor: "#e24b4a" }}
                  />
                )}
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor(dep.predecessor_status ?? "backlog") }}
                />
                <span
                  className="truncate"
                  style={{ fontSize: 12, fontWeight: critical ? 600 : 400 }}
                >
                  {dep.predecessor_title}
                </span>
              </div>

              {/* Type pill */}
              <div className="flex justify-center">
                <span
                  className="inline-flex items-center justify-center rounded-full"
                  style={{
                    width: 60,
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "2px 0",
                    backgroundColor: critical ? "#f1efe8" : "#f1efe8",
                    color: "#1a1917",
                  }}
                >
                  {dep.dependency_type}
                </span>
              </div>

              {/* Successor */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span style={{ color: "#888780", fontSize: 11 }}>&rarr;</span>
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor(dep.successor_status ?? "backlog") }}
                />
                <span
                  className="truncate"
                  style={{ fontSize: 12, fontWeight: critical ? 600 : 400 }}
                >
                  {dep.successor_title}
                </span>
              </div>

              {/* Lag */}
              <span style={{ fontSize: 11, textAlign: "center" }}>
                {dep.lag_days}d
              </span>

              {/* Delete */}
              <button
                type="button"
                onClick={() => handleDelete(dep.id)}
                className="text-center transition-colors"
                style={{ fontSize: 14, color: "#888780" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a32d2d")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#888780")}
                title="Remove dependency"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
