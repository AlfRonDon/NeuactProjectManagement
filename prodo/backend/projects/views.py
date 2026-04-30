from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response

from .models import Project, Milestone, Task, SubTask, Comment, Changelog, Notification, Category, TaskDependency, Activity
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
    def brief(self, request, pk=None):
        project = self.get_object()
        return Response(ProjectBriefSerializer(project).data)

    @action(detail=True, methods=["get"])
    def pipeline(self, request, pk=None):
        project = self.get_object()
        return Response(PipelineSerializer(project).data)

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
        serializer.save(task_id=self.kwargs["task_pk"])


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
