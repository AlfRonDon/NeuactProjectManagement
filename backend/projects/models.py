import uuid
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


class Task(models.Model):
    """A unit of work within a project."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="tasks"
    )
    milestone = models.ForeignKey(
        Milestone, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
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
    assignee = models.CharField(max_length=255, blank=True, default="")
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.FloatField(null=True, blank=True)
    actual_hours = models.FloatField(null=True, blank=True)
    depends_on = models.ManyToManyField(
        "self", symmetrical=False, blank=True, related_name="blocks"
    )
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-priority", "due_date"]

    def __str__(self):
        return self.title


class SubTask(models.Model):
    """A checklist item within a task."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="subtasks")
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    done = models.BooleanField(default=False)
    assignee = models.CharField(max_length=255, blank=True, default="")
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
