"""
Daily management command to take sprint burndown snapshots.
Run via cron: python manage.py take_snapshots

Handles backfill: if snapshots are missing for previous days,
reconstructs them from TaskStatusLog.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from projects.models import Sprint, SprintSnapshot, TaskStatusLog


class Command(BaseCommand):
    help = "Take daily burndown snapshots for all active sprints (with backfill)"

    def handle(self, *args, **options):
        today = timezone.now().date()
        active_sprints = Sprint.objects.filter(status="active")

        created = 0
        backfilled = 0

        for sprint in active_sprints:
            tasks = list(sprint.tasks.all())
            total = len(tasks)

            # Check for gaps and backfill
            existing_dates = set(
                sprint.snapshots.values_list("date", flat=True)
            )
            current = max(sprint.start_date, today - timedelta(days=30))  # max 30 days back
            while current < today:
                if current not in existing_dates and current >= sprint.start_date:
                    # Backfill from TaskStatusLog
                    done_by_date = TaskStatusLog.objects.filter(
                        task__sprint=sprint, to_status="done",
                        changed_at__date__lte=current,
                    ).values("task_id").distinct().count()

                    blocked_on_date = TaskStatusLog.objects.filter(
                        task__sprint=sprint, to_status="blocked",
                        changed_at__date=current,
                    ).values("task_id").distinct().count()

                    added = sum(
                        1 for t in tasks if t.created_at.date() <= current
                        and t.created_at.date() > sprint.start_date
                    )

                    SprintSnapshot.objects.create(
                        sprint=sprint, date=current,
                        total_tasks=total, done_tasks=done_by_date,
                        blocked_tasks=blocked_on_date, added_tasks=added,
                        is_backfilled=True,
                    )
                    backfilled += 1

                current += timedelta(days=1)

            # Today's snapshot
            done = sum(1 for t in tasks if t.status == "done")
            blocked = sum(1 for t in tasks if t.status == "blocked")
            added = sum(1 for t in tasks if t.created_at.date() > sprint.start_date)

            _, was_created = SprintSnapshot.objects.update_or_create(
                sprint=sprint, date=today,
                defaults={
                    "total_tasks": total, "done_tasks": done,
                    "blocked_tasks": blocked, "added_tasks": added,
                },
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Active sprints: {active_sprints.count()}. "
            f"New snapshots: {created}. Backfilled: {backfilled}."
        ))
