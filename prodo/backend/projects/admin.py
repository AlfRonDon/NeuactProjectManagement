from django.contrib import admin
from .models import (
    Project, Milestone, Task, SubTask, Comment, Changelog, ChangelogEntry,
    Notification, UserProfile, Category, TaskDependency, Activity,
    Sprint, SprintSnapshot, Blocker, TaskStatusLog,
    RiskLabelLog, SuggestionDismissal, DashboardConfig,
)


class TaskInline(admin.TabularInline):
    model = Task
    extra = 0
    fields = ("title", "status", "priority", "assignee", "assigner", "category", "start_date", "due_date", "estimated_hours")
    show_change_link = True


class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 0
    fields = ("name", "due_date", "completed")


class SubTaskInline(admin.TabularInline):
    model = SubTask
    extra = 0
    fields = ("title", "done", "assignee", "assigner", "priority", "order")


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    fields = ("author", "text", "created_at")
    readonly_fields = ("created_at",)


class ChangelogEntryInline(admin.TabularInline):
    model = ChangelogEntry
    extra = 0
    fields = ("type", "title", "task_id_ref")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "short", "color", "status", "start_date", "target_date", "task_count", "updated_at")
    list_filter = ("status",)
    search_fields = ("name", "description")
    inlines = [MilestoneInline, TaskInline]

    def task_count(self, obj):
        return obj.tasks.count()
    task_count.short_description = "Tasks"


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ("name", "project", "due_date", "completed")
    list_filter = ("completed", "project")
    search_fields = ("name",)


class TaskDependencyInline(admin.TabularInline):
    model = TaskDependency
    fk_name = "successor"
    extra = 0
    fields = ("predecessor", "dependency_type", "lag_days")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "status", "priority", "assignee", "assigner", "category", "due_date")
    list_filter = ("status", "priority", "project", "category")
    search_fields = ("title", "description")
    list_editable = ("status", "priority")
    inlines = [TaskDependencyInline, SubTaskInline, CommentInline]


@admin.register(SubTask)
class SubTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "task", "done", "assignee", "assigner", "priority")
    list_filter = ("done", "priority")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("author", "task", "text_short", "created_at")
    list_filter = ("author",)

    def text_short(self, obj):
        return obj.text[:60]


@admin.register(Changelog)
class ChangelogAdmin(admin.ModelAdmin):
    list_display = ("version", "project", "title", "date")
    list_filter = ("project",)
    inlines = [ChangelogEntryInline]


@admin.register(ChangelogEntry)
class ChangelogEntryAdmin(admin.ModelAdmin):
    list_display = ("type", "title", "changelog", "task_id_ref")
    list_filter = ("type",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "project_short", "from_user", "read", "created_at")
    list_filter = ("category", "read")


@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = ("predecessor", "dependency_type", "successor", "lag_days", "created_at")
    list_filter = ("dependency_type",)


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "activity_type", "project", "task", "triggered_by", "read", "created_at")
    list_filter = ("activity_type", "read", "project")
    search_fields = ("title", "description")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "created_at")
    search_fields = ("name",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "keycloak_id", "display_name", "created_at")
    search_fields = ("user__username", "keycloak_id", "display_name")
    readonly_fields = ("keycloak_id", "created_at", "updated_at")


# ──────────────────────────────────────────────────────────────
# NEW MODEL ADMINS
# ───��───────────────���──────────────────────────────────────────

class SprintSnapshotInline(admin.TabularInline):
    model = SprintSnapshot
    extra = 0
    fields = ("date", "total_tasks", "done_tasks", "blocked_tasks", "added_tasks")
    readonly_fields = ("date",)


@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ("name", "number", "project", "status", "start_date", "end_date", "backlog_locked")
    list_filter = ("status", "project", "backlog_locked")
    search_fields = ("name",)
    inlines = [SprintSnapshotInline]


@admin.register(SprintSnapshot)
class SprintSnapshotAdmin(admin.ModelAdmin):
    list_display = ("sprint", "date", "total_tasks", "done_tasks", "blocked_tasks", "added_tasks")
    list_filter = ("sprint",)


@admin.register(Blocker)
class BlockerAdmin(admin.ModelAdmin):
    list_display = ("task", "project", "severity", "status", "escalated", "snooze_count", "age_display", "created_at")
    list_filter = ("severity", "status", "escalated", "project")
    search_fields = ("reason", "task__title")
    readonly_fields = ("age_display", "created_at", "updated_at")


@admin.register(TaskStatusLog)
class TaskStatusLogAdmin(admin.ModelAdmin):
    list_display = ("task", "from_status", "to_status", "changed_by", "changed_at")
    list_filter = ("to_status", "from_status")
    search_fields = ("task__title",)
    readonly_fields = ("changed_at",)


@admin.register(RiskLabelLog)
class RiskLabelLogAdmin(admin.ModelAdmin):
    list_display = ("project", "from_label", "to_label", "reason", "created_at")
    list_filter = ("to_label", "project")
    readonly_fields = ("created_at",)


@admin.register(SuggestionDismissal)
class SuggestionDismissalAdmin(admin.ModelAdmin):
    list_display = ("project", "suggestion_type", "dismissed_by", "created_at")
    list_filter = ("suggestion_type", "project")
    readonly_fields = ("created_at",)


@admin.register(DashboardConfig)
class DashboardConfigAdmin(admin.ModelAdmin):
    list_display = ("__str__", "diagnostic_weighting_version", "updated_at")
    fieldsets = (
        ("Suggestion Throttle", {
            "fields": ("dismissal_throttle_count", "dismissal_throttle_window_days", "dismissal_decay_halflife_days"),
        }),
        ("Risk Label", {
            "fields": ("hysteresis_pace_threshold",),
        }),
        ("Blocker Auto-Critical", {
            "fields": ("blocker_age_critical_days", "blocker_downstream_critical", "blocker_deadline_critical_days"),
        }),
        ("Escalation", {
            "fields": ("escalation_unignorable_days",),
        }),
        ("Stale Task Detection (dwell days per stage)", {
            "fields": ("stale_dwell_research", "stale_dwell_design", "stale_dwell_build", "stale_dwell_test", "stale_dwell_ship"),
        }),
        ("Workload", {
            "fields": ("default_weekly_capacity",),
        }),
        ("Diagnostic", {
            "fields": ("diagnostic_weighting_version", "critical_path_weight_multiplier"),
        }),
        ("Morning Brief", {
            "fields": ("brief_resurfacing_days",),
        }),
    )

    def has_add_permission(self, request):
        return not DashboardConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
