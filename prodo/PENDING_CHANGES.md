# Pending Changes — Neuact Project Management

## 1. Add `assigner` field to Task

### Backend
- **models.py:91** — Add `assigner = models.CharField(max_length=255, blank=True, default="")` after `assignee`
- Run `makemigrations` + `migrate`
- **serializers.py** — Add `"assigner"` to `TaskListSerializer.fields` (line 45) and `TaskDetailSerializer.fields` (line 70)
- **admin.py** — Add `"assigner"` to `TaskAdmin.list_display`, `list_editable`, `search_fields`, `TaskInline.fields`
- **views.py** — Add `assigner` query param filtering (same pattern as assignee, lines 70-72)

### Frontend
- **types/index.ts** — Add `assigner: string;` to `Task` interface
- **TaskDetailVariants.tsx** — Add "Assigned by" display card
- **seed_data.py** — Add `assigner` values to seeded tasks

---

## 2. Project vs Task (No code change)

| | **Project** | **Task** |
|---|---|---|
| Role | Container/bucket | Unit of work |
| Hierarchy | Top-level | Belongs to one Project |
| Fields | name, short, color, status, dates | title, assignee, assigner, priority, status, hours, deps, tags |
| Children | Tasks, Milestones, Changelogs | SubTasks, Comments |
| Statuses | planning/active/on_hold/completed/archived | backlog/todo/active/blocked/in_progress/in_review/done/cancelled |

Hierarchy: **Project > Milestone > Task > SubTask/Comment**

---

## 3. Real-Time Notifications (Polling)

### Backend — Django Signals
- Create `backend/projects/signals.py` with `post_save` handlers for Task and Project
- Wire in `apps.py` via `ready()` method

### Frontend — Polling
- Add `NOTIFICATION_RECEIVED` event type to `events.ts`
- Create `useNotificationPolling.ts` hook (poll every 15s)
- Activate in main layout
- Connect `NotificationHubLayout.tsx` to real API data instead of hardcoded mocks
