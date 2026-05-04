import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Project(models.Model):
    """A project containing tasks and milestones."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    short = models.CharField(max_length=20, blank=True, default="")
    description = models.TextField(blank=True, default="")
    color = models.CharField(max_length=7, default="#3b82f6")
    status = models.CharField(
        max_length=20,
        choices=[
            ("planning", "Planning"),
            ("active", "Active"),
            ("on_hold", "On Hold"),
            ("completed", "Completed"),
            ("archived", "Archived"),
        ],
        default="planning",
    )
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    timezone_name = models.CharField(
        max_length=50, default="Asia/Kolkata",
        help_text="IANA timezone for day boundary calculations"
    )
    last_risk_label = models.CharField(
        max_length=20, blank=True, default="",
        help_text="Cached risk label for hysteresis — prevents flapping"
    )
    last_risk_changed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name

    def get_today(self):
        """Return 'today' in the project's configured timezone."""
        import zoneinfo
        try:
            tz = zoneinfo.ZoneInfo(self.timezone_name)
        except (KeyError, Exception):
            tz = zoneinfo.ZoneInfo("Asia/Kolkata")
        return timezone.now().astimezone(tz).date()


class Milestone(models.Model):
    """A key checkpoint within a project."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="milestones"
    )
    name = models.CharField(max_length=255)
    due_date = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_date"]

    def __str__(self):
        return f"{self.name} ({self.project.name})"


class Category(models.Model):
    """A category for grouping tasks."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    color = models.CharField(max_length=7, default="#6b7280", help_text="Hex color code")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Task(models.Model):
    """A unit of work within a project."""
    STAGE_CHOICES = [
        ("research", "Research"),
        ("design", "Design"),
        ("build", "Build"),
        ("test", "Test"),
        ("ship", "Ship"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="tasks"
    )
    sprint = models.ForeignKey(
        "Sprint", on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )
    milestone = models.ForeignKey(
        Milestone, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default="build", blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("backlog", "Backlog"),
            ("todo", "To Do"),
            ("active", "Active"),
            ("blocked", "Blocked"),
            ("in_progress", "In Progress"),
            ("in_review", "In Review"),
            ("done", "Done"),
            ("cancelled", "Cancelled"),
        ],
        default="todo",
    )
    priority = models.CharField(
        max_length=10,
        choices=[
            ("low", "Low"),
            ("medium", "Medium"),
            ("high", "High"),
            ("urgent", "Urgent"),
            ("critical", "Critical"),
        ],
        default="medium",
    )
    assignee = models.ForeignKey(
        "UserProfile", on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_tasks"
    )
    assigner = models.ForeignKey(
        "UserProfile", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_tasks"
    )
    planned_start_date = models.DateField(null=True, blank=True, help_text="Original baseline start date")
    planned_end_date = models.DateField(null=True, blank=True, help_text="Original baseline end date")
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True, help_text="When the task was marked done")
    estimated_hours = models.FloatField(null=True, blank=True)
    actual_hours = models.FloatField(null=True, blank=True)
    depends_on = models.ManyToManyField(
        "self", symmetrical=False, blank=True, related_name="blocks",
        through="TaskDependency", through_fields=("successor", "predecessor"),
    )
    previous_status = models.CharField(max_length=20, blank=True, default="",
                                       help_text="Status before auto-block")
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-priority", "due_date"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        old_start = None
        old_due = None
        if self.pk:
            try:
                old = Task.objects.get(pk=self.pk)
                old_start = old.start_date
                old_due = old.due_date
            except Task.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        # Cascade date changes to successors (only on overlap)
        if not getattr(self, "_skip_cascade", False) and self.pk:
            from .dependency_utils import cascade_dates
            cascade_dates(self, old_start, old_due)


class TaskDependency(models.Model):
    """A dependency link between two tasks with type metadata."""
    DEPENDENCY_TYPES = [
        ("FS", "Finish-to-Start"),
        ("SS", "Start-to-Start"),
        ("FF", "Finish-to-Finish"),
        ("SF", "Start-to-Finish"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    predecessor = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name="successor_links"
    )
    successor = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name="predecessor_links"
    )
    dependency_type = models.CharField(max_length=2, choices=DEPENDENCY_TYPES, default="FS")
    lag_days = models.IntegerField(default=0, help_text="Buffer days between tasks")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("predecessor", "successor")]
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.predecessor.title} --{self.dependency_type}--> {self.successor.title}"


class SubTask(models.Model):
    """A checklist item within a task."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="subtasks")
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    done = models.BooleanField(default=False)
    assignee = models.ForeignKey(
        "UserProfile", on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_subtasks"
    )
    assigner = models.ForeignKey(
        "UserProfile", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_subtasks"
    )
    priority = models.CharField(max_length=10, default="medium")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{'✓' if self.done else '○'} {self.title}"


class Comment(models.Model):
    """A comment on a task."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author = models.CharField(max_length=255)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.author}: {self.text[:50]}"


class Changelog(models.Model):
    """A release changelog entry for a project."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="changelogs")
    version = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    date = models.DateField()
    contributors = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.version} — {self.title}"


class ChangelogEntry(models.Model):
    """A single change within a changelog release."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    changelog = models.ForeignKey(Changelog, on_delete=models.CASCADE, related_name="entries")
    type = models.CharField(
        max_length=20,
        choices=[
            ("feature", "Feature"),
            ("fix", "Fix"),
            ("improvement", "Improvement"),
            ("breaking", "Breaking"),
        ],
    )
    title = models.CharField(max_length=500)
    task_id_ref = models.CharField(max_length=50, blank=True, default="")

    class Meta:
        ordering = ["type"]

    def __str__(self):
        return f"[{self.type}] {self.title}"


class UserProfile(models.Model):
    """Links a Django User to their Keycloak identity via the stable 'sub' claim."""
    keycloak_id = models.UUIDField(primary_key=True, help_text="Keycloak 'sub' claim")
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    display_name = models.CharField(max_length=255, blank=True, default="")
    weekly_capacity_hours = models.FloatField(
        default=40.0,
        help_text="Available hours per week (accounts for part-time, role, etc.)"
    )
    unavailable_dates = models.JSONField(
        default=list, blank=True,
        help_text="List of date ranges when unavailable: [{'start': 'YYYY-MM-DD', 'end': 'YYYY-MM-DD', 'reason': 'PTO'}]"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.keycloak_id})"

    def capacity_for_week(self, week_start, week_end):
        """Return available hours for a given week, accounting for PTO/unavailability."""
        from datetime import date as dt_date
        base = self.weekly_capacity_hours
        if not self.unavailable_dates:
            return base

        unavailable_days = 0
        for period in self.unavailable_dates:
            try:
                p_start = dt_date.fromisoformat(period["start"])
                p_end = dt_date.fromisoformat(period["end"])
            except (KeyError, ValueError):
                continue
            # Count overlap days
            overlap_start = max(p_start, week_start)
            overlap_end = min(p_end, week_end)
            if overlap_start <= overlap_end:
                unavailable_days += (overlap_end - overlap_start).days + 1

        work_days = 5  # Mon-Fri
        hours_per_day = base / work_days
        return max(0, base - (unavailable_days * hours_per_day))


class Activity(models.Model):
    """Project activity feed — auto-generated from task events."""
    ACTIVITY_TYPES = [
        ("blocker", "Blocker"),
        ("overdue", "Overdue"),
        ("mention", "Mention"),
        ("ai", "AI"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="activities")
    task = models.ForeignKey("Task", on_delete=models.CASCADE, null=True, blank=True, related_name="activities")
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    triggered_by = models.ForeignKey(
        "UserProfile", on_delete=models.SET_NULL, null=True, blank=True, related_name="triggered_activities"
    )
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "activities"

    def __str__(self):
        return f"[{self.activity_type}] {self.title}"


class Notification(models.Model):
    """Activity/notification item."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_short = models.CharField(max_length=20)
    category = models.CharField(max_length=20, choices=[
        ("blocker", "Blocker"), ("overdue", "Overdue"), ("mention", "Mention"), ("ai", "AI"),
    ])
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    from_user = models.CharField(max_length=255, blank=True, default="")
    time_ago = models.CharField(max_length=20, default="")
    read = models.BooleanField(default=False)
    actions = models.JSONField(default=list, blank=True)
    related_id = models.UUIDField(null=True, blank=True, help_text="UUID of related blocker or task")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


# ──────────────────────────────────────────────────────────────
# NEW MODELS for Portfolio Overview Dashboard
# ──────────────────────────────────────────────────────────────

class Sprint(models.Model):
    """A time-boxed iteration within a project."""
    STATUS_CHOICES = [
        ("planning", "Planning"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="sprints")
    name = models.CharField(max_length=255, blank=True, default="")
    number = models.PositiveIntegerField(default=1)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planning")
    backlog_locked = models.BooleanField(default=False, help_text="Prevents new tasks from entering this sprint")
    review_sla_hours = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Max hours a task can sit in review before triggering alert"
    )
    require_dri = models.BooleanField(
        default=False,
        help_text="Policy: every active task must have an assignee to advance"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-number"]
        unique_together = [("project", "number")]

    def __str__(self):
        return f"Sprint {self.number} — {self.project.name}"

    @property
    def days_left(self):
        return max(0, (self.end_date - timezone.now().date()).days)

    @property
    def total_days(self):
        return max(1, (self.end_date - self.start_date).days)

    def inherit_policies_from(self, previous_sprint):
        """
        Sprint-boundary policy persistence:
        - review_sla_hours carries over (it's a team policy)
        - require_dri carries over (it's a process rule)
        - backlog_locked resets to False (it's an emergency measure per-sprint)
        """
        if previous_sprint.review_sla_hours and not self.review_sla_hours:
            self.review_sla_hours = previous_sprint.review_sla_hours
        if previous_sprint.require_dri:
            self.require_dri = True
        self.backlog_locked = False  # always reset
        self.save(update_fields=["review_sla_hours", "require_dri", "backlog_locked", "updated_at"])


class SprintSnapshot(models.Model):
    """Daily snapshot for burndown charts — one row per sprint per day."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name="snapshots")
    date = models.DateField()
    total_tasks = models.PositiveIntegerField(default=0)
    done_tasks = models.PositiveIntegerField(default=0)
    blocked_tasks = models.PositiveIntegerField(default=0)
    added_tasks = models.PositiveIntegerField(default=0, help_text="Tasks added after sprint start (scope creep)")
    is_backfilled = models.BooleanField(default=False, help_text="True if reconstructed from logs, not live")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date"]
        unique_together = [("sprint", "date")]

    def __str__(self):
        return f"{self.sprint} — {self.date}"

    @property
    def remaining(self):
        return self.total_tasks - self.done_tasks


class Blocker(models.Model):
    """Explicit blocker tracking with escalation, snooze, and reassignment."""
    SEVERITY_CHOICES = [
        ("normal", "Normal"),
        ("critical", "Critical"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("snoozed", "Snoozed"),
        ("resolved", "Resolved"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="blockers")
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="blocker_records")
    reason = models.TextField(help_text="Why this task is blocked")
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="normal")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")
    escalated = models.BooleanField(default=False)
    escalated_at = models.DateTimeField(null=True, blank=True)
    snooze_until = models.DateTimeField(null=True, blank=True)
    snooze_count = models.PositiveIntegerField(default=0, help_text="Times this blocker has been snoozed")
    assigned_to = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_blockers"
    )
    reported_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="reported_blockers"
    )
    downstream_count = models.PositiveIntegerField(default=0, help_text="Tasks waiting on this blocker")
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-severity", "-created_at"]

    def __str__(self):
        return f"[{self.severity}] {self.task.title} — {self.reason[:60]}"

    @property
    def age_seconds(self):
        end = self.resolved_at or timezone.now()
        return (end - self.created_at).total_seconds()

    @property
    def age_display(self):
        secs = self.age_seconds
        if secs < 3600:
            return f"{int(secs // 60)}m"
        elif secs < 86400:
            return f"{int(secs // 3600)}h"
        else:
            return f"{int(secs // 86400)}d"

    def check_auto_critical(self):
        """Promote to critical based on aging/downstream/deadline rules (config-driven)."""
        if self.severity == "critical":
            return False
        cfg = DashboardConfig.load()
        should_promote = False
        if self.age_seconds > cfg.blocker_age_critical_days * 86400:
            should_promote = True
        if self.downstream_count > cfg.blocker_downstream_critical:
            should_promote = True
        project = self.project
        if project.target_date:
            days_left = (project.target_date - timezone.now().date()).days
            if days_left <= cfg.blocker_deadline_critical_days:
                should_promote = True
        if should_promote:
            self.severity = "critical"
            self.save(update_fields=["severity", "updated_at"])
            return True
        return False


class TaskStatusLog(models.Model):
    """Tracks every status change for pace/velocity/trend calculations."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="status_logs")
    from_status = models.CharField(max_length=20, blank=True, default="")
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True
    )
    changed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-changed_at"]

    def __str__(self):
        return f"{self.task.title}: {self.from_status} → {self.to_status}"


class RiskLabelLog(models.Model):
    """Audit trail for risk label changes — answers 'why is this Critical?'"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="risk_logs")
    from_label = models.CharField(max_length=20, blank=True, default="")
    to_label = models.CharField(max_length=20)
    reason = models.TextField(help_text="What signal triggered the change")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.project.name}: {self.from_label} → {self.to_label}"


class SuggestionDismissal(models.Model):
    """Tracks when users dismiss AI suggestions — inaction is a signal."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="suggestion_dismissals")
    suggestion_type = models.CharField(max_length=50, help_text="Type of suggestion dismissed")
    suggestion_data = models.JSONField(default=dict, blank=True)
    dismissed_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Dismissed: {self.suggestion_type} on {self.project.name}"


class DashboardConfig(models.Model):
    """
    Singleton configuration for tunable dashboard constants.
    Avoids hardcoding values that will need adjustment once real users start using the system.
    """
    # Suggestion throttle
    dismissal_throttle_count = models.PositiveIntegerField(
        default=3, help_text="Dismissals of same type within window to suppress suggestion"
    )
    dismissal_throttle_window_days = models.PositiveIntegerField(
        default=7, help_text="Rolling window (days) for dismissal throttle"
    )
    dismissal_decay_halflife_days = models.FloatField(
        default=7.0, help_text="Half-life (days) for dismissal score decay"
    )

    # Risk label hysteresis
    hysteresis_pace_threshold = models.FloatField(
        default=0.8, help_text="Pace must reach this fraction of required to demote from Critical"
    )

    # Blocker auto-critical thresholds
    blocker_age_critical_days = models.PositiveIntegerField(
        default=2, help_text="Days before a blocker auto-promotes to critical"
    )
    blocker_downstream_critical = models.PositiveIntegerField(
        default=3, help_text="Downstream task count to auto-promote blocker to critical"
    )
    blocker_deadline_critical_days = models.PositiveIntegerField(
        default=7, help_text="Project deadline within N days auto-promotes blockers to critical"
    )

    # Escalation terminator
    escalation_unignorable_days = models.PositiveIntegerField(
        default=3, help_text="Escalated Critical blocker becomes unignorable after N days"
    )

    # Stale task detection
    stale_dwell_research = models.PositiveIntegerField(default=5)
    stale_dwell_design = models.PositiveIntegerField(default=4)
    stale_dwell_build = models.PositiveIntegerField(default=3)
    stale_dwell_test = models.PositiveIntegerField(default=2)
    stale_dwell_ship = models.PositiveIntegerField(default=1)

    # Workload
    default_weekly_capacity = models.FloatField(
        default=40.0, help_text="Default weekly capacity when UserProfile doesn't specify"
    )

    # Diagnostic
    diagnostic_weighting_version = models.PositiveIntegerField(
        default=2, help_text="Increment when weighting math changes — trends only compare within same version"
    )
    critical_path_weight_multiplier = models.FloatField(
        default=2.0, help_text="Weight multiplier for tasks on the critical path in diagnostic scoring"
    )

    # Morning brief
    brief_resurfacing_days = models.PositiveIntegerField(
        default=3, help_text="Days a Critical project must persist before re-surfacing in brief"
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Dashboard Configuration"
        verbose_name_plural = "Dashboard Configuration"

    def __str__(self):
        return "Dashboard Configuration"

    def save(self, *args, **kwargs):
        # Singleton: ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Get or create the singleton config instance."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
