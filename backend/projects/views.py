from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.db.models import Q

from .models import Project, Milestone, Task, SubTask, Comment, Changelog, Notification
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
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.prefetch_related("tasks", "milestones", "changelogs")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProjectDetailSerializer
        return ProjectListSerializer

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
        return Response({"title": f"{project.name} — Gantt", "variant": "multilane", "range": {"start": rs, "end": re}, "lanes": lanes, "events": events, "annotations": annotations})


class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        pid = self.request.query_params.get("project")
        return qs.filter(project_id=pid) if pid else qs


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.prefetch_related("subtasks", "comments", "depends_on", "blocks")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TaskDetailSerializer
        return TaskListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        for param, field in [("project", "project_id"), ("status", "status"), ("priority", "priority")]:
            val = self.request.query_params.get(param)
            if val:
                qs = qs.filter(**{field: val})
        assignee = self.request.query_params.get("assignee")
        if assignee:
            qs = qs.filter(assignee__icontains=assignee)
        return qs

    @action(detail=True, methods=["get"])
    def detail_full(self, request, pk=None):
        task = self.get_object()
        return Response(TaskDetailSerializer(task).data)


class SubTaskViewSet(viewsets.ModelViewSet):
    serializer_class = SubTaskSerializer

    def get_queryset(self):
        return SubTask.objects.filter(task_id=self.kwargs.get("task_pk"))

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
