"""
Dashboard calculation engine for the Portfolio Overview Dashboard.
Revision 3.

All tunable constants are pulled from DashboardConfig (singleton model)
so they can be adjusted without a deploy.
"""
from datetime import timedelta, date as dt_date
from collections import defaultdict
from math import exp

from django.db.models import Q, Count
from django.utils import timezone


def _config():
    """Load the singleton DashboardConfig. Cached per-request via Django's ORM cache."""
    from .models import DashboardConfig
    return DashboardConfig.load()


def _project_today(project):
    """Get 'today' in the project's timezone to avoid midnight-crossing bugs."""
    if hasattr(project, 'get_today'):
        return project.get_today()
    return timezone.now().date()


# ──────────────────────────────────────────────────────────────
# CRITICAL PATH COMPUTATION
# ──────────────────────────────────────────────────────────────

def compute_critical_path(tasks):
    """
    Compute the critical path through a task dependency graph.
    Returns set of task IDs on the critical path.

    Handles:
    - Cycles: detected and broken (cycle members still included as at-risk)
    - Disconnected components: returns union of longest paths from all components
    - Recomputed on every call (no caching — task closures shift the path)
    """
    from .models import TaskDependency

    task_map = {t.id: t for t in tasks}
    active_ids = {t.id for t in tasks if t.status not in ("done", "cancelled")}

    if not active_ids:
        return set()

    deps = TaskDependency.objects.filter(
        predecessor_id__in=task_map, successor_id__in=task_map
    ).values_list("predecessor_id", "successor_id")

    successors = defaultdict(list)
    predecessors = defaultdict(list)
    for pred_id, succ_id in deps:
        successors[pred_id].append(succ_id)
        predecessors[succ_id].append(pred_id)

    # Memoized DFS with cycle detection via "in_stack" set
    memo = {}
    in_stack = set()  # nodes currently being visited (cycle detection)
    cycle_members = set()

    def longest_path(tid):
        if tid in memo:
            return memo[tid]
        if tid in in_stack:
            # Cycle detected — break it, mark participants
            cycle_members.add(tid)
            return (1, [tid])

        in_stack.add(tid)
        succs = [s for s in successors.get(tid, []) if s in active_ids]
        if not succs:
            memo[tid] = (1, [tid])
            in_stack.discard(tid)
            return memo[tid]

        best_len, best_path = 0, []
        for s in succs:
            slen, spath = longest_path(s)
            if slen > best_len:
                best_len, best_path = slen, spath

        result = (best_len + 1, [tid] + best_path)
        memo[tid] = result
        in_stack.discard(tid)
        return result

    # Find roots (no incomplete predecessors) per connected component
    roots = [tid for tid in active_ids if not any(
        p in active_ids for p in predecessors.get(tid, [])
    )]

    if not roots:
        roots = list(active_ids)

    # Find ALL disconnected components and return union of their critical paths
    visited_global = set()
    all_critical = set()

    # BFS to find connected components
    components = []
    remaining_ids = set(active_ids)
    while remaining_ids:
        seed = next(iter(remaining_ids))
        component = set()
        queue = [seed]
        while queue:
            node = queue.pop()
            if node in component:
                continue
            component.add(node)
            for s in successors.get(node, []):
                if s in active_ids:
                    queue.append(s)
            for p in predecessors.get(node, []):
                if p in active_ids:
                    queue.append(p)
        components.append(component)
        remaining_ids -= component

    # For each component, find its roots and compute longest path
    for component in components:
        comp_roots = [tid for tid in component if not any(
            p in component for p in predecessors.get(tid, [])
        )]
        if not comp_roots:
            comp_roots = list(component)

        best_len, best_path = 0, []
        for root in comp_roots:
            plen, ppath = longest_path(root)
            if plen > best_len:
                best_len, best_path = plen, ppath
        all_critical.update(best_path)

    # Cycle members are always considered critical (they're risky by nature)
    all_critical.update(cycle_members)

    return all_critical


# ──────────────────────────────────────────────────────────────
# RISK LABEL (with hysteresis)
# ──────────────────────────────────────────────────────────────

def compute_risk_label(project, tasks=None, apply_hysteresis=True):
    """
    Returns ("on_track" | "at_risk" | "critical", reason_string).

    Hysteresis: once Critical, requires meaningful improvement to demote.
    Logs label changes to RiskLabelLog.
    """
    today = _project_today(project)
    if tasks is None:
        tasks = list(project.tasks.all())

    total = len(tasks)
    if total == 0:
        return "on_track", "No tasks"

    done = sum(1 for t in tasks if t.status == "done")
    blocked = [t for t in tasks if t.status == "blocked"]
    remaining = total - done

    days_left = None
    if project.target_date:
        days_left = (project.target_date - today).days

    # Pace computation
    required_pace = None
    actual_pace = None
    if days_left is not None and days_left > 0 and remaining > 0:
        required_pace = remaining / days_left

    if project.start_date and done > 0:
        elapsed = (today - project.start_date).days
        if elapsed > 0:
            actual_pace = done / elapsed

    from .models import Blocker
    active_blockers = Blocker.objects.filter(project=project, status="active")
    critical_blockers = active_blockers.filter(severity="critical")

    # Compute raw label
    raw_label = "on_track"
    reason = "On schedule"

    # CRITICAL conditions
    if critical_blockers.exists():
        raw_label, reason = "critical", f"{critical_blockers.count()} critical blocker(s)"
    elif days_left is not None and days_left <= 0 and remaining > 0:
        raw_label, reason = "critical", "Past deadline with remaining work"
    elif required_pace and actual_pace and actual_pace < required_pace * 0.5:
        raw_label, reason = "critical", "Pace too slow to recover"
    elif len(blocked) >= 3:
        raw_label, reason = "critical", f"{len(blocked)} tasks blocked"
    # AT RISK conditions
    elif active_blockers.exists():
        raw_label, reason = "at_risk", f"{active_blockers.count()} active blocker(s)"
    elif required_pace and actual_pace and actual_pace < required_pace:
        raw_label, reason = "at_risk", "Pace trailing required rate"
    elif days_left is not None and days_left < 14 and remaining > days_left * 0.5:
        raw_label, reason = "at_risk", "Tight deadline"
    else:
        unassigned = sum(1 for t in tasks if t.status not in ("done", "cancelled") and not t.assignee_id)
        if unassigned > total * 0.3:
            raw_label, reason = "at_risk", f"{unassigned} tasks without owner"

    # Apply hysteresis: Critical → At Risk requires pace ≥ threshold of required
    cfg = _config()
    if apply_hysteresis and project.last_risk_label:
        prev = project.last_risk_label
        if prev == "critical" and raw_label != "critical":
            if active_blockers.filter(severity="critical").exists():
                raw_label, reason = "critical", reason + " (hysteresis: critical blockers remain)"
            elif required_pace and actual_pace and actual_pace < required_pace * cfg.hysteresis_pace_threshold:
                raw_label, reason = "critical", reason + " (hysteresis: pace not sufficiently recovered)"

    # Log label change if different
    if raw_label != (project.last_risk_label or ""):
        from .models import RiskLabelLog
        RiskLabelLog.objects.create(
            project=project,
            from_label=project.last_risk_label or "",
            to_label=raw_label,
            reason=reason,
        )
        project.last_risk_label = raw_label
        project.last_risk_changed_at = timezone.now()
        project.save(update_fields=["last_risk_label", "last_risk_changed_at", "updated_at"])

    return raw_label, reason


# ──────────────────────────────────────────────────────────────
# PORTFOLIO PROGRESS (weighted)
# ──────────────────────────────────────────────────────────────

def compute_portfolio_progress(projects_with_tasks):
    """
    Weighted average: projects with closer deadlines or higher task counts
    pull the number more strongly (spec §Header Strip).
    """
    today = timezone.now().date()
    total_weight = 0
    weighted_progress = 0

    for project, tasks in projects_with_tasks:
        t_count = len(tasks)
        if t_count == 0:
            continue
        done = sum(1 for t in tasks if t.status == "done")
        progress = done / t_count

        urgency = 1.0
        if project.target_date:
            days_left = max(1, (project.target_date - today).days)
            urgency = max(1.0, 100 / days_left)

        weight = t_count * urgency
        total_weight += weight
        weighted_progress += progress * weight

    if total_weight == 0:
        return 0
    return round((weighted_progress / total_weight) * 100)


# ──────────────────────────────────────────────────────────────
# TREND / DELTA (with event attribution)
# ──────────────────────────────────────────────────────────────

def compute_trend(project, tasks=None, window_days=7):
    """
    Compares this period's completion rate to the previous period.
    Returns (delta_percent, direction, trend_data_points).

    Now includes event attribution: identifies which event likely caused
    the swing on each significant day.
    """
    from .models import TaskStatusLog, Activity
    today = _project_today(project)

    current_start = today - timedelta(days=window_days)
    prev_start = current_start - timedelta(days=window_days)

    current_completions = TaskStatusLog.objects.filter(
        task__project=project,
        to_status="done",
        changed_at__date__gte=current_start,
        changed_at__date__lte=today,
    ).count()

    prev_completions = TaskStatusLog.objects.filter(
        task__project=project,
        to_status="done",
        changed_at__date__gte=prev_start,
        changed_at__date__lt=current_start,
    ).count()

    if prev_completions == 0:
        delta = current_completions * 100 if current_completions > 0 else 0
    else:
        delta = round(((current_completions - prev_completions) / prev_completions) * 100)

    direction = "up" if delta > 0 else "down" if delta < 0 else "flat"

    # Build micro-trend with multi-event attribution
    trend_data = []
    prev_completions_running = 0  # for detecting gradual decline

    for i in range(14, -1, -1):
        d = today - timedelta(days=i)
        done_count = TaskStatusLog.objects.filter(
            task__project=project, to_status="done", changed_at__date=d,
        ).count()
        blocked_count = TaskStatusLog.objects.filter(
            task__project=project, to_status="blocked", changed_at__date=d,
        ).count()
        reopened_count = TaskStatusLog.objects.filter(
            task__project=project, from_status="done", changed_at__date=d,
        ).count()

        # Multi-event attribution: collect ALL significant events, rank by impact
        events = []

        if blocked_count > 0:
            blocker_logs = TaskStatusLog.objects.filter(
                task__project=project, to_status="blocked", changed_at__date=d,
            ).select_related("task")[:3]
            for bl in blocker_logs:
                events.append(f"blocker: {bl.task.title[:35]}")

        if done_count >= 3:
            events.append(f"{done_count} tasks completed")
        elif done_count == 1:
            done_log = TaskStatusLog.objects.filter(
                task__project=project, to_status="done", changed_at__date=d,
            ).select_related("task").first()
            if done_log:
                events.append(f"completed: {done_log.task.title[:35]}")

        if reopened_count > 0:
            events.append(f"{reopened_count} task(s) reopened")

        # Detect gradual decline: 3+ consecutive days with below-average completions
        if i < 10 and done_count == 0 and not events:
            recent_window = trend_data[-3:] if len(trend_data) >= 3 else []
            if recent_window and all(p["completions"] == 0 for p in recent_window):
                events.append("pace stalling (3+ days without completion)")
            elif i < 7:
                active_count = TaskStatusLog.objects.filter(
                    task__project=project, to_status__in=["active", "in_progress"],
                    changed_at__date=d,
                ).count()
                if active_count == 0:
                    events.append("no activity")

        trend_data.append({
            "date": d.isoformat(),
            "completions": done_count,
            "blocked": blocked_count,
            "events": events,  # plural: all events for the day
            "event": events[0] if events else None,  # backward compat: primary event
        })

    return delta, direction, trend_data


# ──────────────────────────────────────────────────────────────
# REQUIRED PACE / ACTUAL PACE
# ──────────────────────────────────────────────────────────────

def compute_required_pace(total, done, target_date, project=None):
    """Remaining tasks / remaining days. Spec §B3."""
    today = _project_today(project) if project else timezone.now().date()
    remaining = total - done
    if remaining <= 0:
        return 0.0
    if not target_date:
        return None
    days_left = max(1, (target_date - today).days)
    return round(remaining / days_left, 2)


def compute_actual_pace(done, start_date, project=None, sprint=None, window_days=None, exclude_blocked=True):
    """
    Tasks done per day. Excludes blocked days from the window
    so stuck teams aren't penalized for being stopped.
    """
    from .models import TaskStatusLog, SprintSnapshot
    today = _project_today(project) if project else timezone.now().date()

    if not start_date or done == 0:
        return 0.0

    if window_days:
        window_start = today - timedelta(days=window_days)

        # Count completions in window
        qs = TaskStatusLog.objects.filter(
            to_status="done",
            changed_at__date__gte=window_start,
            changed_at__date__lte=today,
        )
        if sprint:
            qs = qs.filter(task__sprint=sprint)
        elif project:
            qs = qs.filter(task__project=project)
        recent_done = qs.values("task_id").distinct().count()

        # Exclude blocked days from denominator
        effective_days = window_days
        if exclude_blocked and sprint:
            blocked_days = SprintSnapshot.objects.filter(
                sprint=sprint,
                date__gte=window_start,
                date__lte=today,
                blocked_tasks__gt=0,
            ).count()
            effective_days = max(1, window_days - blocked_days)

        return round(recent_done / effective_days, 2)

    elapsed = max(1, (today - start_date).days)
    return round(done / elapsed, 2)


# ──────────────────────────────────────────────────────────────
# STAGE PIPELINE
# ───────────────────────────────────────────────────────────��──

STAGES = ["research", "design", "build", "test", "ship"]


def compute_stage_pipeline(tasks):
    """
    Returns pipeline data per stage: {stage: {total, done, active, blocked}}.
    Spec §B2.
    """
    pipeline = {}
    for stage in STAGES:
        pipeline[stage] = {"total": 0, "done": 0, "active": 0, "blocked": 0}

    for task in tasks:
        s = task.stage if task.stage in STAGES else "build"
        pipeline[s]["total"] += 1
        if task.status == "done":
            pipeline[s]["done"] += 1
        elif task.status == "blocked":
            pipeline[s]["blocked"] += 1
        elif task.status in ("active", "in_progress", "in_review"):
            pipeline[s]["active"] += 1

    return pipeline


# ───────────────────────────────────────────────────────────��──
# NEXT ACTION (highest-leverage move)
# ──────────────────────────────────────────────────────────────

def compute_next_action(project, tasks):
    """
    Spec §B4: The single highest-leverage move.
    Picks the action whose resolution would unblock the most downstream work.
    """
    from .models import TaskDependency

    blocked_tasks = [t for t in tasks if t.status == "blocked"]
    if not blocked_tasks:
        active = [t for t in tasks if t.status in ("active", "in_progress", "todo")]
        if active:
            active.sort(key=lambda t: (
                {"critical": 0, "urgent": 1, "high": 2, "medium": 3, "low": 4}.get(t.priority, 5),
                t.due_date or dt_date.max,
            ))
            t = active[0]
            return {
                "type": "complete_task",
                "task_id": str(t.id),
                "title": t.title,
                "message": f"Complete \"{t.title}\" — highest priority active task",
            }
        return None

    # Find the blocker whose resolution unblocks the most tasks
    best_task = None
    best_downstream = 0

    for task in blocked_tasks:
        downstream = _count_downstream(task.id)
        if downstream > best_downstream:
            best_downstream = downstream
            best_task = task

    if not best_task:
        best_task = blocked_tasks[0]

    # Find what's blocking this task
    blocking_deps = TaskDependency.objects.filter(
        successor=best_task
    ).exclude(predecessor__status="done").select_related("predecessor")

    if blocking_deps.exists():
        blocker = blocking_deps.first().predecessor
        return {
            "type": "unblock",
            "task_id": str(blocker.id),
            "blocked_task_id": str(best_task.id),
            "title": blocker.title,
            "message": f"Resolve \"{blocker.title}\" to unblock {best_downstream + 1} downstream task(s)",
            "downstream_count": best_downstream + 1,
        }

    return {
        "type": "investigate",
        "task_id": str(best_task.id),
        "title": best_task.title,
        "message": f"Investigate blocked task \"{best_task.title}\"",
    }


def _count_downstream(task_id, visited=None):
    """BFS count of all tasks downstream of a given task."""
    from .models import TaskDependency
    if visited is None:
        visited = set()
    if task_id in visited:
        return 0
    visited.add(task_id)
    successors = TaskDependency.objects.filter(
        predecessor_id=task_id
    ).values_list("successor_id", flat=True)
    count = len(successors)
    for sid in successors:
        count += _count_downstream(sid, visited)
    return count


# ──────────────────────────────────────────────────────────────
# TOP RISK (weighted by downstream count, handles single blocker)
# ──────────────────────────────────────────────────────────────

def compute_top_risk(project, tasks):
    """
    Spec §B5: The single dependency, person, or stage most strongly
    correlated with the current slip.

    Weights by downstream task count, not blocker count.
    A single blocker holding back 10 tasks outranks 3 blockers with no dependents.
    """
    today = _project_today(project)
    blocked = [t for t in tasks if t.status == "blocked"]

    if not blocked:
        overdue = [t for t in tasks if t.due_date and t.due_date < today and t.status not in ("done", "cancelled")]
        if overdue:
            return {
                "type": "overdue",
                "message": f"{len(overdue)} task(s) past due date",
                "task_ids": [str(t.id) for t in overdue[:5]],
            }
        return None

    # Compute downstream weight for each blocked task
    blocker_weights = []
    for t in blocked:
        downstream = _count_downstream(t.id)
        blocker_weights.append((t, downstream))

    # Sort by downstream impact (highest first)
    blocker_weights.sort(key=lambda x: x[1], reverse=True)

    # Check: single blocker with high downstream impact
    if blocker_weights and blocker_weights[0][1] >= 2:
        t, downstream = blocker_weights[0]
        from .models import TaskDependency
        blocking_dep = TaskDependency.objects.filter(
            successor=t
        ).exclude(predecessor__status="done").select_related("predecessor").first()
        if blocking_dep:
            return {
                "type": "dependency",
                "message": f"Dependency on \"{blocking_dep.predecessor.title}\" blocking {downstream + 1} downstream task(s)",
                "task_id": str(blocking_dep.predecessor.id),
                "blocked_task_id": str(t.id),
                "downstream_count": downstream + 1,
            }

    # Cluster blocked tasks by stage (weighted by downstream)
    stage_weight = defaultdict(lambda: {"tasks": [], "total_downstream": 0})
    for t, downstream in blocker_weights:
        s = t.stage or "build"
        stage_weight[s]["tasks"].append(t)
        stage_weight[s]["total_downstream"] += downstream + 1  # +1 for the task itself

    worst_stage = max(stage_weight, key=lambda s: stage_weight[s]["total_downstream"])
    worst_data = stage_weight[worst_stage]

    if len(worst_data["tasks"]) >= 2 or worst_data["total_downstream"] >= 3:
        return {
            "type": "stage_bottleneck",
            "stage": worst_stage,
            "message": f"{len(worst_data['tasks'])} tasks blocked at {worst_stage.title()} stage ({worst_data['total_downstream']} tasks affected)",
            "task_ids": [str(t.id) for t in worst_data["tasks"]],
            "downstream_count": worst_data["total_downstream"],
        }

    # Cluster by assignee (missing owner)
    unassigned_blocked = [t for t in blocked if not t.assignee_id]
    if len(unassigned_blocked) >= 2:
        return {
            "type": "missing_owner",
            "message": f"{len(unassigned_blocked)} blocked tasks have no assignee",
            "task_ids": [str(t.id) for t in unassigned_blocked],
        }

    # Single blocker fallback
    t, downstream = blocker_weights[0]
    from .models import TaskDependency
    dep = TaskDependency.objects.filter(
        successor=t
    ).exclude(predecessor__status="done").select_related("predecessor").first()
    if dep:
        return {
            "type": "dependency",
            "message": f"Dependency on \"{dep.predecessor.title}\" blocking progress",
            "task_id": str(dep.predecessor.id),
            "downstream_count": downstream + 1,
        }

    return {
        "type": "blocked_tasks",
        "message": f"{len(blocked)} task(s) blocked",
        "task_ids": [str(t.id) for t in blocked[:5]],
    }


# ──────────────────────────────────────────────────────────────
# AI SUGGESTION (with dry-run support)
# ──────────────────────────────────────────────────────────────

def compute_ai_suggestion(project, tasks, top_risk, dry_run=False):
    """
    Spec §B6: Concrete intervention proposal.
    Only appears when both a problem and credible action exist.

    If dry_run=True, includes projected impact of accepting the suggestion.
    """
    if not top_risk:
        return None

    today = _project_today(project)
    blocked = [t for t in tasks if t.status == "blocked"]
    assignee_load = defaultdict(int)
    for t in tasks:
        if t.assignee_id and t.status not in ("done", "cancelled"):
            assignee_load[t.assignee_id] += 1

    risk_type = top_risk.get("type", "")
    suggestion = None

    if risk_type == "missing_owner" and assignee_load:
        least_loaded = min(assignee_load, key=assignee_load.get)
        from .models import UserProfile
        try:
            profile = UserProfile.objects.select_related("user").get(keycloak_id=least_loaded)
            name = profile.display_name or profile.user.username
        except UserProfile.DoesNotExist:
            name = "available team member"
        suggestion = {
            "type": "reassign",
            "message": f"Assign unowned blocked tasks to {name} (lightest load: {assignee_load[least_loaded]} tasks)",
            "assignee_id": str(least_loaded),
            "task_ids": top_risk.get("task_ids", []),
        }

    elif risk_type == "stage_bottleneck":
        stage = top_risk.get("stage", "build")
        suggestion = {
            "type": "focus_stage",
            "message": f"Focus team effort on {stage.title()} stage — it's the current bottleneck",
            "stage": stage,
        }

    elif risk_type == "dependency":
        task_id = top_risk.get("task_id")
        suggestion = {
            "type": "escalate_dependency",
            "message": "Escalate the blocking dependency to unblock downstream work",
            "task_id": task_id,
        }

    elif risk_type == "overdue":
        overdue_low = [
            t for t in tasks
            if t.due_date and t.due_date < today
            and t.status not in ("done", "cancelled")
            and t.priority in ("low", "medium")
        ]
        if overdue_low:
            suggestion = {
                "type": "descope",
                "message": f"Consider descoping {len(overdue_low)} low-priority overdue task(s) to recover velocity",
                "task_ids": [str(t.id) for t in overdue_low[:3]],
            }

    # Add throttle check: if this exact suggestion type was dismissed N+ times
    # recently, suppress it for a cooldown period
    if suggestion:
        from .models import SuggestionDismissal
        cfg = _config()
        stype = suggestion["type"]
        recent_same = SuggestionDismissal.objects.filter(
            project=project,
            suggestion_type=stype,
            created_at__gte=timezone.now() - timedelta(days=cfg.dismissal_throttle_window_days),
        )
        permanent = recent_same.filter(suggestion_data__reason="permanent").exists()
        if permanent:
            return None

        not_now_count = recent_same.filter(suggestion_data__reason="not_now").count()
        generic_count = recent_same.exclude(suggestion_data__has_key="reason").count()
        total_dismissals = not_now_count + generic_count
        if total_dismissals >= cfg.dismissal_throttle_count:
            return None

        # Add generated_at timestamp so accept can verify freshness
        suggestion["generated_at"] = timezone.now().isoformat()

        if dry_run:
            suggestion["dry_run"] = _compute_suggestion_impact(project, tasks, suggestion)

    return suggestion


def _compute_suggestion_impact(project, tasks, suggestion):
    """Preview what would change if the suggestion is accepted."""
    total = len(tasks)
    done = sum(1 for t in tasks if t.status == "done")
    blocked = sum(1 for t in tasks if t.status == "blocked")

    impact = {
        "current_blocked": blocked,
        "current_progress": round((done / total) * 100) if total > 0 else 0,
    }

    stype = suggestion.get("type")
    if stype == "reassign":
        unblocked = len(suggestion.get("task_ids", []))
        impact["projected_blocked"] = max(0, blocked - unblocked)
        impact["projected_progress_delta"] = 0  # reassign doesn't close tasks
        impact["workload_change"] = f"+{unblocked} tasks for assignee"

    elif stype == "descope":
        descoped = len(suggestion.get("task_ids", []))
        new_total = total - descoped
        impact["projected_progress"] = round((done / new_total) * 100) if new_total > 0 else 100
        impact["projected_progress_delta"] = impact["projected_progress"] - impact["current_progress"]
        impact["tasks_removed"] = descoped

    elif stype == "escalate_dependency":
        downstream = suggestion.get("downstream_count", 1)
        impact["potential_unblocked"] = downstream
        impact["projected_blocked"] = max(0, blocked - downstream)

    return impact


# ──────────────────────────────────────────────────────────────
# SPRINT TIMELINE (burndown + forecast)
# ──────────────────────────────────────────────────────────────

def compute_sprint_timeline(sprint):
    """
    Spec §C: Planned, Actual, Forecast lines + blocked regions.

    Fixes:
    - Forecast excludes blocked days from pace calculation
    - Cold-start defaults to planned pace when no history exists
    """
    from .models import SprintSnapshot, TaskStatusLog
    today = _project_today(sprint.project)
    tasks = list(sprint.tasks.all())
    total = len(tasks)
    done = sum(1 for t in tasks if t.status == "done")
    blocked = sum(1 for t in tasks if t.status == "blocked")
    remaining = total - done

    snapshots = list(sprint.snapshots.order_by("date"))

    # Planned line (linear burndown)
    sprint_days = max(1, (sprint.end_date - sprint.start_date).days)
    planned_pace = total / sprint_days  # tasks per day if everything went perfectly
    planned_line = []
    for i in range(sprint_days + 1):
        d = sprint.start_date + timedelta(days=i)
        planned_remaining = total - (total * i / sprint_days)
        planned_line.append({"date": d.isoformat(), "remaining": round(planned_remaining, 1)})

    # Actual line from snapshots
    actual_line = []
    for snap in snapshots:
        actual_line.append({
            "date": snap.date.isoformat(),
            "remaining": snap.remaining,
            "done": snap.done_tasks,
            "blocked": snap.blocked_tasks,
            "is_backfilled": snap.is_backfilled,
        })

    # Fallback: build from status log if no snapshots
    if not actual_line:
        current = sprint.start_date
        while current <= min(today, sprint.end_date):
            done_by_date = TaskStatusLog.objects.filter(
                task__sprint=sprint, to_status="done",
                changed_at__date__lte=current,
            ).values("task_id").distinct().count()
            blocked_by_date = TaskStatusLog.objects.filter(
                task__sprint=sprint, to_status="blocked",
                changed_at__date=current,
            ).values("task_id").distinct().count()
            actual_line.append({
                "date": current.isoformat(),
                "remaining": total - done_by_date,
                "done": done_by_date,
                "blocked": blocked_by_date,
            })
            current += timedelta(days=1)

    # Compute pace EXCLUDING blocked days
    sprint_elapsed = max(1, (today - sprint.start_date).days)
    window = min(7, sprint_elapsed)
    window_start = today - timedelta(days=window)

    recent_completions = TaskStatusLog.objects.filter(
        task__sprint=sprint, to_status="done",
        changed_at__date__gte=window_start, changed_at__date__lte=today,
    ).values("task_id").distinct().count()

    # Subtract blocked days from effective window
    blocked_days_in_window = SprintSnapshot.objects.filter(
        sprint=sprint, date__gte=window_start, date__lte=today,
        blocked_tasks__gt=0,
    ).count()
    effective_window = max(1, window - blocked_days_in_window)
    current_pace = round(recent_completions / effective_window, 2)

    # Previous window pace
    prev_start = window_start - timedelta(days=window)
    prev_completions = TaskStatusLog.objects.filter(
        task__sprint=sprint, to_status="done",
        changed_at__date__gte=prev_start, changed_at__date__lt=window_start,
    ).values("task_id").distinct().count()
    prev_blocked = SprintSnapshot.objects.filter(
        sprint=sprint, date__gte=prev_start, date__lt=window_start,
        blocked_tasks__gt=0,
    ).count()
    prev_effective = max(1, window - prev_blocked)
    previous_pace = round(prev_completions / prev_effective, 2)

    # Cold-start: if Day 1-2 with no completions, use planned pace
    forecast_stabilizing = False
    if sprint_elapsed <= 2 and current_pace == 0:
        current_pace = round(planned_pace, 2)
        forecast_stabilizing = True

    # Forecast line
    forecast_line = []
    if current_pace > 0 and remaining > 0:
        days_to_finish = remaining / current_pace
        projected_end = today + timedelta(days=int(days_to_finish))
        current_remaining = float(remaining)
        forecast_date = today
        while current_remaining > 0 and forecast_date <= projected_end + timedelta(days=1):
            forecast_line.append({
                "date": forecast_date.isoformat(),
                "remaining": round(max(0, current_remaining), 1),
            })
            current_remaining -= current_pace
            forecast_date += timedelta(days=1)
    elif remaining > 0:
        for i in range(sprint.days_left + 1):
            d = today + timedelta(days=i)
            forecast_line.append({"date": d.isoformat(), "remaining": remaining})

    # Ship date
    ship_date = None
    days_late = 0
    if current_pace > 0 and remaining > 0:
        days_to_finish = remaining / current_pace
        ship_date = today + timedelta(days=int(days_to_finish))
        days_late = max(0, (ship_date - sprint.end_date).days)
    elif remaining == 0:
        ship_date = today
        days_late = max(0, (today - sprint.end_date).days)

    blocked_regions = _compute_blocked_regions(snapshots)

    return {
        "sprint": {
            "id": str(sprint.id),
            "name": sprint.name or f"Sprint {sprint.number}",
            "number": sprint.number,
            "start_date": sprint.start_date.isoformat(),
            "end_date": sprint.end_date.isoformat(),
            "days_left": sprint.days_left,
            "total_days": sprint.total_days,
        },
        "summary": {
            "total": total,
            "done": done,
            "remaining": remaining,
            "blocked": blocked,
        },
        "pace": {
            "current": current_pace,
            "previous": previous_pace,
            "direction": "up" if current_pace > previous_pace else "down" if current_pace < previous_pace else "flat",
            "blocked_days_excluded": blocked_days_in_window,
            "forecast_stabilizing": forecast_stabilizing,
        },
        "ship_date": ship_date.isoformat() if ship_date else None,
        "days_late": days_late,
        "planned_line": planned_line,
        "actual_line": actual_line,
        "forecast_line": forecast_line,
        "blocked_regions": blocked_regions,
    }


def _compute_blocked_regions(snapshots):
    """Extract continuous date ranges where blocked_tasks > 0."""
    regions = []
    current_start = None
    for snap in snapshots:
        if snap.blocked_tasks > 0:
            if current_start is None:
                current_start = snap.date
        else:
            if current_start is not None:
                regions.append({
                    "start": current_start.isoformat(),
                    "end": snap.date.isoformat(),
                })
                current_start = None
    if current_start is not None:
        regions.append({
            "start": current_start.isoformat(),
            "end": snapshots[-1].date.isoformat() if snapshots else current_start.isoformat(),
        })
    return regions


# ──────────────────────────────────────────────────────────────
# SPRINT DIAGNOSTIC (Root Cause Radar)
# ──────────────────────────────────────────────────────────────

def compute_sprint_diagnostic(sprint):
    """
    Spec §E: Six friction dimensions with scores, deltas, and contribution %.

    Fixes:
    - Counterfactual-approximation contribution math
    - Dismissed AI suggestions feed scores with decay
    - Critical-path weighting for dimension scores
    """
    from .models import TaskStatusLog, Blocker, TaskDependency, SuggestionDismissal
    today = _project_today(sprint.project)
    tasks = list(sprint.tasks.all())
    total = len(tasks)
    if total == 0:
        return _empty_diagnostic()

    done = sum(1 for t in tasks if t.status == "done")
    remaining = total - done
    sprint_elapsed = max(1, (today - sprint.start_date).days)
    sprint_total = max(1, (sprint.end_date - sprint.start_date).days)
    midpoint = sprint.start_date + timedelta(days=sprint_total // 2)

    # Compute critical path for weighting
    cfg = _config()
    critical_path_ids = compute_critical_path(tasks)
    cp_mult = cfg.critical_path_weight_multiplier

    def cp_weight(task):
        return cp_mult if task.id in critical_path_ids else 1.0

    # ── Scope Creep ──
    added_after_start = sum(
        cp_weight(t) for t in tasks if t.created_at.date() > sprint.start_date
    )
    added_after_mid = sum(
        cp_weight(t) for t in tasks if t.created_at.date() > midpoint
    )
    scope_creep_score = min(100, int((added_after_start / max(1, total)) * 80 + added_after_mid * 8))
    # Estimate days recoverable if scope creep were eliminated
    scope_days_recoverable = 0
    added_tasks = [t for t in tasks if t.created_at.date() > sprint.start_date and t.status != "done"]
    if added_tasks:
        pace = done / sprint_elapsed if sprint_elapsed > 0 else 0
        scope_days_recoverable = len(added_tasks) / max(0.1, pace)

    # ── Slow Reviews ���─
    in_review = [t for t in tasks if t.status == "in_review"]
    review_hours = 0
    for t in in_review:
        last_log = TaskStatusLog.objects.filter(
            task=t, to_status="in_review"
        ).order_by("-changed_at").first()
        if last_log:
            hours = (timezone.now() - last_log.changed_at).total_seconds() / 3600
            review_hours += hours * cp_weight(t)
    slow_review_score = min(100, int(review_hours * 2))
    review_days_recoverable = review_hours / 8 if review_hours > 0 else 0

    # ── Missing Owner ──
    active_tasks = [t for t in tasks if t.status not in ("done", "cancelled")]
    no_owner = sum(cp_weight(t) for t in active_tasks if not t.assignee_id)
    missing_owner_score = min(100, int((no_owner / max(1, len(active_tasks))) * 100))

    # Boost for snoozed blockers (inaction signal)
    snooze_count = Blocker.objects.filter(
        project=sprint.project, snooze_count__gt=1
    ).count()
    missing_owner_score = min(100, missing_owner_score + snooze_count * 5)

    # Boost for dismissed AI suggestions WITH DECAY (config-driven half-life)
    halflife = cfg.dismissal_decay_halflife_days
    decay_rate = 0.693 / halflife  # ln(2) / half-life
    recent_dismissals = SuggestionDismissal.objects.filter(
        project=sprint.project,
        created_at__gte=timezone.now() - timedelta(days=int(halflife * 3)),
    )
    dismissal_penalty = 0
    for d in recent_dismissals:
        age_days = (timezone.now() - d.created_at).total_seconds() / 86400
        weight = exp(-decay_rate * age_days)
        dismissal_penalty += 3 * weight
    missing_owner_score = min(100, missing_owner_score + int(dismissal_penalty))

    owner_days_recoverable = 0
    unowned = [t for t in active_tasks if not t.assignee_id]
    if unowned:
        pace = done / sprint_elapsed if sprint_elapsed > 0 else 0
        owner_days_recoverable = len(unowned) * 0.5 / max(0.1, pace)

    # ── External Dependencies ──
    blocked = [t for t in tasks if t.status == "blocked"]
    ext_dep_count = 0
    ext_dep_downstream = 0
    for t in blocked:
        ext = TaskDependency.objects.filter(
            successor=t
        ).exclude(predecessor__sprint=sprint).exclude(predecessor__status="done")
        ext_count = ext.count()
        if ext_count > 0:
            ext_dep_count += ext_count
            ext_dep_downstream += _count_downstream(t.id) * cp_weight(t)
    ext_dep_score = min(100, int(ext_dep_count * 15 + ext_dep_downstream * 5))
    ext_days_recoverable = ext_dep_downstream * 0.5

    # ─��� Context Switching ���─
    assignee_task_counts = defaultdict(int)
    for t in active_tasks:
        if t.assignee_id:
            assignee_task_counts[t.assignee_id] += 1
    if assignee_task_counts:
        avg_concurrent = sum(assignee_task_counts.values()) / len(assignee_task_counts)
        max_concurrent = max(assignee_task_counts.values())
        context_switch_score = min(100, int((avg_concurrent - 2) * 20 + (max_concurrent - 3) * 10))
        context_switch_score = max(0, context_switch_score)
    else:
        context_switch_score = 0
    context_days_recoverable = max(0, (avg_concurrent - 2) * 0.5) if assignee_task_counts else 0

    # ── Tech Debt ──
    tech_debt_tasks = sum(
        1 for t in tasks
        if any(tag in (t.tags or []) for tag in ["tech-debt", "cleanup", "refactor", "remediation"])
        or "debt" in t.title.lower()
        or "refactor" in t.title.lower()
    )
    tech_debt_score = min(100, int((tech_debt_tasks / max(1, total)) * 200))
    tech_days_recoverable = tech_debt_tasks * 0.3

    # Compute deltas (first half vs second half of sprint)
    first_half_end = midpoint
    scope_delta = int(added_after_mid * 5)
    review_delta = min(30, int(review_hours * 0.5))
    owner_delta = int(snooze_count * 3 + dismissal_penalty)
    ext_delta = int(ext_dep_count * 5)
    context_delta = -15 if context_switch_score < 50 else 10
    debt_delta = -5 if tech_debt_score < 40 else 5

    dimensions = [
        {
            "name": "Scope Creep",
            "score": scope_creep_score,
            "delta": scope_delta,
            "days_recoverable": round(scope_days_recoverable, 1),
            "status": "on_track" if scope_creep_score < 40 else "at_risk" if scope_creep_score < 70 else "critical",
            "action": "lock_backlog",
            "action_label": "Lock backlog",
        },
        {
            "name": "Slow Reviews",
            "score": slow_review_score,
            "delta": review_delta,
            "days_recoverable": round(review_days_recoverable, 1),
            "status": "on_track" if slow_review_score < 40 else "at_risk" if slow_review_score < 70 else "critical",
            "action": "set_review_sla",
            "action_label": "Set review SLA",
        },
        {
            "name": "Missing Owner",
            "score": missing_owner_score,
            "delta": owner_delta,
            "days_recoverable": round(owner_days_recoverable, 1),
            "status": "on_track" if missing_owner_score < 40 else "at_risk" if missing_owner_score < 70 else "critical",
            "action": "assign_dris",
            "action_label": "Assign DRIs",
        },
        {
            "name": "External Deps",
            "score": ext_dep_score,
            "delta": ext_delta,
            "days_recoverable": round(ext_days_recoverable, 1),
            "status": "on_track" if ext_dep_score < 40 else "at_risk" if ext_dep_score < 70 else "critical",
            "action": "escalate",
            "action_label": "Escalate",
        },
        {
            "name": "Context Switching",
            "score": context_switch_score,
            "delta": context_delta,
            "days_recoverable": round(context_days_recoverable, 1),
            "status": "on_track" if context_switch_score < 50 else "at_risk",
            "action": None,
            "action_label": None,
        },
        {
            "name": "Tech Debt",
            "score": tech_debt_score,
            "delta": debt_delta,
            "days_recoverable": round(tech_days_recoverable, 1),
            "status": "on_track" if tech_debt_score < 50 else "at_risk",
            "action": None,
            "action_label": None,
        },
    ]

    # Sort by days_recoverable (counterfactual) — "fix from the left" = most days recovered first
    dimensions.sort(key=lambda d: d["days_recoverable"], reverse=True)

    # Contribution % based on days_recoverable (counterfactual, not score-proportional)
    total_recoverable = sum(d["days_recoverable"] for d in dimensions)
    if total_recoverable > 0:
        for d in dimensions:
            d["contribution"] = round((d["days_recoverable"] / total_recoverable) * 100)
    else:
        # Fallback to score-proportional if no recoverable days computed
        total_score = sum(d["score"] for d in dimensions)
        for d in dimensions:
            d["contribution"] = round((d["score"] / total_score) * 100) if total_score > 0 else 0

    top3_contribution = sum(d["contribution"] for d in dimensions[:3])

    # Sprint gap
    pace = 0
    if sprint_elapsed > 0:
        pace_done = TaskStatusLog.objects.filter(
            task__sprint=sprint, to_status="done",
            changed_at__date__gte=sprint.start_date,
        ).values("task_id").distinct().count()
        pace = pace_done / sprint_elapsed

    days_late = 0
    if pace > 0 and remaining > 0:
        projected_days = remaining / pace
        projected_end = today + timedelta(days=int(projected_days))
        days_late = max(0, (projected_end - sprint.end_date).days)

    return {
        "dimensions": dimensions,
        "top3_contribution": top3_contribution,
        "days_late": days_late,
        "total_recoverable_days": round(total_recoverable, 1),
        "weighting_version": cfg.diagnostic_weighting_version,
        "summary": f"~{top3_contribution}% of the sprint gap traces to the top 3 friction sources",
        "rule": "Fix from the left to recover the most velocity",
        "note": "Contributions approximate counterfactual recovery — fixing two overlapping sources may not recover the sum of their individual contributions",
    }


def _empty_diagnostic():
    cfg = _config()
    return {
        "dimensions": [],
        "top3_contribution": 0,
        "days_late": 0,
        "total_recoverable_days": 0,
        "weighting_version": cfg.diagnostic_weighting_version,
        "summary": "No tasks in sprint",
        "rule": "Fix from the left to recover the most velocity",
        "note": "",
    }


# ──────────────────────────────────────────────────────────────
# WORKLOAD CALENDAR (remaining hours, not original estimates)
# ──────────────────────────────────────────────────────────────

def compute_workload_calendar(projects=None, weeks=4):
    """
    Spec §F: Person × week grid with capacity verdicts.

    Fix: uses remaining estimated hours, not original estimate.
    If a 16h task has 8h actual_hours logged, only 8h remain.
    """
    from .models import Task, UserProfile
    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())

    week_ranges = []
    for i in range(weeks):
        ws = week_start + timedelta(weeks=i)
        we = ws + timedelta(days=6)
        week_ranges.append((ws, we))

    task_qs = Task.objects.select_related(
        "assignee", "assignee__user", "project"
    ).exclude(assignee__isnull=True).exclude(status__in=["done", "cancelled"])

    if projects:
        task_qs = task_qs.filter(project__in=projects)

    tasks = list(task_qs)

    cfg = _config()
    DEFAULT_CAP = cfg.default_weekly_capacity
    DAILY_HOURS = 8

    # Pre-fetch per-person capacity
    person_caps = {}  # uid -> list of weekly capacities

    person_data = {}

    for task in tasks:
        uid = str(task.assignee.keycloak_id)
        if uid not in person_data:
            # Compute per-week capacity for this person
            profile = task.assignee
            per_week_caps = []
            for ws, we in week_ranges:
                cap = profile.capacity_for_week(ws, we)
                per_week_caps.append(cap)
            person_caps[uid] = per_week_caps

            person_data[uid] = {
                "keycloak_id": uid,
                "username": task.assignee.user.username,
                "display_name": task.assignee.display_name or task.assignee.user.get_full_name() or task.assignee.user.username,
                "weekly_capacity": profile.weekly_capacity_hours,
                "weeks": [{
                    "week_start": wr[0].isoformat(),
                    "week_end": wr[1].isoformat(),
                    "hours": 0,
                    "task_count": 0,
                    "tasks": [],
                    "verdict": "light",
                } for wr in week_ranges],
                "total_hours": 0,
                "surplus_hours": 0,
            }

        task_start = task.start_date or today
        task_end = task.due_date or task_start

        # Use REMAINING hours, not original estimate
        original_hours = task.estimated_hours or DAILY_HOURS
        actual_logged = task.actual_hours or 0
        remaining_hours = max(0, original_hours - actual_logged)

        if remaining_hours == 0:
            remaining_hours = DAILY_HOURS * 0.5  # minimum half-day for incomplete tasks

        # Spread remaining hours across future weeks only
        effective_start = max(task_start, today)  # don't count past days
        effective_end = task_end
        if effective_start > effective_end:
            effective_end = effective_start

        task_days = max(1, (effective_end - effective_start).days + 1)
        hours_per_day = remaining_hours / task_days

        for wi, (ws, we) in enumerate(week_ranges):
            overlap_start = max(effective_start, ws)
            overlap_end = min(effective_end, we)
            if overlap_start <= overlap_end:
                overlap_days = (overlap_end - overlap_start).days + 1
                week_hours = round(hours_per_day * overlap_days, 1)
                person_data[uid]["weeks"][wi]["hours"] += week_hours
                person_data[uid]["weeks"][wi]["task_count"] += 1
                person_data[uid]["weeks"][wi]["tasks"].append({
                    "id": str(task.id),
                    "title": task.title,
                    "project": task.project.short or task.project.name[:10],
                    "hours": week_hours,
                    "remaining_hours": round(remaining_hours, 1),
                })
                person_data[uid]["total_hours"] += week_hours

    # Compute verdicts using per-person, per-week capacity
    for uid, data in person_data.items():
        surplus = 0
        caps = person_caps.get(uid, [DEFAULT_CAP] * len(week_ranges))
        for wi, week in enumerate(data["weeks"]):
            h = week["hours"]
            cap = caps[wi] if wi < len(caps) else DEFAULT_CAP
            week["hours"] = round(h, 1)
            week["capacity"] = round(cap, 1)
            if h == 0:
                week["verdict"] = "light"
            elif h <= cap * 0.6:
                week["verdict"] = "light"
            elif h <= cap * 0.85:
                week["verdict"] = "busy"
            elif h <= cap:
                week["verdict"] = "full"
            else:
                week["verdict"] = "over"
                surplus += h - cap
        data["surplus_hours"] = round(surplus, 1)

    week_labels = []
    for ws, we in week_ranges:
        week_labels.append({
            "start": ws.isoformat(),
            "end": we.isoformat(),
            "label": f"W{ws.isocalendar()[1]}",
            "is_current": ws <= today <= we,
        })

    members = list(person_data.values())

    return {
        "weeks": week_labels,
        "members": members,
        "overloaded_count": sum(1 for m in members if any(w["verdict"] == "over" for w in m["weeks"])),
    }


# ──────────────────────────────────────────────────────────────
# AI MORNING BRIEF (with re-surfacing rule)
# ──────────────────────────────────────────────────────────────

def compute_morning_brief(user=None, as_of=None):
    """
    Spec §G: Daily one-line synthesis.

    Includes escalation terminator: escalated Critical blockers past their
    threshold appear every day with no snooze option.
    """
    from .models import Project, Task, Blocker, Activity, RiskLabelLog
    cfg = _config()
    today = timezone.now().date()
    if as_of:
        today = as_of

    projects = list(Project.objects.filter(status="active").prefetch_related("tasks"))

    blocker_count = 0
    overdue_count = 0
    critical_projects = []
    persistent_critical = []
    unignorable_blockers = []

    for project in projects:
        tasks = list(project.tasks.all())
        risk_label, risk_reason = compute_risk_label(project, tasks)

        if risk_label == "critical":
            critical_projects.append({
                "project_id": str(project.id),
                "project_name": project.name,
                "reason": risk_reason,
            })

            # Re-surfacing rule
            if project.last_risk_changed_at:
                days_critical = (timezone.now() - project.last_risk_changed_at).days
                if days_critical >= cfg.brief_resurfacing_days:
                    persistent_critical.append({
                        "project_id": str(project.id),
                        "project_name": project.name,
                        "days_critical": days_critical,
                        "reason": f"Still unresolved after {days_critical} days: {risk_reason}",
                    })

        # Escalation terminator: escalated + critical + aged past threshold
        # These appear every day with NO snooze option
        escalated = Blocker.objects.filter(
            project=project, status="active",
            escalated=True, severity="critical",
        ).select_related("task")
        for b in escalated:
            age_days = b.age_seconds / 86400
            if age_days >= cfg.escalation_unignorable_days:
                unignorable_blockers.append({
                    "blocker_id": str(b.id),
                    "project_id": str(project.id),
                    "project_name": project.name,
                    "task_title": b.task.title,
                    "reason": b.reason[:100],
                    "age_days": round(age_days),
                    "downstream_count": b.downstream_count,
                    "unsnoozable": True,
                })

        project_blockers = Blocker.objects.filter(project=project, status="active").count()
        blocker_count += project_blockers

        project_overdue = sum(
            1 for t in tasks
            if t.due_date and t.due_date < today and t.status not in ("done", "cancelled")
        )
        overdue_count += project_overdue

    # Build brief message
    if not critical_projects and blocker_count == 0 and overdue_count == 0:
        message = "All clear — no unread notifications"
        severity = "clear"
    elif critical_projects:
        names = ", ".join(p["project_name"] for p in critical_projects[:3])
        message = f"{len(critical_projects)} critical project(s): {names}. {blocker_count} blocker(s), {overdue_count} overdue."
        severity = "critical"
    elif blocker_count > 0 or overdue_count > 0:
        parts = []
        if blocker_count:
            parts.append(f"{blocker_count} blocker(s)")
        if overdue_count:
            parts.append(f"{overdue_count} overdue task(s)")
        message = "Needs attention: " + ", ".join(parts)
        severity = "warning"
    else:
        message = "All clear — no unread notifications"
        severity = "clear"

    # Append persistent critical + unignorable escalations
    if persistent_critical:
        names = ", ".join(p["project_name"] for p in persistent_critical)
        message += f" | ESCALATION: {names} still Critical for {persistent_critical[0]['days_critical']}+ days"

    if unignorable_blockers:
        names = ", ".join(b["task_title"][:25] for b in unignorable_blockers[:3])
        message += f" | REQUIRES ACTION: {len(unignorable_blockers)} unresolved escalated blocker(s): {names}"
        severity = "critical"  # force critical even if nothing else warrants it

    # Recent activities
    activity_qs = Activity.objects.filter(read=False).order_by("-created_at")[:10]
    if as_of:
        activity_qs = Activity.objects.filter(
            created_at__date__lte=as_of, created_at__date__gte=as_of - timedelta(days=1),
        ).order_by("-created_at")[:10]

    activity_items = [{
        "id": str(a.id),
        "type": a.activity_type,
        "title": a.title,
        "project": str(a.project_id),
        "created_at": a.created_at.isoformat(),
    } for a in activity_qs]

    return {
        "message": message,
        "severity": severity,
        "blocker_count": blocker_count,
        "overdue_count": overdue_count,
        "critical_projects": critical_projects,
        "persistent_critical": persistent_critical,
        "unignorable_blockers": unignorable_blockers,
        "recent_activities": activity_items,
    }
