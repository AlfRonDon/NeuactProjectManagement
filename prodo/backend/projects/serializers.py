from rest_framework import serializers
from .models import Project, Milestone, Task, SubTask, Comment, Changelog, ChangelogEntry, Notification, Category, UserProfile, TaskDependency, Activity


class SubTaskSerializer(serializers.ModelSerializer):
    assignee_detail = serializers.SerializerMethodField()
    assigner_detail = serializers.SerializerMethodField()

    class Meta:
        model = SubTask
        fields = ["id", "title", "description", "done", "assignee", "assignee_detail", "assigner", "assigner_detail", "priority", "order"]

    def _profile_data(self, profile):
        if not profile:
            return None
        return {"keycloak_id": str(profile.keycloak_id), "username": profile.user.username, "display_name": profile.display_name}

    def get_assignee_detail(self, obj):
        return self._profile_data(obj.assignee)

    def get_assigner_detail(self, obj):
        return self._profile_data(obj.assigner)


class CommentSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    author = serializers.CharField(read_only=True, default="")

    class Meta:
        model = Comment
        fields = ["id", "author", "avatar", "text", "created_at"]

    def get_avatar(self, obj):
        return obj.author[0].upper() if obj.author else "?"


class ChangelogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChangelogEntry
        fields = ["id", "type", "title", "task_id_ref"]


class ChangelogSerializer(serializers.ModelSerializer):
    entries = ChangelogEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Changelog
        fields = ["id", "version", "title", "description", "date", "contributors", "entries"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "color"]


class UserProfileMinimalSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = ["keycloak_id", "username", "display_name"]


class TaskDependencySerializer(serializers.ModelSerializer):
    predecessor_title = serializers.CharField(source="predecessor.title", read_only=True)
    successor_title = serializers.CharField(source="successor.title", read_only=True)

    class Meta:
        model = TaskDependency
        fields = [
            "id", "predecessor", "successor",
            "predecessor_title", "successor_title",
            "dependency_type", "lag_days", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, data):
        from .validators import check_circular_dependency
        check_circular_dependency(data["predecessor"].id, data["successor"].id)
        if data["predecessor"].project_id != data["successor"].project_id:
            raise serializers.ValidationError("Dependencies must be between tasks in the same project.")
        return data


class TaskListSerializer(serializers.ModelSerializer):
    subtask_count = serializers.SerializerMethodField()
    subtask_done = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    depends_on = serializers.SerializerMethodField()
    assignee_detail = UserProfileMinimalSerializer(source="assignee", read_only=True)
    assigner_detail = UserProfileMinimalSerializer(source="assigner", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "priority",
            "assignee", "assignee_detail", "assigner", "assigner_detail",
            "planned_start_date", "planned_end_date",
            "start_date", "due_date", "estimated_hours", "actual_hours",
            "tags", "depends_on", "subtask_count", "subtask_done", "comment_count",
            "project", "category", "created_at", "updated_at",
        ]

    def get_depends_on(self, obj):
        return list(obj.predecessor_links.values_list("predecessor_id", flat=True))

    def get_subtask_count(self, obj):
        return obj.subtasks.count()

    def get_subtask_done(self, obj):
        return obj.subtasks.filter(done=True).count()

    def get_comment_count(self, obj):
        return obj.comments.count()


class TaskDetailSerializer(serializers.ModelSerializer):
    subtasks = SubTaskSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    dependencies = TaskDependencySerializer(source="predecessor_links", many=True, read_only=True)
    dependents = TaskDependencySerializer(source="successor_links", many=True, read_only=True)
    assignee_detail = UserProfileMinimalSerializer(source="assignee", read_only=True)
    assigner_detail = UserProfileMinimalSerializer(source="assigner", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "priority",
            "assignee", "assignee_detail", "assigner", "assigner_detail",
            "planned_start_date", "planned_end_date",
            "start_date", "due_date", "estimated_hours", "actual_hours",
            "tags", "dependencies", "dependents",
            "subtasks", "comments",
            "project", "milestone", "category", "created_at", "updated_at",
        ]


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ["id", "name", "due_date", "completed", "completed_at", "project"]


class ProjectListSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    done_count = serializers.SerializerMethodField()
    active_count = serializers.SerializerMethodField()
    blocked_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "name", "short", "description", "color", "status",
            "start_date", "target_date",
            "task_count", "done_count", "active_count", "blocked_count", "progress",
            "created_at", "updated_at",
        ]

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_done_count(self, obj):
        return obj.tasks.filter(status="done").count()

    def get_active_count(self, obj):
        return obj.tasks.filter(status__in=["active", "in_progress"]).count()

    def get_blocked_count(self, obj):
        return obj.tasks.filter(status="blocked").count()

    def get_progress(self, obj):
        total = obj.tasks.count()
        if total == 0:
            return 0
        return round((obj.tasks.filter(status="done").count() / total) * 100)


class ProjectDetailSerializer(ProjectListSerializer):
    changelogs = ChangelogSerializer(many=True, read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    tasks = TaskListSerializer(many=True, read_only=True)

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ["changelogs", "milestones", "tasks"]


class ProjectBriefSerializer(serializers.ModelSerializer):
    """Project overview: status, completion %, task counts by status, and pipeline."""
    progress = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    days_left = serializers.SerializerMethodField()
    tasks_by_status = serializers.SerializerMethodField()
    pipeline = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "name", "short", "color", "status",
            "start_date", "target_date", "days_left",
            "progress", "task_count", "tasks_by_status", "pipeline",
        ]

    def get_days_left(self, obj):
        if not obj.target_date:
            return None
        from django.utils import timezone
        delta = (obj.target_date - timezone.now().date()).days
        return delta

    def _get_tasks(self, obj):
        if not hasattr(obj, "_cached_tasks"):
            obj._cached_tasks = list(obj.tasks.select_related("category").all())
        return obj._cached_tasks

    def get_progress(self, obj):
        tasks = self._get_tasks(obj)
        total = len(tasks)
        if total == 0:
            return 0
        done = sum(1 for t in tasks if t.status == "done")
        return round((done / total) * 100)

    def get_task_count(self, obj):
        return len(self._get_tasks(obj))

    def get_tasks_by_status(self, obj):
        tasks = self._get_tasks(obj)
        counts = {}
        for task in tasks:
            counts[task.status] = counts.get(task.status, 0) + 1
        return counts

    def get_pipeline(self, obj):
        tasks = self._get_tasks(obj)
        category_map = {}
        for task in tasks:
            cat_id = str(task.category_id) if task.category_id else "uncategorized"
            if cat_id not in category_map:
                category_map[cat_id] = {
                    "category": CategorySerializer(task.category).data if task.category else None,
                    "total": 0,
                    "done": 0,
                }
            category_map[cat_id]["total"] += 1
            if task.status == "done":
                category_map[cat_id]["done"] += 1
        return list(category_map.values())


class PipelineSerializer(serializers.ModelSerializer):
    """Returns a project with its tasks grouped by category (pipeline view)."""
    pipeline = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["id", "name", "short", "color", "status", "pipeline"]

    def get_pipeline(self, obj):
        tasks = obj.tasks.select_related(
            "category", "assignee", "assignee__user", "assigner", "assigner__user"
        ).prefetch_related("subtasks", "comments", "predecessor_links").all()
        category_map = {}
        for task in tasks:
            cat_id = str(task.category_id) if task.category_id else "uncategorized"
            if cat_id not in category_map:
                category_map[cat_id] = {
                    "category": CategorySerializer(task.category).data if task.category else None,
                    "total": 0,
                    "done": 0,
                    "tasks": [],
                }
            category_map[cat_id]["total"] += 1
            if task.status == "done":
                category_map[cat_id]["done"] += 1
            category_map[cat_id]["tasks"].append(TaskListSerializer(task).data)
        return list(category_map.values())


class ActivitySerializer(serializers.ModelSerializer):
    triggered_by_detail = UserProfileMinimalSerializer(source="triggered_by", read_only=True)
    task_title = serializers.CharField(source="task.title", read_only=True, default=None)

    class Meta:
        model = Activity
        fields = [
            "id", "project", "task", "task_title", "activity_type",
            "title", "description", "triggered_by", "triggered_by_detail",
            "read", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "project_short", "category", "title", "description",
            "from_user", "time_ago", "read", "actions", "created_at",
        ]
