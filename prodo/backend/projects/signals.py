from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone


@receiver(pre_save, sender="projects.Task")
def track_task_status_change(sender, instance, **kwargs):
    """Log every status change for pace/velocity/trend calculations."""
    if not instance.pk:
        return

    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    if old.status != instance.status:
        instance._old_status = old.status

        if instance.status == "done" and old.status != "done":
            instance.completed_at = timezone.now()
        elif instance.status != "done" and old.status == "done":
            instance.completed_at = None


@receiver(post_save, sender="projects.Task")
def handle_task_status_change(sender, instance, created, **kwargs):
    """
    Handles: status log, auto-blocker creation/reactivation, dependency cascading.

    Blocker fix: reactivates existing resolved blockers instead of creating duplicates.
    The age clock keeps running from original creation (spec: briefly unblocking
    shouldn't reset the age clock).
    """
    old_status = getattr(instance, "_old_status", "")
    if created:
        old_status = ""
        from .models import TaskStatusLog
        TaskStatusLog.objects.create(task=instance, from_status="", to_status=instance.status)
        # Invalidate caches
        from .cache import invalidate_project
        invalidate_project(str(instance.project_id))
    elif old_status and old_status != instance.status:
        from .models import TaskStatusLog
        TaskStatusLog.objects.create(
            task=instance, from_status=old_status, to_status=instance.status,
        )
        from .cache import invalidate_project
        invalidate_project(str(instance.project_id))

        # Auto-create/reactivate Blocker when task becomes blocked
        if instance.status == "blocked" and old_status != "blocked":
            from .models import Blocker, TaskDependency

            # Build a detailed reason
            blocking = TaskDependency.objects.filter(
                successor=instance
            ).exclude(predecessor__status="done").select_related("predecessor")
            reason_parts = []
            for dep in blocking:
                reason_parts.append(f"Waiting on \"{dep.predecessor.title}\" ({dep.dependency_type})")

            if not reason_parts:
                # Check if manually blocked (no dependency cause)
                if instance.previous_status:
                    reason_parts.append(f"Manually blocked (was {instance.previous_status})")
                else:
                    reason_parts.append("Task marked as blocked")

            reason = "; ".join(reason_parts)
            downstream = TaskDependency.objects.filter(predecessor=instance).count()

            # REACTIVATE existing resolved blocker instead of creating duplicate
            existing = Blocker.objects.filter(task=instance, status="resolved").order_by("-created_at").first()
            if existing:
                existing.status = "active"
                existing.resolved_at = None
                existing.reason = reason
                existing.downstream_count = downstream
                existing.assigned_to = instance.assignee
                existing.save(update_fields=[
                    "status", "resolved_at", "reason", "downstream_count",
                    "assigned_to", "updated_at",
                ])
            else:
                # Only create new if no prior blocker exists for this task
                if not Blocker.objects.filter(task=instance, status="active").exists():
                    Blocker.objects.create(
                        project=instance.project,
                        task=instance,
                        reason=reason,
                        downstream_count=downstream,
                        assigned_to=instance.assignee,
                    )

        # Auto-resolve Blocker when task is unblocked
        if old_status == "blocked" and instance.status != "blocked":
            from .models import Blocker
            Blocker.objects.filter(
                task=instance, status="active"
            ).update(status="resolved", resolved_at=timezone.now())

    if getattr(instance, "_skip_dependency_signal", False):
        return

    from .models import TaskDependency

    if instance.status == "done":
        successor_links = TaskDependency.objects.filter(
            predecessor=instance
        ).select_related("successor")
        for link in successor_links:
            successor = link.successor
            if successor.status != "blocked":
                continue
            all_done = not TaskDependency.objects.filter(
                successor=successor
            ).exclude(predecessor__status="done").exists()
            if all_done:
                successor._skip_dependency_signal = True
                successor.status = successor.previous_status or "todo"
                successor.previous_status = ""
                successor.save(update_fields=["status", "previous_status", "updated_at"])

    elif instance.status not in ("blocked", "cancelled"):
        successor_links = TaskDependency.objects.filter(
            predecessor=instance
        ).select_related("successor")
        for link in successor_links:
            successor = link.successor
            if successor.status in ("blocked", "done", "cancelled"):
                continue
            successor._skip_dependency_signal = True
            successor.previous_status = successor.status
            successor.status = "blocked"
            successor.save(update_fields=["status", "previous_status", "updated_at"])


@receiver(post_save, sender="projects.TaskDependency")
def block_on_dependency_create(sender, instance, created, **kwargs):
    """When a new dependency is created, block the successor if predecessor isn't done."""
    if created and instance.predecessor.status != "done":
        successor = instance.successor
        if successor.status not in ("blocked", "done", "cancelled"):
            successor._skip_dependency_signal = True
            successor.previous_status = successor.status
            successor.status = "blocked"
            successor.save(update_fields=["status", "previous_status", "updated_at"])

        from .models import Activity
        Activity.objects.create(
            project=successor.project,
            task=successor,
            activity_type="blocker",
            title=f"{successor.title} is blocked by {instance.predecessor.title}",
            description=f"Task cannot proceed until \"{instance.predecessor.title}\" is completed. Dependency type: {instance.dependency_type}.",
        )


@receiver(post_save, sender="projects.Sprint")
def inherit_sprint_policies(sender, instance, created, **kwargs):
    """When a new sprint is created, inherit policies from the previous sprint."""
    if not created:
        return
    from .models import Sprint
    previous = Sprint.objects.filter(
        project=instance.project, number__lt=instance.number
    ).order_by("-number").first()
    if previous:
        instance.inherit_policies_from(previous)


@receiver(post_save, sender="projects.Comment")
def create_mention_activity(sender, instance, created, **kwargs):
    if not created:
        return
    from .models import Activity
    task = instance.task
    Activity.objects.create(
        project=task.project, task=task, activity_type="mention",
        title=f"{instance.author} commented on {task.title}",
        description=instance.text[:200],
    )


@receiver(post_delete, sender="projects.TaskDependency")
def unblock_on_dependency_delete(sender, instance, **kwargs):
    from .models import TaskDependency
    try:
        successor = instance.successor
    except Exception:
        return

    if successor.status == "blocked":
        remaining_blockers = TaskDependency.objects.filter(
            successor=successor
        ).exclude(predecessor__status="done").exists()
        if not remaining_blockers:
            successor._skip_dependency_signal = True
            successor.status = successor.previous_status or "todo"
            successor.previous_status = ""
            successor.save(update_fields=["status", "previous_status", "updated_at"])


@receiver(post_save, sender="projects.Activity")
def broadcast_activity(sender, instance, created, **kwargs):
    if not created:
        return

    channel_layer = get_channel_layer()
    group_name = f"activities_{instance.project_id}"

    triggered_by = None
    if instance.triggered_by:
        triggered_by = {
            "keycloak_id": str(instance.triggered_by.keycloak_id),
            "username": instance.triggered_by.user.username,
            "display_name": instance.triggered_by.display_name,
        }

    message = {
        "type": "activity.created",
        "data": {
            "id": str(instance.id),
            "project": str(instance.project_id),
            "task": str(instance.task_id) if instance.task_id else None,
            "task_title": instance.task.title if instance.task else None,
            "activity_type": instance.activity_type,
            "title": instance.title,
            "description": instance.description,
            "triggered_by": triggered_by,
            "read": instance.read,
            "created_at": instance.created_at.isoformat(),
        },
    }

    async_to_sync(channel_layer.group_send)(group_name, message)
    async_to_sync(channel_layer.group_send)("activities_global", message)
