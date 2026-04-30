# AI Workflow Layer — Implementation Plan

These are the AI-powered workflows to implement on top of the widget layer.
Each hooks into the existing voice pipeline (Layer 1 → Layer 2 orchestrator → backend).

---

## 1. Auto-Decomposition

**Trigger**: Voice — "I need to add OAuth login to the app"

**Flow**:
1. User describes a feature in natural language
2. LLM breaks it into subtasks with:
   - Title, description, estimated hours
   - Dependencies between subtasks
   - Suggested assignee (based on past task history / expertise matching)
   - Priority inference from context
3. Returns a preview the user confirms or edits
4. On confirm, creates all tasks + dependencies via API

**Backend**: New endpoint `POST /api/projects/decompose/`
- Input: `{ transcript, project_id }`
- LLM call with project context (existing tasks, team, milestones)
- Output: `{ tasks: [...], dependencies: [...] }`

**Why this matters**: Eliminates the biggest friction in PM — the overhead of manually creating and linking tasks.

---

## 2. Daily Standup Bot

**Trigger**: Scheduled (morning cron) or voice — "Give me the standup"

**Flow**:
1. Query what changed since last standup:
   - Task status transitions (git commits if integrated)
   - New blockers (tasks with unresolved dependencies)
   - Overdue tasks (no activity for 48h+)
   - Velocity trend (on track vs behind)
2. Generate a narrative summary
3. Optionally speak it via TTS
4. Render as a digest widget

**Backend**: New endpoint `GET /api/projects/standup/`
- Computes diff since last call
- LLM generates human-readable summary

---

## 3. Retrospective Auto-Analysis

**Trigger**: Voice — "How did the alpha sprint go?"

**Flow**:
1. Gather completed milestone/sprint data:
   - Estimation accuracy: estimated_hours vs actual_hours per task
   - Bottleneck analysis: which tasks stalled longest, why (dependency chain inspection)
   - Velocity curve: tasks completed per day over the sprint
   - Scope changes: tasks added/removed mid-sprint
2. LLM generates a narrative retro + actionable recommendations
3. Render as a report widget with charts

**Backend**: `GET /api/projects/projects/{id}/retro/`

---

## 4. Impact Analysis

**Trigger**: Voice — "What happens if we push the API deadline by a week?"

**Flow**:
1. Parse the proposed change (which task, how much delay)
2. Trace the dependency graph forward from that task
3. Recalculate all downstream task dates
4. Identify which milestones slip
5. Show a before/after diff view (dual timeline)

**Backend**: `POST /api/projects/impact/`
- Input: `{ task_id, delay_days }` or `{ task_id, new_due_date }`
- Output: `{ affected_tasks: [...], slipped_milestones: [...], original_dates, new_dates }`

---

## 5. Smart Prioritization (WSJF / AI-ranked)

**Trigger**: Voice — "What should I work on next?"

**Flow**:
1. Score all open tasks by:
   - Business value (derived from priority + epic importance)
   - Time criticality (how close to deadline, blocking other tasks)
   - Risk reduction (is it on the critical path?)
   - Effort (estimated_hours)
   - WSJF = (value + criticality + risk) / effort
2. LLM adds qualitative reasoning
3. Return ranked list with explanations

**Backend**: `GET /api/projects/prioritize/?assignee=Rohith`

**Learning loop**: Track what user actually picks vs suggestion. Over time, weight adjustments.

---

## 6. Context-Aware Voice Commands

These extend the orchestrator's intent parser with richer understanding:

| Command | What it does |
|---------|-------------|
| "Move blocking tasks to this sprint" | Identifies tasks with `status != done` that block other tasks, assigns to current sprint |
| "Who worked on something similar before?" | Semantic search over past task descriptions, returns team members |
| "Summarize what happened while I was away" | Digest of all changes since user's last active session |
| "What's the fastest path to release?" | Critical path analysis with time estimates |
| "Rebalance the team's workload" | Suggests task reassignments to even out the people heatmap |

**Implementation**: Extend `projects/views.py:orchestrate()` intent detection + add specialized query handlers.

---

## 7. Anomaly Detection & Proactive Alerts

**Trigger**: Background monitoring (cron or real-time)

**Signals to watch**:
- Task stuck in same status for > 3 days
- Estimation accuracy dropping below threshold
- Dependency chain about to become critical
- Team member approaching capacity limit
- Milestone at risk (burndown divergence)

**Output**: Proactive notifications via event bus → alert widget or voice announcement.

**Backend**: `GET /api/projects/alerts/` + background task scheduler

---

## Implementation Priority

| Phase | Workflow | Effort | Impact |
|-------|----------|--------|--------|
| **Phase 1** | Auto-Decomposition | Medium | Very High |
| **Phase 1** | Smart Prioritization | Low | High |
| **Phase 2** | Daily Standup Bot | Medium | High |
| **Phase 2** | Impact Analysis | Medium | High |
| **Phase 3** | Retro Analysis | Medium | Medium |
| **Phase 3** | Context-Aware Commands | High | Very High |
| **Phase 4** | Anomaly Detection | High | High |

---

## Technical Notes

- All LLM calls should use the existing vLLM Qwen3.5-27B endpoint at port 8200
- Use guided JSON schema decoding for structured outputs (task lists, scores)
- Cache dependency graph computations — recompute only on task changes
- Voice responses should be concise (< 30 seconds TTS) with option to "tell me more"
- All workflows should emit events to the event bus so widgets can react in real-time
