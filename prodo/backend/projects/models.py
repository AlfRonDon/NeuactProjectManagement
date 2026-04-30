import uuid
from django.conf import settings
from django.db import models


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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name


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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="tasks"
    )
    milestone = models.ForeignKey(
        Milestone, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.keycloak_id})"


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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
