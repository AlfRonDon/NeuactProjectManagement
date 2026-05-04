from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response

from .models import (
    Project, Milestone, Task, SubTask, Comment, Changelog, Notification,
    Category, TaskDependency, Activity,
    Sprint, SprintSnapshot, Blocker, TaskStatusLog,
    RiskLabelLog, SuggestionDismissal,
)
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    MilestoneSerializer,
    TaskListSerializer,
    TaskDetailSerializer,
    SubTaskSerializer,
    CommentSerializer,
    ChangelogSerializer,
    NotificationSerializer,
    CategorySerializer,
    PipelineSerializer,
    ProjectBriefSerializer,
    UserProfileMinimalSerializer,
    TaskDependencySerializer,
    ActivitySerializer,
    SprintSerializer,
    SprintSnapshotSerializer,
    BlockerSerializer,
    TaskStatusLogSerializer,
    RiskLabelLogSerializer,
    SuggestionDismissalSerializer,
)
from .calculations import (
    compute_risk_label,
    compute_portfolio_progress,
    compute_trend,
    compute_required_pace,
    compute_actual_pace,
    compute_stage_pipeline,
    compute_next_action,
    compute_top_risk,
    compute_ai_suggestion,
    compute_sprint_timeline,
    compute_sprint_diagnostic,
    compute_workload_calendar,
    compute_morning_brief,
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.prefetch_related("tasks", "milestones", "changelogs")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProjectDetailSerializer
        return ProjectListSerializer

    @action(detail=True, methods=["get"])
    def overview(self, request, pk=None):
        """
        Project overview with task counts, filtered task list, and assigned members.

        Query params:
          ?filter=urgent      — priority in (urgent, critical)
          ?filter=today       — due_date is today
          ?filter=this_week   — due_date within this week (Mon–Sun)
          ?filter=next_week   — due_date within next week (Mon–Sun)
          ?filter=not_started — status in (backlog, todo)
          ?status=active      — filter by exact status
        """
        project = self.get_object()
        today = timezone.now().date()
        all_tasks = project.tasks.select_related(
            "assignee", "assignee__user", "assigner", "assigner__user", "category"
        ).prefetch_related("subtasks", "comments", "predecessor_links")

        # Task counts by status (always unfiltered)
        tasks_list = list(all_tasks)
        total = len(tasks_list)
        done = sum(1 for t in tasks_list if t.status == "done")
        by_status = {}
        for t in tasks_list:
            by_status[t.status] = by_status.get(t.status, 0) + 1

        # Progress
        progress = round((done / total) * 100) if total > 0 else 0
        days_left = (project.target_date - today).days if project.target_date else None

        # Apply filter
        filter_param = request.query_params.get("filter")
        status_param = request.query_params.get("status")
        filtered_tasks = all_tasks

        if filter_param == "urgent":
            filtered_tasks = filtered_tasks.filter(priority__in=["urgent", "critical"])
        elif filter_param == "today":
            filtered_tasks = filtered_tasks.filter(due_date=today)
        elif filter_param == "this_week":
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            filtered_tasks = filtered_tasks.filter(due_date__gte=start_of_week, due_date__lte=end_of_week)
        elif filter_param == "next_week":
            start_of_next = today - timedelta(days=today.weekday()) + timedelta(weeks=1)
            end_of_next = start_of_next + timedelta(days=6)
            filtered_tasks = filtered_tasks.filter(due_date__gte=start_of_next, due_date__lte=end_of_next)
        elif filter_param == "not_started":
            filtered_tasks = filtered_tasks.filter(status__in=["backlog", "todo"])

        if status_param:
            filtered_tasks = filtered_tasks.filter(status=status_param)

        # Unique assigned members
        member_ids = set()
        members = []
        for t in tasks_list:
            if t.assignee_id and t.assignee_id not in member_ids:
                member_ids.add(t.assignee_id)
                members.append(t.assignee)

        return Response({
            "id": str(project.id),
            "name": project.name,
            "short": project.short,
            "status": project.status,
            "progress": progress,
            "done_count": done,
            "task_count": total,
            "days_left": days_left,
            "target_date": project.target_date,
            "tasks_by_status": by_status,
            "tasks": TaskListSerializer(filtered_tasks, many=True).data,
            "members": UserProfileMinimalSerializer(members, many=True).data,
        })

    @action(detail=True, methods=["get"])
    def sprint(self, request, pk=None):
        """
        Sprint health: compares planned vs actual dates for each task,
        computes velocity, and identifies tasks behind schedule.
        """
        project = self.get_object()
        today = timezone.now().date()
        tasks = project.tasks.select_related(
            "assignee", "assignee__user", "category"
        ).all()

        task_data = []
        total = 0
        done = 0
        behind = 0

        for t in tasks:
            total += 1
            is_done = t.status == "done"
            if is_done:
                done += 1

            # Calculate drift (days) between planned and actual
            start_drift = None
            end_drift = None
            is_behind = False
            if t.planned_start_date and t.start_date:
                start_drift = (t.start_date - t.planned_start_date).days
            if t.planned_end_date and t.due_date:
                end_drift = (t.due_date - t.planned_end_date).days

            # A task is "behind" if actual end is later than planned, or
            # it's not done and planned_end_date has passed
            if end_drift and end_drift > 0:
                is_behind = True
            elif not is_done and t.planned_end_date and t.planned_end_date < today:
                is_behind = True

            if is_behind:
                behind += 1

            task_data.append({
                "id": str(t.id),
                "title": t.title,
                "status": t.status,
                "category": t.category_id,
                "assignee": UserProfileMinimalSerializer(t.assignee).data if t.assignee else None,
                "planned_start_date": t.planned_start_date,
                "planned_end_date": t.planned_end_date,
                "actual_start_date": t.start_date,
                "actual_end_date": t.due_date,
                "start_drift_days": start_drift,
                "end_drift_days": end_drift,
                "is_behind": is_behind,
            })

        # Velocity: tasks done per day since project start
        velocity = None
        project_start = project.start_date
        if project_start and done > 0:
            elapsed = (today - project_start).days
            if elapsed > 0:
                velocity = round(done / elapsed, 1)

        # Projected completion: remaining tasks / velocity
        projected_completion = None
        remaining = total - done
        if velocity and velocity > 0 and remaining > 0:
            days_needed = remaining / velocity
            projected_completion = (today + timedelta(days=int(days_needed))).isoformat()

        return Response({
            "id": str(project.id),
            "name": project.name,
            "short": project.short,
            "total": total,
            "done": done,
            "behind": behind,
            "velocity": velocity,
            "projected_completion": projected_completion,
            "target_date": project.target_date,
            "tasks": task_data,
        })

    @action(detail=True, methods=["get"])
    def people(self, request, pk=None):
        """
        People heatmap: work hours per team member per week.
        Weeks start from project start_date.
        Hours are spread evenly across the weeks a task spans.
        """
        from math import ceil

        project = self.get_object()
        today = timezone.now().date()
        project_start = project.start_date
        if not project_start:
            return Response({"error": "Project has no start_date set."}, status=400)

        tasks = project.tasks.select_related(
            "assignee", "assignee__user"
        ).exclude(assignee__isnull=True).all()

        def get_week_number(date):
            """Week number relative to project start (W1, W2, ...)"""
            return (date - project_start).days // 7 + 1

        # Collect hours per member per week
        member_weeks = {}  # keycloak_id -> {week_num: hours}
        member_info = {}   # keycloak_id -> {username, display_name, role}

        for task in tasks:
            if not task.start_date:
                continue

            assignee = task.assignee
            uid = str(assignee.keycloak_id)

            if uid not in member_info:
                member_info[uid] = {
                    "keycloak_id": uid,
                    "username": assignee.user.username,
                    "display_name": assignee.display_name or assignee.user.get_full_name() or assignee.user.username,
                }
                member_weeks[uid] = {}

            # Count actual work hours per day (9:30 AM start)
            from datetime import datetime, time as dt_time
            work_start = dt_time(9, 30)
            work_end = dt_time(18, 30)  # 9h work day
            full_day_hours = 9.0

            task_start = max(task.start_date, project_start)
            task_end = task.due_date or task.start_date
            if task_end < task_start:
                continue

            count_until = min(task_end, today)
            now = timezone.localtime(timezone.now())
            current = task_start
            while current <= count_until:
                wk = get_week_number(current)
                if current < today:
                    # Past day: full work day
                    hours = full_day_hours
                else:
                    # Today: from 9:30 AM to now
                    current_time = now.time()
                    if current_time < work_start:
                        hours = 0
                    elif current_time > work_end:
                        hours = full_day_hours
                    else:
                        started = datetime.combine(today, work_start)
                        current_dt = datetime.combine(today, current_time)
                        hours = round((current_dt - started).seconds / 3600, 1)
                member_weeks[uid][wk] = member_weeks[uid].get(wk, 0) + hours
                current += timedelta(days=1)

        # Build week labels
        all_weeks = set()
        for weeks in member_weeks.values():
            all_weeks.update(weeks.keys())

        if not all_weeks:
            return Response({
                "project": str(project.id),
                "project_start": project.start_date,
                "weeks": [],
                "members": [],
            })

        max_week = max(all_weeks)
        week_labels = [f"W{w}" for w in range(1, max_week + 1)]

        # Build member data
        members = []
        cap = 40  # default weekly capacity
        for uid, info in member_info.items():
            weeks_data = []
            total_hours = 0
            for w in range(1, max_week + 1):
                hours = round(member_weeks[uid].get(w, 0), 1)
                total_hours += hours
                # Load classification
                if hours == 0:
                    load = "none"
                elif hours <= cap * 0.5:
                    load = "light"
                elif hours <= cap * 0.75:
                    load = "normal"
                elif hours <= cap * 0.9:
                    load = "heavy"
                elif hours <= cap:
                    load = "near_cap"
                else:
                    load = "over"
                weeks_data.append({"week": f"W{w}", "hours": hours, "load": load})
            info["weeks"] = weeks_data
            info["total_hours"] = round(total_hours, 1)
            members.append(info)

        # Count overloaded members (any week over cap)
        overloaded = sum(
            1 for m in members
            if any(w["load"] == "over" for w in m["weeks"])
        )

        return Response({
            "project": str(project.id),
            "project_start": project.start_date,
            "weeks": week_labels,
            "members": members,
            "overloaded_count": overloaded,
        })

    @action(detail=True, methods=["get"])
    def tasks_list(self, request, pk=None):
        """
        Filtered task list for a project.

        Query params:
          ?filter=urgent | today | this_week | next_week | not_started
          ?status=active
          ?assignee=<keycloak-uuid>
          ?category=<category-uuid>
        """
        project = self.get_object()
        today = timezone.now().date()
        tasks = project.tasks.select_related(
            "assignee", "assignee__user", "assigner", "assigner__user", "category"
        ).prefetch_related("subtasks", "comments", "predecessor_links")

        filter_param = request.query_params.get("filter")
        if filter_param == "urgent":
            tasks = tasks.filter(priority__in=["urgent", "critical"])
        elif filter_param == "today":
            tasks = tasks.filter(due_date=today)
        elif filter_param == "this_week":
            start_of_week = today - timedelta(days=today.weekday())
            tasks = tasks.filter(due_date__gte=start_of_week, due_date__lte=start_of_week + timedelta(days=6))
        elif filter_param == "next_week":
            start_of_next = today - timedelta(days=today.weekday()) + timedelta(weeks=1)
            tasks = tasks.filter(due_date__gte=start_of_next, due_date__lte=start_of_next + timedelta(days=6))
        elif filter_param == "not_started":
            tasks = tasks.filter(status__in=["backlog", "todo"])

        for param, field in [("status", "status"), ("assignee", "assignee_id"), ("category", "category_id")]:
            val = request.query_params.get(param)
            if val:
                tasks = tasks.filter(**{field: val})

        return Response(TaskListSerializer(tasks, many=True).data)

    @action(detail=True, methods=["get"])
    def brief(self, request, pk=None):
        project = self.get_object()
        return Response(ProjectBriefSerializer(project).data)

    @action(detail=True, methods=["get"])
    def pipeline(self, request, pk=None):
        project = self.get_object()
        return Response(PipelineSerializer(project).data)

    @action(detail=True, methods=["get"], url_path="dashboard")
    def dashboard(self, request, pk=None):
        """
        Full project dashboard panel (Spec §B).
        Returns progress bar, stage pipeline, required pace, next action, top risk, AI suggestion.
        """
        project = self.get_object()
        today = timezone.now().date()
        tasks = list(project.tasks.select_related(
            "assignee", "assignee__user", "category"
        ).all())

        total = len(tasks)
        done = sum(1 for t in tasks if t.status == "done")
        active = sum(1 for t in tasks if t.status in ("active", "in_progress"))
        blocked = sum(1 for t in tasks if t.status == "blocked")
        in_review = sum(1 for t in tasks if t.status == "in_review")

        progress = round((done / total) * 100) if total > 0 else 0
        days_left = (project.target_date - today).days if project.target_date else None

        # Risk label
        risk_label, risk_reason = compute_risk_label(project, tasks)

        # Required & actual pace
        req_pace = compute_required_pace(total, done, project.target_date, project=project)
        act_pace = compute_actual_pace(done, project.start_date, project=project)

        # Stage pipeline
        pipeline = compute_stage_pipeline(tasks)

        # Trend
        delta, direction, trend_data = compute_trend(project, tasks)

        # Next action
        next_action = compute_next_action(project, tasks)

        # Top risk
        top_risk = compute_top_risk(project, tasks)

        # AI suggestion (with dry_run if requested)
        dry_run = request.query_params.get("dry_run", "").lower() in ("true", "1", "yes")
        ai_suggestion = compute_ai_suggestion(project, tasks, top_risk, dry_run=dry_run)

        return Response({
            "id": str(project.id),
            "name": project.name,
            "short": project.short,
            "color": project.color,
            "status": project.status,
            "progress": progress,
            "days_left": days_left,
            "target_date": project.target_date,
            "start_date": project.start_date,
            # Progress bar (§B1)
            "progress_bar": {
                "done": done,
                "active": active,
                "blocked": blocked,
                "in_review": in_review,
                "total": total,
            },
            # Risk label (§A2)
            "risk": {
                "label": risk_label,
                "reason": risk_reason,
            },
            # Stage pipeline (§B2)
            "pipeline": pipeline,
            # Pace (§B3)
            "pace": {
                "required": req_pace,
                "actual": act_pace,
            },
            # Trend (§A4)
            "trend": {
                "delta": delta,
                "direction": direction,
                "data": trend_data,
            },
            # Next action (§B4)
            "next_action": next_action,
            # Top risk (§B5)
            "top_risk": top_risk,
            # AI suggestion (§B6)
            "ai_suggestion": ai_suggestion,
        })

    @action(detail=True, methods=["get"], url_path="sprint-timeline")
    def sprint_timeline(self, request, pk=None):
        """
        Sprint burndown timeline (Spec §C).
        ?sprint=<uuid> — specific sprint (default: active sprint).
        """
        project = self.get_object()
        sprint_id = request.query_params.get("sprint")

        if sprint_id:
            try:
                sprint = Sprint.objects.get(id=sprint_id, project=project)
            except Sprint.DoesNotExist:
                return Response({"error": "Sprint not found"}, status=404)
        else:
            sprint = Sprint.objects.filter(project=project, status="active").first()
            if not sprint:
                sprint = Sprint.objects.filter(project=project).first()
            if not sprint:
                return Response({"error": "No sprints found for this project"}, status=404)

        data = compute_sprint_timeline(sprint)
        return Response(data)

    @action(detail=True, methods=["get"], url_path="blockers-panel")
    def blockers_panel(self, request, pk=None):
        """
        Blockers panel (Spec §D).
        Returns active blockers and overdue tasks.
        """
        project = self.get_object()
        today = timezone.now().date()

        # Wake up snoozed blockers that have expired
        Blocker.objects.filter(
            project=project, status="snoozed",
            snooze_until__lte=timezone.now(),
        ).update(status="active")

        # Active blockers
        active_blockers = Blocker.objects.filter(
            project=project, status="active"
        ).select_related(
            "task", "assigned_to", "assigned_to__user",
            "reported_by", "reported_by__user"
        )

        # Auto-promote to critical
        for b in active_blockers:
            b.check_auto_critical()

        # Re-fetch after promotion
        active_blockers = Blocker.objects.filter(
            project=project, status="active"
        ).select_related(
            "task", "assigned_to", "assigned_to__user",
            "reported_by", "reported_by__user"
        )

        # Overdue tasks (§D4)
        tasks = project.tasks.select_related("assignee", "assignee__user").all()
        overdue_tasks = [
            t for t in tasks
            if t.due_date and t.due_date < today and t.status not in ("done", "cancelled")
        ]

        # Snoozed blockers
        snoozed = Blocker.objects.filter(
            project=project, status="snoozed"
        ).select_related("task")

        return Response({
            "blockers": BlockerSerializer(active_blockers, many=True).data,
            "blocker_count": active_blockers.count(),
            "critical_count": active_blockers.filter(severity="critical").count(),
            "overdue": [{
                "id": str(t.id),
                "title": t.title,
                "status": t.status,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "days_overdue": (today - t.due_date).days if t.due_date else 0,
                "assignee": UserProfileMinimalSerializer(t.assignee).data if t.assignee else None,
                "has_progress": t.status in ("active", "in_progress", "in_review"),
            } for t in overdue_tasks],
            "overdue_count": len(overdue_tasks),
            "snoozed_count": snoozed.count(),
        })

    @action(detail=True, methods=["get"], url_path="diagnostic")
    def diagnostic(self, request, pk=None):
        """
        Sprint diagnostic / root cause radar (Spec §E).
        ?sprint=<uuid> — specific sprint (default: active sprint).
        """
        project = self.get_object()
        sprint_id = request.query_params.get("sprint")

        if sprint_id:
            try:
                sprint = Sprint.objects.get(id=sprint_id, project=project)
            except Sprint.DoesNotExist:
                return Response({"error": "Sprint not found"}, status=404)
        else:
            sprint = Sprint.objects.filter(project=project, status="active").first()
            if not sprint:
                sprint = Sprint.objects.filter(project=project).first()
            if not sprint:
                return Response({"error": "No sprints found for this project"}, status=404)

        data = compute_sprint_diagnostic(sprint)
        return Response(data)

    @action(detail=True, methods=["get"])
    def gantt(self, request, pk=None):
        project = self.get_object()
        tasks = project.tasks.all()
        lanes, events = [], []
        for task in tasks:
            lid = str(task.id)
            lanes.append({"id": lid, "label": task.title[:30]})
            sc = {"backlog": "idle", "todo": "neutral", "in_progress": "warning", "active": "warning", "blocked": "warning", "in_review": "maintenance", "done": "success"}.get(task.status, "neutral")
            if task.start_date and task.due_date:
                events.append({"id": lid, "laneId": lid, "label": task.title[:30], "startTime": task.start_date.isoformat(), "endTime": task.due_date.isoformat(), "status": sc})
        annotations = [{"id": str(m.id), "time": m.due_date.isoformat(), "label": m.name, "type": "action"} for m in project.milestones.all() if m.due_date]
        all_dates = [t.start_date for t in tasks if t.start_date] + [t.due_date for t in tasks if t.due_date]
        rs = min(all_dates).isoformat() if all_dates else (project.start_date or project.created_at.date()).isoformat()
        re = max(all_dates).isoformat() if all_dates else (project.target_date or project.created_at.date()).isoformat()
        deps = TaskDependency.objects.filter(predecessor__project=project).values(
            "predecessor_id", "successor_id", "dependency_type"
        )
        dep_links = [{"from": str(d["predecessor_id"]), "to": str(d["successor_id"]), "type": d["dependency_type"]} for d in deps]
        return Response({"title": f"{project.name} — Gantt", "variant": "multilane", "range": {"start": rs, "end": re}, "lanes": lanes, "events": events, "annotations": annotations, "dependencies": dep_links})


class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        pid = self.request.query_params.get("project")
        return qs.filter(project_id=pid) if pid else qs


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related(
        "assignee", "assignee__user", "assigner", "assigner__user", "category"
    ).prefetch_related("subtasks", "comments", "predecessor_links", "successor_links")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TaskDetailSerializer
        return TaskListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        for param, field in [("project", "project_id"), ("status", "status"), ("priority", "priority"), ("category", "category_id"), ("assignee", "assignee_id"), ("assigner", "assigner_id")]:
            val = self.request.query_params.get(param)
            if val:
                qs = qs.filter(**{field: val})
        return qs

    @action(detail=True, methods=["get"])
    def detail_full(self, request, pk=None):
        task = self.get_object()
        return Response(TaskDetailSerializer(task).data)


class SubTaskViewSet(viewsets.ModelViewSet):
    serializer_class = SubTaskSerializer

    def get_queryset(self):
        return SubTask.objects.select_related(
            "assignee", "assignee__user", "assigner", "assigner__user"
        ).filter(task_id=self.kwargs.get("task_pk"))

    def perform_create(self, serializer):
        serializer.save(task_id=self.kwargs["task_pk"])


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer

    def get_queryset(self):
        return Comment.objects.filter(task_id=self.kwargs.get("task_pk"))

    def perform_create(self, serializer):
        author = ""
        if self.request.user and self.request.user.is_authenticated:
            author = self.request.user.get_full_name() or self.request.user.username
        serializer.save(task_id=self.kwargs["task_pk"], author=author)


class ChangelogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChangelogSerializer

    def get_queryset(self):
        pid = self.request.query_params.get("project")
        qs = Changelog.objects.prefetch_related("entries")
        return qs.filter(project_id=pid) if pid else qs


class TaskDependencyViewSet(viewsets.ModelViewSet):
    serializer_class = TaskDependencySerializer
    queryset = TaskDependency.objects.select_related("predecessor", "successor")

    def get_queryset(self):
        qs = super().get_queryset()
        task_id = self.request.query_params.get("task")
        if task_id:
            qs = qs.filter(Q(predecessor_id=task_id) | Q(successor_id=task_id))
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(predecessor__project_id=project_id)
        return qs


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    queryset = Activity.objects.select_related("task", "triggered_by", "triggered_by__user")

    def get_queryset(self):
        qs = super().get_queryset()
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        activity_type = self.request.query_params.get("type")
        if activity_type:
            qs = qs.filter(activity_type=activity_type)
        return qs


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer


@api_view(["GET"])
def portfolio_view(request):
    """
    Portfolio overview — all projects with stats, task counts, progress.
    """
    today = timezone.now().date()
    projects = Project.objects.prefetch_related("tasks").all()

    total_tasks_all = 0
    done_tasks_all = 0
    due_soon = 0
    project_data = []

    for p in projects:
        tasks = list(p.tasks.all())
        total = len(tasks)
        done = sum(1 for t in tasks if t.status == "done")
        total_tasks_all += total
        done_tasks_all += done

        by_status = {}
        for t in tasks:
            by_status[t.status] = by_status.get(t.status, 0) + 1
            if t.due_date and t.due_date <= today + timedelta(days=7) and t.status not in ("done", "cancelled"):
                due_soon += 1

        progress = round((done / total) * 100) if total > 0 else 0
        days_left = (p.target_date - today).days if p.target_date else None

        project_data.append({
            "id": str(p.id),
            "name": p.name,
            "short": p.short,
            "color": p.color,
            "status": p.status,
            "progress": progress,
            "task_count": total,
            "done_count": done,
            "tasks_by_status": by_status,
            "start_date": p.start_date,
            "target_date": p.target_date,
            "days_left": days_left,
        })

    overall_progress = round((done_tasks_all / total_tasks_all) * 100) if total_tasks_all > 0 else 0

    return Response({
        "project_count": len(project_data),
        "total_tasks": total_tasks_all,
        "total_done": done_tasks_all,
        "overall_progress": overall_progress,
        "due_soon": due_soon,
        "projects": project_data,
    })


# ──────────────────────────────────────────────────────────────
# PORTFOLIO DASHBOARD (Spec §Header Strip + §A)
# ──────────────────────────────────────────────────────────────

@api_view(["GET"])
def portfolio_dashboard_view(request):
    """
    Full portfolio dashboard — Header Strip + Portfolio Overview Cards.
    Spec §Header Strip: weighted progress, task summary, next deadline.
    Spec §A: Per-project cards with progress, risk, days left, trend, delta.
    """
    today = timezone.now().date()
    projects = Project.objects.filter(
        status__in=["active", "planning"]
    ).prefetch_related("tasks")

    projects_with_tasks = []
    total_tasks = 0
    total_done = 0
    next_deadline = None
    next_deadline_project = None

    cards = []
    for p in projects:
        tasks = list(p.tasks.all())
        projects_with_tasks.append((p, tasks))
        total = len(tasks)
        done = sum(1 for t in tasks if t.status == "done")
        total_tasks += total
        total_done += done

        progress = round((done / total) * 100) if total > 0 else 0
        days_left = (p.target_date - today).days if p.target_date else None

        # Track next deadline
        if p.target_date and (next_deadline is None or p.target_date < next_deadline):
            next_deadline = p.target_date
            next_deadline_project = p.name

        # Nearest unmet milestone
        nearest_milestone = p.milestones.filter(
            completed=False, due_date__gte=today
        ).order_by("due_date").first()

        if nearest_milestone and (next_deadline is None or nearest_milestone.due_date < next_deadline):
            next_deadline = nearest_milestone.due_date
            next_deadline_project = p.name

        # Risk label
        risk_label, risk_reason = compute_risk_label(p, tasks)

        # Trend
        delta, direction, trend_data = compute_trend(p, tasks)

        cards.append({
            "id": str(p.id),
            "name": p.name,
            "short": p.short,
            "color": p.color,
            "progress": progress,
            "task_count": total,
            "done_count": done,
            "days_left": days_left,
            "target_date": p.target_date,
            "risk": {"label": risk_label, "reason": risk_reason},
            "trend": {"delta": delta, "direction": direction, "data": trend_data},
        })

    # Header strip
    portfolio_progress = compute_portfolio_progress(projects_with_tasks)
    next_deadline_days = (next_deadline - today).days if next_deadline else None

    return Response({
        "header": {
            "portfolio_progress": portfolio_progress,
            "task_summary": f"{total_done} of {total_tasks} tasks across {len(cards)} projects",
            "total_tasks": total_tasks,
            "total_done": total_done,
            "project_count": len(cards),
            "next_deadline_days": next_deadline_days,
            "next_deadline_date": next_deadline.isoformat() if next_deadline else None,
            "next_deadline_project": next_deadline_project,
        },
        "cards": cards,
    })


# ──────────────────────────────────────────────────────────────
# SPRINT ViewSet
# ���─────────────────────────────────────────────────────────────

class SprintViewSet(viewsets.ModelViewSet):
    serializer_class = SprintSerializer
    queryset = Sprint.objects.prefetch_related("tasks")

    def get_queryset(self):
        qs = super().get_queryset()
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=["post"], url_path="take-snapshot")
    def take_snapshot(self, request, pk=None):
        """Take a daily burndown snapshot for this sprint."""
        sprint = self.get_object()
        today = timezone.now().date()

        tasks = list(sprint.tasks.all())
        total = len(tasks)
        done = sum(1 for t in tasks if t.status == "done")
        blocked = sum(1 for t in tasks if t.status == "blocked")
        added = sum(1 for t in tasks if t.created_at.date() > sprint.start_date)

        snapshot, created = SprintSnapshot.objects.update_or_create(
            sprint=sprint, date=today,
            defaults={
                "total_tasks": total,
                "done_tasks": done,
                "blocked_tasks": blocked,
                "added_tasks": added,
            },
        )
        return Response(SprintSnapshotSerializer(snapshot).data)

    @action(detail=True, methods=["post"], url_path="lock-backlog")
    def lock_backlog(self, request, pk=None):
        """Lock the sprint backlog (Spec §E4). Idempotent."""
        sprint = self.get_object()
        if sprint.backlog_locked:
            return Response({"status": "already_locked", "sprint": str(sprint.id)})
        sprint.backlog_locked = True
        sprint.save(update_fields=["backlog_locked", "updated_at"])
        return Response({"status": "locked", "sprint": str(sprint.id)})

    @action(detail=True, methods=["post"], url_path="unlock-backlog")
    def unlock_backlog(self, request, pk=None):
        """Unlock the sprint backlog. Idempotent."""
        sprint = self.get_object()
        if not sprint.backlog_locked:
            return Response({"status": "already_unlocked", "sprint": str(sprint.id)})
        sprint.backlog_locked = False
        sprint.save(update_fields=["backlog_locked", "updated_at"])
        return Response({"status": "unlocked", "sprint": str(sprint.id)})

    @action(detail=True, methods=["post"], url_path="set-review-sla")
    def set_review_sla(self, request, pk=None):
        """Set review SLA hours (Spec §E4)."""
        sprint = self.get_object()
        hours = request.data.get("hours")
        if hours is None:
            return Response({"error": "hours is required"}, status=400)
        sprint.review_sla_hours = int(hours)
        sprint.save(update_fields=["review_sla_hours", "updated_at"])
        return Response({"status": "sla_set", "hours": sprint.review_sla_hours})

    @action(detail=True, methods=["post"], url_path="assign-dris")
    def assign_dris(self, request, pk=None):
        """
        Force every unowned active task to have an assignee (Spec §E4).
        Distributes to least-loaded members.
        """
        from collections import defaultdict
        from .models import UserProfile

        sprint = self.get_object()
        unowned = list(sprint.tasks.filter(
            assignee__isnull=True
        ).exclude(status__in=["done", "cancelled"]))

        if not unowned:
            return Response({"status": "all_tasks_owned", "assigned": 0})

        # Get all assignees in this sprint + their load
        load = defaultdict(int)
        for t in sprint.tasks.exclude(status__in=["done", "cancelled"]):
            if t.assignee_id:
                load[t.assignee_id] += 1

        # If no existing assignees, get all profiles
        if not load:
            for p in UserProfile.objects.all():
                load[p.keycloak_id] = 0

        if not load:
            return Response({"error": "No team members available"}, status=400)

        # Round-robin assign to least loaded
        assigned = 0
        for task in unowned:
            least = min(load, key=load.get)
            task.assignee_id = least
            task.save(update_fields=["assignee", "updated_at"])
            load[least] += 1
            assigned += 1

        return Response({"status": "dris_assigned", "assigned": assigned})


# ──────────────────────────────────────────────────────────────
# BLOCKER ViewSet
# ──────────────────────────────────────────────────────────────

class BlockerViewSet(viewsets.ModelViewSet):
    serializer_class = BlockerSerializer
    queryset = Blocker.objects.select_related(
        "task", "project", "assigned_to", "assigned_to__user",
        "reported_by", "reported_by__user"
    )

    def get_queryset(self):
        qs = super().get_queryset()
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        severity = self.request.query_params.get("severity")
        if severity:
            qs = qs.filter(severity=severity)
        return qs

    @action(detail=True, methods=["post"])
    def escalate(self, request, pk=None):
        """Escalate a blocker (Spec §D3). Idempotent: double-call is a no-op."""
        blocker = self.get_object()
        if blocker.escalated and blocker.severity == "critical":
            return Response(BlockerSerializer(blocker).data)  # already escalated

        blocker.escalated = True
        blocker.escalated_at = timezone.now()
        blocker.severity = "critical"
        blocker.save(update_fields=["escalated", "escalated_at", "severity", "updated_at"])

        Activity.objects.create(
            project=blocker.project, task=blocker.task,
            activity_type="blocker",
            title=f"Blocker escalated: {blocker.task.title}",
            description=f"Reason: {blocker.reason[:200]}",
        )
        return Response(BlockerSerializer(blocker).data)

    @action(detail=True, methods=["post"])
    def snooze(self, request, pk=None):
        """
        Snooze a blocker (Spec §D3). Idempotent: if already snoozed with time
        remaining, does not extend (prevents double-click extending window).
        """
        blocker = self.get_object()
        # Idempotency: if already snoozed with time remaining, don't re-snooze
        if blocker.status == "snoozed" and blocker.snooze_until and blocker.snooze_until > timezone.now():
            return Response(BlockerSerializer(blocker).data)

        hours = int(request.data.get("hours", 24))
        blocker.status = "snoozed"
        blocker.snooze_until = timezone.now() + timedelta(hours=hours)
        blocker.snooze_count += 1
        blocker.save(update_fields=["status", "snooze_until", "snooze_count", "updated_at"])
        return Response(BlockerSerializer(blocker).data)

    @action(detail=True, methods=["post"])
    def reassign(self, request, pk=None):
        """
        Reassign a blocker (Spec §D3). Idempotent: same assignee is a no-op.
        Body: {"assignee": "<keycloak-uuid>"}
        """
        blocker = self.get_object()
        assignee_id = request.data.get("assignee")
        if not assignee_id:
            return Response({"error": "assignee is required"}, status=400)

        if str(blocker.assigned_to_id) == str(assignee_id):
            return Response(BlockerSerializer(blocker).data)  # same assignee

        blocker.assigned_to_id = assignee_id
        blocker.save(update_fields=["assigned_to", "updated_at"])

        blocker.task.assignee_id = assignee_id
        blocker.task.save(update_fields=["assignee", "updated_at"])

        return Response(BlockerSerializer(blocker).data)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Resolve a blocker. Idempotent."""
        blocker = self.get_object()
        if blocker.status == "resolved":
            return Response(BlockerSerializer(blocker).data)

        blocker.status = "resolved"
        blocker.resolved_at = timezone.now()
        blocker.save(update_fields=["status", "resolved_at", "updated_at"])
        return Response(BlockerSerializer(blocker).data)


# ──────────────────────────────────────────────────────────────
# WORKLOAD CALENDAR (Spec §F)
# ──────────────────────────────────────────────────────────────

@api_view(["GET"])
def workload_calendar_view(request):
    """
    Workload calendar — person × week grid with capacity verdicts.
    ?project=<uuid>  — scope to project
    ?weeks=<int>     — number of weeks (default: 4)
    """
    project_id = request.query_params.get("project")
    weeks = int(request.query_params.get("weeks", 4))

    projects = None
    if project_id:
        projects = Project.objects.filter(id=project_id)

    data = compute_workload_calendar(projects=projects, weeks=weeks)
    return Response(data)


# ──────────────────────────────────────────────────────────────
# AI MORNING BRIEF (Spec §G)
# ──────────────────────────────────────────────────────────────

@api_view(["GET"])
def morning_brief_view(request):
    """
    AI Morning Brief — daily synthesis of portfolio health.
    ?as_of=YYYY-MM-DD — view brief as it would have appeared on that date.
    """
    as_of = None
    as_of_str = request.query_params.get("as_of")
    if as_of_str:
        from datetime import date as dt_date
        try:
            as_of = dt_date.fromisoformat(as_of_str)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

    data = compute_morning_brief(
        user=request.user if request.user.is_authenticated else None,
        as_of=as_of,
    )
    return Response(data)


# ──────────────────────────────────────────────────────────────
# PULL WORK (Spec §F4)
# ──────────────────────────────────────────────────────────────

@api_view(["POST"])
def pull_work_view(request):
    """
    Pull a task to a specific person's workload (Spec §F4).
    Includes capacity warning if pull would push the target into Over.

    Body: {"task_id": "<uuid>", "assignee_id": "<keycloak-uuid>"}
    """
    task_id = request.data.get("task_id")
    assignee_id = request.data.get("assignee_id")

    if not task_id or not assignee_id:
        return Response({"error": "task_id and assignee_id are required"}, status=400)

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    # Compute capacity impact before applying
    CAP = 40
    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    current_week_tasks = Task.objects.filter(
        assignee_id=assignee_id,
        start_date__lte=week_end,
        due_date__gte=week_start,
    ).exclude(status__in=["done", "cancelled"]).exclude(id=task_id)

    current_hours = sum(
        max(0, (t.estimated_hours or 8) - (t.actual_hours or 0))
        for t in current_week_tasks
    )
    task_hours = max(0, (task.estimated_hours or 8) - (task.actual_hours or 0))
    projected_hours = current_hours + task_hours

    if projected_hours <= CAP * 0.6:
        verdict = "light"
    elif projected_hours <= CAP * 0.85:
        verdict = "busy"
    elif projected_hours <= CAP:
        verdict = "full"
    else:
        verdict = "over"

    capacity_warning = None
    if verdict == "over":
        surplus = round(projected_hours - CAP, 1)
        capacity_warning = f"This will put assignee at {round(projected_hours, 1)}h this week (+{surplus}h over capacity)"

    # Apply the reassignment
    old_assignee = task.assignee_id
    task.assignee_id = assignee_id
    task.save(update_fields=["assignee", "updated_at"])

    Blocker.objects.filter(task=task, status="active").update(assigned_to_id=assignee_id)

    return Response({
        "status": "reassigned",
        "task_id": str(task.id),
        "task_title": task.title,
        "old_assignee": str(old_assignee) if old_assignee else None,
        "new_assignee": str(assignee_id),
        "projected_hours_this_week": round(projected_hours, 1),
        "verdict": verdict,
        "capacity_warning": capacity_warning,
    })


# ──────────────────────────────────────────────────────────────
# ACCEPT / DISMISS AI SUGGESTION (Spec §B6)
# ──────────────────────────────────────────────────────────────

@api_view(["POST"])
def accept_suggestion_view(request):
    """
    One-tap acceptance for AI suggestions (Spec §B6).
    Re-evaluates against CURRENT state before executing — stale dry-runs
    are caught and flagged rather than blindly applied.

    Body: {"project_id": "<uuid>", "suggestion": {<suggestion object>}}
    """
    project_id = request.data.get("project_id")
    suggestion = request.data.get("suggestion")

    if not project_id or not suggestion:
        return Response({"error": "project_id and suggestion are required"}, status=400)

    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)

    stype = suggestion.get("type")

    # Freshness check: verify referenced tasks still exist and are in expected state
    stale_warnings = []
    task_ids = suggestion.get("task_ids", [])
    if suggestion.get("task_id"):
        task_ids = task_ids + [suggestion["task_id"]]
    for tid in task_ids:
        try:
            t = Task.objects.get(id=tid)
            if t.status in ("done", "cancelled"):
                stale_warnings.append(f"Task \"{t.title}\" is now {t.status} — suggestion may be stale")
        except Task.DoesNotExist:
            stale_warnings.append(f"Task {tid} no longer exists")

    result = {"accepted": True, "type": stype, "changes": [], "stale_warnings": stale_warnings}

    if stype == "reassign":
        assignee_id = suggestion.get("assignee_id")
        task_ids = suggestion.get("task_ids", [])
        for tid in task_ids:
            try:
                task = Task.objects.get(id=tid)
                old = task.assignee_id
                task.assignee_id = assignee_id
                task.save(update_fields=["assignee", "updated_at"])
                result["changes"].append({
                    "task_id": tid,
                    "action": "reassigned",
                    "old_assignee": str(old) if old else None,
                    "new_assignee": assignee_id,
                })
            except Task.DoesNotExist:
                continue

    elif stype == "descope":
        task_ids = suggestion.get("task_ids", [])
        for tid in task_ids:
            try:
                task = Task.objects.get(id=tid)
                task.status = "cancelled"
                task.save(update_fields=["status", "updated_at"])
                result["changes"].append({
                    "task_id": tid,
                    "action": "descoped",
                    "title": task.title,
                })
            except Task.DoesNotExist:
                continue

    elif stype == "escalate_dependency":
        task_id = suggestion.get("task_id")
        if task_id:
            blockers = Blocker.objects.filter(task_id=task_id, status="active")
            for b in blockers:
                b.escalated = True
                b.escalated_at = timezone.now()
                b.severity = "critical"
                b.save(update_fields=["escalated", "escalated_at", "severity", "updated_at"])
                result["changes"].append({
                    "blocker_id": str(b.id),
                    "action": "escalated",
                })

    elif stype == "focus_stage":
        # Informational action — no data change, just acknowledge
        result["changes"].append({"action": "acknowledged", "stage": suggestion.get("stage")})

    return Response(result)


@api_view(["POST"])
def dismiss_suggestion_view(request):
    """
    Dismiss an AI suggestion (feeds diagnostic scores with decay).

    Body: {
        "project_id": "<uuid>",
        "suggestion_type": "<type>",
        "suggestion_data": {},
        "reason": "not_now" | "permanent"  (optional, default: "not_now")
    }

    "not_now" — counted toward throttle (3 in 7 days suppresses suggestion)
    "permanent" — suppresses this suggestion type entirely for this project
    """
    project_id = request.data.get("project_id")
    suggestion_type = request.data.get("suggestion_type")
    suggestion_data = request.data.get("suggestion_data", {})
    reason = request.data.get("reason", "not_now")

    if reason not in ("not_now", "permanent"):
        return Response({"error": "reason must be 'not_now' or 'permanent'"}, status=400)

    if not project_id or not suggestion_type:
        return Response({"error": "project_id and suggestion_type are required"}, status=400)

    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)

    user_profile = None
    if request.user and request.user.is_authenticated and hasattr(request.user, "profile"):
        user_profile = request.user.profile

    # Store reason inside suggestion_data for the throttle logic to read
    suggestion_data["reason"] = reason

    dismissal = SuggestionDismissal.objects.create(
        project=project,
        suggestion_type=suggestion_type,
        suggestion_data=suggestion_data,
        dismissed_by=user_profile,
    )

    return Response(SuggestionDismissalSerializer(dismissal).data, status=201)


# ──────────────────────────────────────────────────────────────
# RISK HISTORY (audit trail)
# ──────────────────────────────────────────────────────────────

@api_view(["GET"])
def risk_history_view(request):
    """
    Risk label change audit trail for a project.
    ?project=<uuid>
    """
    project_id = request.query_params.get("project")
    if not project_id:
        return Response({"error": "project query param is required"}, status=400)

    logs = RiskLabelLog.objects.filter(
        project_id=project_id
    ).order_by("-created_at")[:50]

    return Response(RiskLabelLogSerializer(logs, many=True).data)


@api_view(["GET"])
def calendar_view(request):
    """
    Calendar endpoint for all tasks across all projects.

    Query params:
      ?view=weekly|monthly|timeline   (default: weekly)
      ?date=YYYY-MM-DD                (reference date, default: today)
      ?assignee=<keycloak-uuid>       (filter by assignee)
      ?project=<project-uuid>         (filter by project)
    """
    from datetime import date as dt_date
    from calendar import monthrange

    today = timezone.now().date()
    view = request.query_params.get("view", "weekly")
    date_str = request.query_params.get("date")
    ref_date = today
    if date_str:
        try:
            ref_date = dt_date.fromisoformat(date_str)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

    # Base queryset
    tasks = Task.objects.select_related(
        "assignee", "assignee__user", "assigner", "assigner__user", "category", "project"
    ).prefetch_related("subtasks")

    assignee_id = request.query_params.get("assignee")
    if assignee_id:
        tasks = tasks.filter(assignee_id=assignee_id)
    project_id = request.query_params.get("project")
    if project_id:
        tasks = tasks.filter(project_id=project_id)

    if view == "weekly":
        # Mon-Sun for the week containing ref_date
        start_of_week = ref_date - timedelta(days=ref_date.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        tasks_in_range = tasks.filter(
            start_date__lte=end_of_week, due_date__gte=start_of_week
        ) | tasks.filter(
            start_date__lte=end_of_week, due_date__isnull=True, start_date__gte=start_of_week
        )

        days = []
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            day_tasks = []
            for t in tasks_in_range:
                t_start = t.start_date or day
                t_end = t.due_date or t.start_date or day
                if t_start <= day <= t_end:
                    day_tasks.append(TaskListSerializer(t).data)
            days.append({
                "date": day.isoformat(),
                "day_name": day.strftime("%A"),
                "is_today": day == today,
                "task_count": len(day_tasks),
                "tasks": day_tasks,
            })

        return Response({
            "view": "weekly",
            "start": start_of_week.isoformat(),
            "end": end_of_week.isoformat(),
            "days": days,
        })

    elif view == "monthly":
        first_day = ref_date.replace(day=1)
        _, days_in_month = monthrange(ref_date.year, ref_date.month)
        last_day = ref_date.replace(day=days_in_month)

        # Extend to full weeks (Mon start)
        cal_start = first_day - timedelta(days=first_day.weekday())
        cal_end = last_day + timedelta(days=(6 - last_day.weekday()))

        tasks_in_range = tasks.filter(
            start_date__lte=cal_end, due_date__gte=cal_start
        ) | tasks.filter(
            start_date__lte=cal_end, due_date__isnull=True, start_date__gte=cal_start
        )
        tasks_list = list(tasks_in_range)

        days = []
        current = cal_start
        while current <= cal_end:
            day_tasks = []
            for t in tasks_list:
                t_start = t.start_date or current
                t_end = t.due_date or t.start_date or current
                if t_start <= current <= t_end:
                    day_tasks.append({
                        "id": str(t.id),
                        "title": t.title,
                        "status": t.status,
                        "priority": t.priority,
                    })
            days.append({
                "date": current.isoformat(),
                "is_today": current == today,
                "is_current_month": current.month == ref_date.month,
                "task_count": len(day_tasks),
                "tasks": day_tasks,
            })
            current += timedelta(days=1)

        return Response({
            "view": "monthly",
            "month": ref_date.strftime("%B %Y"),
            "start": cal_start.isoformat(),
            "end": cal_end.isoformat(),
            "days": days,
        })

    elif view == "timeline":
        # Tasks grouped by assignee with date ranges
        # Default range: 4 weeks from ref_date
        range_start = ref_date - timedelta(days=ref_date.weekday())
        range_weeks = int(request.query_params.get("weeks", 4))
        range_end = range_start + timedelta(weeks=range_weeks) - timedelta(days=1)

        tasks_in_range = tasks.filter(
            start_date__lte=range_end, due_date__gte=range_start
        ) | tasks.filter(
            start_date__lte=range_end, due_date__isnull=True, start_date__gte=range_start
        )

        # Group by assignee
        assignee_map = {}
        unassigned = []
        for t in tasks_in_range:
            task_data = {
                "id": str(t.id),
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "start_date": t.start_date,
                "due_date": t.due_date,
            }
            if t.assignee:
                uid = str(t.assignee.keycloak_id)
                if uid not in assignee_map:
                    assignee_map[uid] = {
                        "keycloak_id": uid,
                        "username": t.assignee.user.username,
                        "display_name": t.assignee.display_name or t.assignee.user.get_full_name(),
                        "task_count": 0,
                        "tasks": [],
                    }
                assignee_map[uid]["tasks"].append(task_data)
                assignee_map[uid]["task_count"] += 1
            else:
                unassigned.append(task_data)

        members = list(assignee_map.values())
        if unassigned:
            members.append({
                "keycloak_id": None,
                "username": "unassigned",
                "display_name": "Unassigned",
                "task_count": len(unassigned),
                "tasks": unassigned,
            })

        # Build date columns
        dates = []
        current = range_start
        while current <= range_end:
            dates.append({
                "date": current.isoformat(),
                "is_today": current == today,
                "is_week_start": current.weekday() == 0,
            })
            current += timedelta(days=1)

        return Response({
            "view": "timeline",
            "start": range_start.isoformat(),
            "end": range_end.isoformat(),
            "dates": dates,
            "members": members,
        })

    return Response({"error": "Invalid view. Use weekly, monthly, or timeline."}, status=400)


@api_view(["POST"])
def orchestrate(request):
    transcript = request.data.get("transcript", "")
    if not transcript:
        return Response({"error": "transcript is required"}, status=status.HTTP_400_BAD_REQUEST)
    lower = transcript.lower()
    intent = "general"
    if any(w in lower for w in ["overdue", "late", "behind"]):
        intent = "overdue_tasks"
    elif any(w in lower for w in ["progress", "status", "how"]):
        intent = "project_status"
    elif any(w in lower for w in ["block", "depend"]):
        intent = "dependency_query"

    from django.utils import timezone
    if intent == "overdue_tasks":
        tasks = Task.objects.filter(due_date__lt=timezone.now().date(), status__in=["todo", "in_progress", "active"])
        data = TaskListSerializer(tasks, many=True).data
    else:
        data = ProjectListSerializer(Project.objects.filter(status="active"), many=True).data

    return Response({"intent": intent, "transcript": transcript, "results": data})
