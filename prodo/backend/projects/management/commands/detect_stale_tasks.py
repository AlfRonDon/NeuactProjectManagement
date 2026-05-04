"""
Detect stale tasks and auto-create blockers (Spec §D1).

A task is stale when it has had no movement for longer than its stage's
expected dwell time AND it sits on the critical path.

Run via cron: python manage.py detect_stale_tasks
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from projects.models import Task, TaskStatusLog, Blocker, TaskDependency, Activity, DashboardConfig
from projects.calculations import compute_critical_path


class Command(BaseCommand):
    help = "Detect stale tasks and auto-create blockers"

    def handle(self, *args, **options):
        now = timezone.now()
        active_statuses = ["active", "in_progress", "in_review", "todo"]

        # Get all active tasks that are NOT already blocked
        tasks = Task.objects.filter(
            status__in=active_statuses,
            project__status="active",
        ).select_related("project", "assignee")

        created = 0
        for task in tasks:
            # Check last activity on this task
            last_log = TaskStatusLog.objects.filter(task=task).order_by("-changed_at").first()
            if not last_log:
                # Use task updated_at as fallback
                last_activity = task.updated_at
            else:
                last_activity = last_log.changed_at

            # Compute days since last activity (config-driven dwell limits)
            days_stale = (now - last_activity).days
            cfg = DashboardConfig.load()
            stage_limits = {
                "research": cfg.stale_dwell_research,
                "design": cfg.stale_dwell_design,
                "build": cfg.stale_dwell_build,
                "test": cfg.stale_dwell_test,
                "ship": cfg.stale_dwell_ship,
            }
            dwell_limit = stage_limits.get(task.stage, cfg.stale_dwell_build)

            if days_stale <= dwell_limit:
                continue

            # Check if task is on the critical path
            project_tasks = list(task.project.tasks.all())
            critical_ids = compute_critical_path(project_tasks)

            if task.id not in critical_ids:
                continue

            # Check if already has an active or snoozed blocker
            existing = Blocker.objects.filter(
                task=task, status__in=["active", "snoozed"]
            ).exists()
            if existing:
                continue

            # Check for resolved blocker to reactivate
            resolved = Blocker.objects.filter(
                task=task, status="resolved"
            ).order_by("-created_at").first()

            reason = (
                f"Stale: no movement for {days_stale} days "
                f"(stage '{task.stage}' limit: {dwell_limit}d). "
                f"Task is on the critical path."
            )
            downstream = TaskDependency.objects.filter(predecessor=task).count()

            if resolved:
                resolved.status = "active"
                resolved.resolved_at = None
                resolved.reason = reason
                resolved.downstream_count = downstream
                resolved.save(update_fields=[
                    "status", "resolved_at", "reason", "downstream_count", "updated_at"
                ])
                created += 1
            else:
                Blocker.objects.create(
                    project=task.project,
                    task=task,
                    reason=reason,
                    downstream_count=downstream,
                    assigned_to=task.assignee,
                )
                created += 1

            # Create activity
            Activity.objects.create(
                project=task.project,
                task=task,
                activity_type="blocker",
                title=f"Stale task detected: {task.title}",
                description=reason,
            )

        self.stdout.write(self.style.SUCCESS(
            f"Checked {tasks.count()} active tasks. Created/reactivated {created} blocker(s)."
        ))
