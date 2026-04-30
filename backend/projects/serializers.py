from rest_framework import serializers
from .models import Project, Milestone, Task, SubTask, Comment, Changelog, ChangelogEntry, Notification


class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ["id", "title", "description", "done", "assignee", "priority", "order"]


class CommentSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

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


class TaskListSerializer(serializers.ModelSerializer):
    subtask_count = serializers.SerializerMethodField()
    subtask_done = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    depends_on = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "priority", "assignee",
            "start_date", "due_date", "estimated_hours", "actual_hours",
            "tags", "depends_on", "subtask_count", "subtask_done", "comment_count",
            "project", "created_at", "updated_at",
        ]

    def get_subtask_count(self, obj):
        return obj.subtasks.count()

    def get_subtask_done(self, obj):
        return obj.subtasks.filter(done=True).count()

    def get_comment_count(self, obj):
        return obj.comments.count()


class TaskDetailSerializer(serializers.ModelSerializer):
    subtasks = SubTaskSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    depends_on = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    blocks = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "priority", "assignee",
            "start_date", "due_date", "estimated_hours", "actual_hours",
            "tags", "depends_on", "blocks",
            "subtasks", "comments",
            "project", "milestone", "created_at", "updated_at",
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


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "project_short", "category", "title", "description",
            "from_user", "time_ago", "read", "actions", "created_at",
        ]
