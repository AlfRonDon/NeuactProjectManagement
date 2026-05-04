"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { pmBus } from "@/lib/events";
import { usePMStore } from "@/lib/store";
import { INPUT, LABEL, SECTION_TITLE, MODAL_OVERLAY, MODAL_CARD } from "@/design";

export default function CreateTaskModal({ onClose, projects }: {
  onClose: () => void;
  projects: { id: string; name: string; short: string }[];
}) {
  const users = usePMStore(s => s.users);
  const usersStatus = usePMStore(s => s.usersStatus);
  const fetchUsers = usePMStore(s => s.fetchUsers);
  const [title, setTitle] = useState("");
  const [project, setProject] = useState(projects[0]?.id || "");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [assignee, setAssignee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tags, setTags] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!project && projects[0]?.id) setProject(projects[0].id);
  }, [project, projects]);

  useEffect(() => {
    if (usersStatus === "idle") fetchUsers().catch(() => undefined);
  }, [fetchUsers, usersStatus]);

  const userOptions = users.map((u: any) => ({
    id: u.keycloak_id || u.id || u.username,
    name: u.display_name || u.name || u.username || u.email || "Unknown",
  })).filter((u: any) => Boolean(u.id));

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!project) { setError("Select a project"); return; }
    setSaving(true);
    setError("");
    try {
      const created = await usePMStore.getState().createTask({
        title: title.trim(), project, priority, status,
        assignee: assignee || undefined,
        start_date: startDate || undefined,
        due_date: dueDate || undefined,
        description: description.trim() || undefined,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        ...(tags.trim() ? { tags: tags.split(",").map(t => t.trim()).filter(Boolean) } : {}),
      } as any);
      pmBus.emit({ type: "TASK_CREATED", taskId: created?.id });
      pmBus.emit({ type: "DATA_CHANGED" });
      onClose();
    } catch (e: any) {
      setError(e.message || "Could not create task. Check the fields and try again.");
      setSaving(false);
    }
  };

  return (
    <div className={MODAL_OVERLAY} onClick={onClose}>
      <div className={`${MODAL_CARD} w-[480px] max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <span className={SECTION_TITLE}>New Task</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100"><X className="w-4 h-4 text-neutral-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className={LABEL}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" className={INPUT} autoFocus />
          </div>
          <div>
            <label className={LABEL}>Project *</label>
            <select value={project} onChange={e => setProject(e.target.value)} className={INPUT}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={INPUT}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={INPUT}>
                <option value="backlog">Backlog</option><option value="todo">To Do</option>
                <option value="active">Active</option><option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option><option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Assignee</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} className={INPUT}>
                <option value="">Unassigned</option>
                {userOptions.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={INPUT} />
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
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed description..."
                  className={`${INPUT} min-h-[60px] resize-y`} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Estimated Hours</label>
                  <input type="number" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="e.g. 8"
                    className={INPUT} min="0" step="0.5" />
                </div>
                <div>
                  <label className={LABEL}>Tags</label>
                  <input value={tags} onChange={e => setTags(e.target.value)} placeholder="frontend, bug, api" className={INPUT} />
                </div>
              </div>
            </div>
          )}

          {error && <div className="text-sm text-bad-fg bg-bad-bg border border-bad-solid/20 px-3 py-2 rounded-lg">{error}</div>}
        </div>
        <div className="px-5 py-3 border-t border-neutral-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="text-xs font-medium px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50">
            {saving ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
