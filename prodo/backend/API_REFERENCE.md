# Neuact Project Management - API Reference

**Base URL:** `http://100.90.185.31:9017`
**Auth:** `Authorization: Bearer <keycloak_access_token>`
**Date Format:** `YYYY-MM-DD`
**ID Format:** UUID v4 (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
**Timezone:** Asia/Kolkata (IST)

---

## Auth & Users

### `GET /api/auth/me/`
Returns the current authenticated user. Also auto-creates the UserProfile on first call.

**Response:**
```json
{
  "authenticated": true,
  "keycloak_id": "be50fed4-7789-443a-95e9-95f1250a4fba",
  "username": "rohith",
  "email": "rohith@neuract.in",
  "first_name": "Rohith",
  "last_name": "Admin"
}
```

### `GET /api/users/`
List all users (for assignment dropdowns).

**Response:**
```json
[
  {
    "keycloak_id": "be50fed4-7789-443a-95e9-95f1250a4fba",
    "username": "rohith",
    "display_name": "Rohith Admin"
  }
]
```

---

## Portfolio

### `GET /api/portfolio/`
Dashboard overview of all projects with stats.

**Response:**
```json
{
  "project_count": 3,
  "total_tasks": 29,
  "total_done": 14,
  "overall_progress": 48,
  "due_soon": 5,
  "projects": [
    {
      "id": "uuid",
      "name": "Command Center v5",
      "short": "CCv5",
      "color": "#3b82f6",
      "status": "active",
      "progress": 42,
      "task_count": 12,
      "done_count": 5,
      "tasks_by_status": {
        "done": 5,
        "active": 3,
        "blocked": 1,
        "todo": 2,
        "in_progress": 1
      },
      "start_date": "2026-04-01",
      "target_date": "2026-07-31",
      "days_left": 91
    }
  ]
}
```

---

## Projects

### `GET /api/projects/projects/`
List all projects.

### `POST /api/projects/projects/`
Create a project.

**Body:**
```json
{
  "name": "Command Center v5",
  "short": "CCv5",
  "description": "Next-gen command center",
  "color": "#3b82f6",
  "status": "planning",
  "start_date": "2026-05-01",
  "target_date": "2026-08-01"
}
```

**Status options:** `planning`, `active`, `on_hold`, `completed`, `archived`

### `GET /api/projects/projects/{id}/`
Get project detail with nested tasks, milestones, changelogs.

### `PATCH /api/projects/projects/{id}/`
Partial update project.

### `DELETE /api/projects/projects/{id}/`
Delete project (cascades to all tasks, milestones, etc.).

---

## Project Views

### `GET /api/projects/projects/{id}/overview/`
Project overview with task counts, filtered task list, and team members.

**Query params:**

| Param | Values | Description |
|-------|--------|-------------|
| `filter` | `urgent` | Priority urgent/critical |
| | `today` | Due today |
| | `this_week` | Due this week (Mon-Sun) |
| | `next_week` | Due next week |
| | `not_started` | Status backlog/todo |
| `status` | `active`, `done`, `blocked`, etc. | Filter by exact status |

Combinable: `?filter=this_week&status=active`

**Response:**
```json
{
  "id": "uuid",
  "name": "Command Center v5",
  "short": "CCv5",
  "status": "active",
  "progress": 42,
  "done_count": 5,
  "task_count": 12,
  "days_left": 91,
  "target_date": "2026-07-31",
  "tasks_by_status": {
    "done": 5, "active": 3, "blocked": 1, "todo": 2, "in_progress": 1
  },
  "tasks": [ /* filtered TaskListSerializer objects */ ],
  "members": [
    {"keycloak_id": "uuid", "username": "rohith", "display_name": "Rohith Admin"}
  ]
}
```

### `GET /api/projects/projects/{id}/tasks_list/`
Lightweight filtered task list for a project (no stats/counts).

**Query params:** Same as overview (`filter`, `status`, `assignee`, `category`)

**Response:** Array of task objects.

### `GET /api/projects/projects/{id}/brief/`
Project brief with progress, days left, pipeline summary.

**Response:**
```json
{
  "id": "uuid",
  "name": "Command Center v5",
  "short": "CCv5",
  "color": "#3b82f6",
  "status": "active",
  "start_date": "2026-04-01",
  "target_date": "2026-07-31",
  "days_left": 91,
  "progress": 42,
  "task_count": 12,
  "tasks_by_status": {"done": 5, "active": 3},
  "pipeline": [
    {"category": {"id": "uuid", "name": "Research", "color": "#10b981"}, "total": 2, "done": 2},
    {"category": {"id": "uuid", "name": "Build", "color": "#f59e0b"}, "total": 4, "done": 1}
  ]
}
```

### `GET /api/projects/projects/{id}/pipeline/`
Tasks grouped by category with full task details.

**Response:**
```json
{
  "id": "uuid",
  "name": "Command Center v5",
  "short": "CCv5",
  "color": "#3b82f6",
  "status": "active",
  "pipeline": [
    {
      "category": {"id": "uuid", "name": "Research", "color": "#10b981"},
      "total": 2,
      "done": 2,
      "tasks": [ /* TaskListSerializer objects */ ]
    }
  ]
}
```

### `GET /api/projects/projects/{id}/sprint/`
Sprint health: planned vs actual dates, velocity, tasks behind schedule.

**Response:**
```json
{
  "id": "uuid",
  "name": "NeuactReport v3",
  "short": "NRv3",
  "total": 6,
  "done": 2,
  "behind": 2,
  "velocity": 1.2,
  "projected_completion": "2026-04-20",
  "target_date": "2026-06-01",
  "tasks": [
    {
      "id": "uuid",
      "title": "Update API auth header handling",
      "status": "active",
      "category": "uuid",
      "assignee": {"keycloak_id": "uuid", "username": "rohith", "display_name": "Rohith Admin"},
      "planned_start_date": "2026-04-01",
      "planned_end_date": "2026-04-05",
      "actual_start_date": "2026-04-01",
      "actual_end_date": "2026-04-07",
      "start_drift_days": 0,
      "end_drift_days": 2,
      "is_behind": true
    }
  ]
}
```

### `GET /api/projects/projects/{id}/gantt/`
Gantt chart data with dependency arrows.

**Response:**
```json
{
  "title": "Command Center v5 - Gantt",
  "variant": "multilane",
  "range": {"start": "2026-04-01", "end": "2026-07-31"},
  "lanes": [{"id": "task-uuid", "label": "Fix bento grid bug"}],
  "events": [
    {
      "id": "task-uuid",
      "laneId": "task-uuid",
      "label": "Fix bento grid bug",
      "startTime": "2026-04-10",
      "endTime": "2026-04-15",
      "status": "warning"
    }
  ],
  "annotations": [
    {"id": "milestone-uuid", "time": "2026-05-01", "label": "Phase 1 Complete", "type": "action"}
  ],
  "dependencies": [
    {"from": "task-A-uuid", "to": "task-B-uuid", "type": "FS"}
  ]
}
```

### `GET /api/projects/projects/{id}/people/`
People heatmap: work hours per team member per week.

**Response:**
```json
{
  "project": "uuid",
  "project_start": "2026-04-01",
  "weeks": ["W1", "W2", "W3", "W4"],
  "members": [
    {
      "keycloak_id": "uuid",
      "username": "rohith",
      "display_name": "Rohith Admin",
      "total_hours": 179,
      "weeks": [
        {"week": "W1", "hours": 45, "load": "over"},
        {"week": "W2", "hours": 35, "load": "heavy"}
      ]
    }
  ],
  "overloaded_count": 1
}
```

**Load classifications** (based on 40h/week):

| Load | Hours |
|------|-------|
| `none` | 0 |
| `light` | 1-20 |
| `normal` | 21-30 |
| `heavy` | 31-36 |
| `near_cap` | 37-40 |
| `over` | 40+ |

---

## Tasks

### `GET /api/projects/tasks/`
List all tasks across all projects.

**Query params:**

| Param | Description |
|-------|-------------|
| `project` | Filter by project UUID |
| `status` | Filter by status |
| `priority` | Filter by priority |
| `category` | Filter by category UUID |
| `assignee` | Filter by assignee keycloak_id |
| `assigner` | Filter by assigner keycloak_id |

### `POST /api/projects/tasks/`
Create a task.

**Body:**
```json
{
  "title": "Setup vLLM config",
  "description": "Configure vLLM for inference pipeline",
  "project": "project-uuid",
  "status": "todo",
  "priority": "high",
  "assignee": "be50fed4-7789-443a-95e9-95f1250a4fba",
  "assigner": "5f3bcb79-e089-4833-bc69-89171063fd1a",
  "category": "category-uuid",
  "planned_start_date": "2026-05-01",
  "planned_end_date": "2026-05-10",
  "start_date": "2026-05-01",
  "due_date": "2026-05-10",
  "estimated_hours": 40,
  "tags": ["backend", "ml"]
}
```

**Status options:** `backlog`, `todo`, `active`, `blocked`, `in_progress`, `in_review`, `done`, `cancelled`

**Priority options:** `low`, `medium`, `high`, `urgent`, `critical`

**Notes:**
- `assignee`/`assigner` accept **keycloak_id** (UUID from `/api/users/`)
- `planned_start_date`/`planned_end_date` = baseline dates (never auto-shifted)
- `start_date`/`due_date` = actual dates (auto-shifted by dependency cascade)

### `GET /api/projects/tasks/{id}/`
Task detail with subtasks, comments, dependencies, dependents.

**Response includes:**
```json
{
  "id": "uuid",
  "title": "Setup vLLM config",
  "status": "todo",
  "priority": "high",
  "assignee": "keycloak-uuid",
  "assignee_detail": {"keycloak_id": "uuid", "username": "rohith", "display_name": "Rohith Admin"},
  "assigner": "keycloak-uuid",
  "assigner_detail": {"keycloak_id": "uuid", "username": "abhishek", "display_name": "Abhishek Engineer"},
  "planned_start_date": "2026-05-01",
  "planned_end_date": "2026-05-10",
  "start_date": "2026-05-01",
  "due_date": "2026-05-10",
  "category": "category-uuid",
  "dependencies": [
    {"id": "uuid", "predecessor": "task-uuid", "successor": "this-task-uuid",
     "predecessor_title": "Task A", "successor_title": "This task",
     "dependency_type": "FS", "lag_days": 0}
  ],
  "dependents": [ /* tasks blocked by this task */ ],
  "subtasks": [ /* subtask objects */ ],
  "comments": [ /* comment objects */ ]
}
```

### `PATCH /api/projects/tasks/{id}/`
Partial update. Triggers date cascade if `start_date` or `due_date` changes.

```json
{"status": "done"}
{"start_date": "2026-05-05", "due_date": "2026-05-15"}
{"category": "category-uuid"}
{"assignee": "keycloak-uuid"}
```

### `DELETE /api/projects/tasks/{id}/`

---

## Subtasks

### `GET /api/projects/tasks/{task_id}/subtasks/`
### `POST /api/projects/tasks/{task_id}/subtasks/`

**Body:**
```json
{
  "title": "Write unit tests",
  "description": "Cover edge cases",
  "done": false,
  "assignee": "keycloak-uuid",
  "assigner": "keycloak-uuid",
  "priority": "medium",
  "order": 1
}
```

### `PATCH /api/projects/tasks/{task_id}/subtasks/{id}/`
### `DELETE /api/projects/tasks/{task_id}/subtasks/{id}/`

---

## Comments

### `GET /api/projects/tasks/{task_id}/comments/`
### `POST /api/projects/tasks/{task_id}/comments/`
Creates a comment and auto-generates a **mention** activity. Author is auto-set from the Bearer token.

**Body:**
```json
{"text": "Please review the config values"}
```

**Response:**
```json
{
  "id": "uuid",
  "author": "Rohith Admin",
  "avatar": "R",
  "text": "Please review the config values",
  "created_at": "2026-05-01T15:30:00+05:30"
}
```

### `DELETE /api/projects/tasks/{task_id}/comments/{id}/`

---

## Categories

### `GET /api/projects/categories/`
### `POST /api/projects/categories/`

**Body:**
```json
{"name": "Research", "color": "#10b981"}
```

**Response:**
```json
{"id": "uuid", "name": "Research", "color": "#10b981"}
```

### `PATCH /api/projects/categories/{id}/`
### `DELETE /api/projects/categories/{id}/`

---

## Task Dependencies

### `GET /api/projects/dependencies/`

| Param | Description |
|-------|-------------|
| `task` | Dependencies involving this task UUID |
| `project` | All dependencies in a project UUID |

### `POST /api/projects/dependencies/`
Creates a dependency. Auto-blocks successor if predecessor isn't done.

**Body:**
```json
{
  "predecessor": "task-A-uuid",
  "successor": "task-B-uuid",
  "dependency_type": "FS",
  "lag_days": 0
}
```

**Dependency types:**

| Type | Name | Meaning |
|------|------|---------|
| `FS` | Finish-to-Start | B starts after A finishes |
| `SS` | Start-to-Start | B starts after A starts |
| `FF` | Finish-to-Finish | B finishes after A finishes |
| `SF` | Start-to-Finish | B finishes after A starts |

**Response:**
```json
{
  "id": "uuid",
  "predecessor": "task-A-uuid",
  "successor": "task-B-uuid",
  "predecessor_title": "Setup vLLM config",
  "successor_title": "Deploy to staging",
  "dependency_type": "FS",
  "lag_days": 0,
  "created_at": "2026-05-01T..."
}
```

### `PATCH /api/projects/dependencies/{id}/`
Update type or lag_days.

### `DELETE /api/projects/dependencies/{id}/`
Removes dependency. Auto-unblocks successor if no remaining blockers.

**Auto behaviors:**
- **Create dependency** -> successor auto-blocked if predecessor not done
- **Delete dependency** -> successor auto-unblocked if no other blockers
- **Predecessor marked done** -> all successors with all predecessors done get unblocked
- **Predecessor re-opened** -> successors get re-blocked
- **Predecessor dates shift with overlap** -> successor dates cascade forward
- **Circular dependencies** -> rejected with validation error

---

## Activities

### `GET /api/projects/activities/`

| Param | Description |
|-------|-------------|
| `project` | Filter by project UUID |
| `type` | `blocker`, `overdue`, `mention`, `ai` |

Combinable: `?project={uuid}&type=blocker`

**Response:**
```json
[
  {
    "id": "uuid",
    "project": "project-uuid",
    "task": "task-uuid",
    "task_title": "Setup vLLM config",
    "activity_type": "blocker",
    "title": "Task B is blocked by Task A",
    "description": "Task cannot proceed until \"Task A\" is completed.",
    "triggered_by": "keycloak-uuid",
    "triggered_by_detail": {"keycloak_id": "uuid", "username": "rohith", "display_name": "Rohith Admin"},
    "read": false,
    "created_at": "2026-05-01T..."
  }
]
```

### `PATCH /api/projects/activities/{id}/`
Mark as read:
```json
{"read": true}
```

### `DELETE /api/projects/activities/{id}/`

**Auto-created activities:**
- `blocker` -> when a task gets blocked by a dependency
- `mention` -> when a comment is posted on a task

---

## Calendar

### `GET /api/calendar/`

| Param | Values | Default | Description |
|-------|--------|---------|-------------|
| `view` | `weekly`, `monthly`, `timeline` | `weekly` | Calendar view mode |
| `date` | `YYYY-MM-DD` | today | Reference date |
| `assignee` | keycloak UUID | - | Filter by assignee |
| `project` | project UUID | - | Filter by project |
| `weeks` | number | 4 | Timeline view range (weeks) |

#### Weekly View: `?view=weekly&date=2026-05-01`

```json
{
  "view": "weekly",
  "start": "2026-04-27",
  "end": "2026-05-03",
  "days": [
    {
      "date": "2026-05-01",
      "day_name": "Friday",
      "is_today": true,
      "task_count": 3,
      "tasks": [ /* full task objects */ ]
    }
  ]
}
```

#### Monthly View: `?view=monthly&date=2026-05-01`

```json
{
  "view": "monthly",
  "month": "May 2026",
  "start": "2026-04-27",
  "end": "2026-05-31",
  "days": [
    {
      "date": "2026-05-01",
      "is_today": true,
      "is_current_month": true,
      "task_count": 3,
      "tasks": [
        {"id": "uuid", "title": "Report template engine", "status": "todo", "priority": "medium"}
      ]
    }
  ]
}
```

#### Timeline View: `?view=timeline&date=2026-05-01&weeks=4`

```json
{
  "view": "timeline",
  "start": "2026-04-27",
  "end": "2026-05-24",
  "dates": [
    {"date": "2026-05-01", "is_today": true, "is_week_start": false}
  ],
  "members": [
    {
      "keycloak_id": "uuid",
      "username": "rohith",
      "display_name": "Rohith Admin",
      "task_count": 11,
      "tasks": [
        {"id": "uuid", "title": "Fix bento grid bug", "status": "active",
         "priority": "high", "start_date": "2026-04-26", "due_date": "2026-04-28"}
      ]
    },
    {
      "keycloak_id": null,
      "username": "unassigned",
      "display_name": "Unassigned",
      "task_count": 7,
      "tasks": [...]
    }
  ]
}
```

---

## Milestones

### `GET /api/projects/milestones/?project={uuid}`
### `POST /api/projects/milestones/`

```json
{"name": "Phase 1 Complete", "due_date": "2026-06-01", "project": "project-uuid"}
```

### `PATCH /api/projects/milestones/{id}/`
### `DELETE /api/projects/milestones/{id}/`

---

## Changelogs (read-only)

### `GET /api/projects/changelogs/?project={uuid}`
### `GET /api/projects/changelogs/{id}/`

---

## WebSocket

### Project Activities: `ws://100.90.185.31:9017/ws/activities/{project_id}/`
Receives real-time activities for a specific project.

### Global Activities: `ws://100.90.185.31:9017/ws/activities/`
Receives all activities across all projects.

**Message format (both endpoints):**
```json
{
  "id": "uuid",
  "project": "project-uuid",
  "task": "task-uuid",
  "task_title": "Fix bento grid bug",
  "activity_type": "blocker",
  "title": "Task B is blocked by Task A",
  "description": "Task cannot proceed...",
  "triggered_by": {
    "keycloak_id": "uuid",
    "username": "rohith",
    "display_name": "Rohith Admin"
  },
  "read": false,
  "created_at": "2026-05-01T15:30:00+05:30"
}
```

**Frontend usage:**
```js
const ws = new WebSocket("ws://100.90.185.31:9017/ws/activities/");
ws.onmessage = (event) => {
  const activity = JSON.parse(event.data);
  // Update activity feed UI
};
```

---

## Keycloak Token

To get a fresh access token for API calls:

```
POST http://100.90.185.31:8083/keycloak/realms/neuract-project-management/protocol/openid-connect/token

Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=neuact-pm&username=<username>&password=<password>
```

Tokens expire in 5 minutes. Use the `access_token` from the response.

---

## Notes

- All IDs are UUID v4 format
- `assignee`/`assigner` fields accept **keycloak_id** (the Keycloak `sub` claim UUID)
- Use `GET /api/users/` to list available keycloak_ids
- Date format is always `YYYY-MM-DD`
- Server runs on **daphne** (ASGI) for WebSocket support
- Comments auto-set `author` from Bearer token (no need to pass it)
- Task date changes auto-cascade to dependent tasks on overlap
- Activities are auto-created for blockers and mentions
