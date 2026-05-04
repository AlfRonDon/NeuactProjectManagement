"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { fetchCategories, createCategory, deleteCategory } from "@/lib/api";

/* ── Constants ────────────────────────────────────────── */

const CATEGORY_COLORS = [
  "#6366F1", "#14B8A6", "#EC4899", "#8B5CF6",
  "#EF4444", "#F59E0B", "#3B82F6", "#888780",
];

/* ── Types ────────────────────────────────────────────── */

interface Category {
  id: string;
  name: string;
  color: string;
  task_count?: number;
}

interface CategoryFilterProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

interface CategoriesModalProps {
  onClose: () => void;
}

/* ── CategoriesModal ──────────────────────────────────── */

export function CategoriesModal({ onClose }: CategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(Array.isArray(data) ? data : data?.results ?? []);
      setError("");
    } catch (e: any) {
      setError(e.message || "Unable to load categories");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setError("");
    } catch (e: any) {
      setError(e.message || "Unable to delete category");
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || adding) return;
    setAdding(true);
    try {
      const created = await createCategory({ name: newName.trim(), color: newColor });
      setCategories((prev) => [...prev, created]);
      setNewName("");
      setNewColor(CATEGORY_COLORS[0]);
      setError("");
    } catch (e: any) {
      setError(e.message || "Unable to create category");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl"
        style={{
          border: "1px solid #E9E5E4",
          padding: 18,
          minWidth: 360,
          maxWidth: 440,
          fontFamily: "var(--font-geist-sans, Geist, sans-serif)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#2c2c2a" }}>
            Manage categories
          </span>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ fontSize: 18, color: "#938A89", lineHeight: 1, cursor: "pointer", background: "none", border: "none" }}
          >
            ×
          </button>
        </div>
        {error && <div className="mb-3 rounded-md px-3 py-2 text-xs bg-bad-bg text-bad-fg">{error}</div>}

        {/* Category list */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid #E9E5E4" }}
        >
          {categories.map((cat, i) => {
            const count = cat.task_count ?? 0;
            const unused = count === 0;
            return (
              <div key={cat.id}>
                {i > 0 && <div style={{ height: 0.5, backgroundColor: "#E9E5E4" }} />}
                <div
                  className="flex items-center gap-2"
                  style={{ padding: "10px 12px" }}
                >
                  {/* Color dot */}
                  <span
                    className="shrink-0 rounded-full"
                    style={{ width: 14, height: 14, backgroundColor: cat.color }}
                  />
                  {/* Name */}
                  <span
                    className="flex-1 truncate"
                    style={{
                      fontSize: 12,
                      color: unused ? "#938A89" : "#2c2c2a",
                    }}
                  >
                    {cat.name}
                  </span>
                  {/* Task count pill */}
                  <span
                    className="shrink-0 rounded-full"
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      backgroundColor: "#f1efe8",
                      color: unused ? "#938A89" : "#686160",
                    }}
                  >
                    {unused ? "unused" : `${count} task${count !== 1 ? "s" : ""}`}
                  </span>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="shrink-0 hover:opacity-70 transition-opacity"
                    style={{
                      fontSize: 14,
                      color: unused ? "#EF4444" : "#938A89",
                      lineHeight: 1,
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add row */}
        <div
          className="rounded-lg flex flex-col gap-2"
          style={{ backgroundColor: "#f1efe8", padding: "10px 12px", marginTop: 10 }}
        >
          {/* Color picker */}
          <div className="flex items-center gap-1.5">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="rounded-full shrink-0 transition-shadow"
                style={{
                  width: 18,
                  height: 18,
                  backgroundColor: c,
                  cursor: "pointer",
                  border: "none",
                  boxShadow: newColor === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : "none",
                }}
              />
            ))}
          </div>
          {/* Input + button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="new category…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              className="flex-1 rounded-md outline-none"
              style={{
                fontSize: 12,
                padding: "5px 8px",
                border: "1px solid #E9E5E4",
                backgroundColor: "white",
                color: "#2c2c2a",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="rounded-md transition-opacity"
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "5px 12px",
                backgroundColor: "#378add",
                color: "white",
                border: "none",
                cursor: adding || !newName.trim() ? "default" : "pointer",
                opacity: adding || !newName.trim() ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── CategoryFilter ───────────────────────────────────── */

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(Array.isArray(data) ? data : data?.results ?? []);
      setError("");
    } catch (e: any) {
      setError(e.message || "Unable to load categories");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  };

  const hasActive = selected.length > 0;
  const firstSelectedColor = categories.find((c) => selected.includes(c.id))?.color;

  return (
    <>
      <div ref={wrapperRef} className="relative" style={{ fontFamily: "var(--font-geist-sans, Geist, sans-serif)" }}>
        {/* Filter pill button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-md transition-colors"
          style={{
            fontSize: 11,
            padding: "4px 10px",
            backgroundColor: "white",
            border: `1px solid ${hasActive ? "#2c2c2a" : "#E9E5E4"}`,
            cursor: "pointer",
            color: "#2c2c2a",
            fontFamily: "inherit",
          }}
        >
          {hasActive && firstSelectedColor && (
            <span
              className="rounded-full shrink-0"
              style={{ width: 7, height: 7, backgroundColor: firstSelectedColor }}
            />
          )}
          <span>
            Category{hasActive ? ` · ${selected.length}` : ""}
          </span>
          <span style={{ fontSize: 9, marginLeft: 2, opacity: 0.6 }}>▾</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className="absolute left-0 z-40 rounded-lg"
            style={{
              top: "calc(100% + 4px)",
              width: 240,
              backgroundColor: "white",
              border: "1px solid #E9E5E4",
              padding: 6,
            }}
          >
            {/* Header */}
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                textTransform: "uppercase",
                color: "#938A89",
                padding: "4px 8px 6px",
                letterSpacing: "0.04em",
              }}
            >
              Categories
            </div>

            {/* Rows */}
            <div>
              {error && <div className="px-2 py-2 text-xs text-bad-fg bg-bad-bg rounded-md mb-1">{error}</div>}
              {categories.map((cat) => {
                const checked = selected.includes(cat.id);
                const count = cat.task_count ?? 0;
                const unused = count === 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggle(cat.id)}
                    className="flex items-center gap-2 w-full rounded-sm transition-colors"
                    style={{
                      padding: "7px 8px",
                      backgroundColor: checked ? "#f1efe8" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      opacity: unused ? 0.55 : 1,
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    {/* Checkbox */}
                    <span
                      className="shrink-0 rounded-sm flex items-center justify-center"
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: checked ? "#2c2c2a" : "white",
                        border: checked ? "none" : "1px solid #E9E5E4",
                      }}
                    >
                      {checked && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {/* Color dot */}
                    <span
                      className="shrink-0 rounded-full"
                      style={{ width: 9, height: 9, backgroundColor: cat.color }}
                    />
                    {/* Name */}
                    <span className="flex-1 truncate" style={{ fontSize: 12, color: "#2c2c2a" }}>
                      {cat.name}
                    </span>
                    {/* Count */}
                    <span className="shrink-0" style={{ fontSize: 10, color: "#938A89" }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between"
              style={{
                borderTop: "1px solid #E9E5E4",
                padding: "6px 8px",
                marginTop: 4,
              }}
            >
              <button
                onClick={() => onChange([])}
                style={{
                  fontSize: 11,
                  color: "#938A89",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                clear
              </button>
              <button
                onClick={() => { setShowManage(true); setOpen(false); }}
                style={{
                  fontSize: 11,
                  color: "#0c447c",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                manage…
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manage modal */}
      {showManage && (
        <CategoriesModal
          onClose={() => {
            setShowManage(false);
            load(); // refresh categories after manage
          }}
        />
      )}
    </>
  );
}

export default CategoryFilter;
