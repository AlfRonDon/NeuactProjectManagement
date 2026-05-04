"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { pmBus } from "@/lib/events";
import { usePMStore } from "@/lib/store";
import { INPUT, LABEL, SECTION_TITLE, MODAL_OVERLAY, MODAL_CARD } from "@/design";

export default function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const created = await usePMStore.getState().createProject({
        name: name.trim(), short: short.trim() || undefined, color, status,
        description: description.trim() || undefined,
        start_date: startDate || undefined, target_date: targetDate || undefined,
      } as any);
      pmBus.emit({ type: "PROJECT_CREATED", projectId: created?.id });
      pmBus.emit({ type: "DATA_CHANGED" });
      onClose();
    } catch (e: any) {
      setError(e.message || "Could not create project. Check the fields and try again.");
      setSaving(false);
    }
  };

  const COLORS = ["#6366F1", "#14B8A6", "#EC4899", "#8B5CF6"];

  return (
    <div className={MODAL_OVERLAY} onClick={onClose}>
      <div className={`${MODAL_CARD} w-[480px] max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <span className={SECTION_TITLE}>New Project</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100"><X className="w-4 h-4 text-neutral-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className={LABEL}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" className={INPUT} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Short Code</label>
              <input value={short} onChange={e => setShort(e.target.value)} placeholder="e.g. CCv5" maxLength={20} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={INPUT}>
                <option value="planning">Planning</option><option value="active">Active</option>
                <option value="on_hold">On Hold</option><option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Target Date</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-neutral-400" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-info-fg font-medium hover:underline">
            {showAdvanced ? "Hide advanced options" : "Show advanced options"}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-1 border-t border-neutral-100">
              <div>
                <label className={LABEL}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project about?"
                  className={`${INPUT} min-h-[60px] resize-y`} rows={3} />
              </div>
            </div>
          )}

          {error && <div className="text-sm text-bad-fg bg-bad-bg border border-bad-solid/20 px-3 py-2 rounded-lg">{error}</div>}
        </div>
        <div className="px-5 py-3 border-t border-neutral-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="text-xs font-medium px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50">
            {saving ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
