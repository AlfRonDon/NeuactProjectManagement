from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


@receiver(post_save, sender="projects.Task")
def handle_task_status_change(sender, instance, **kwargs):
    """
    When a task completes, unblock successors whose all predecessors are done.
    When a previously-done task is re-opened, re-block its successors.
    """
    if getattr(instance, "_skip_dependency_signal", False):
        return

    from .models import TaskDependency

    if instance.status == "done":
        # Unblock successors if all their predecessors are now done
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
        # Re-opened task: re-block successors that aren't done/cancelled/already blocked
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

        # Create blocker activity
        from .models import Activity
        Activity.objects.create(
            project=successor.project,
            task=successor,
            activity_type="blocker",
            title=f"{successor.title} is blocked by {instance.predecessor.title}",
            description=f"Task cannot proceed until \"{instance.predecessor.title}\" is completed.",
        )


@receiver(post_save, sender="projects.Comment")
def create_mention_activity(sender, instance, created, **kwargs):
    """When a comment is created on a task, create a mention activity."""
    if not created:
        return
    from .models import Activity
    task = instance.task
    Activity.objects.create(
        project=task.project,
        task=task,
        activity_type="mention",
        title=f"{instance.author} commented on {task.title}",
        description=instance.text[:200],
    )


@receiver(post_delete, sender="projects.TaskDependency")
def unblock_on_dependency_delete(sender, instance, **kwargs):
    """When a dependency is removed, unblock successor if no remaining incomplete predecessors."""
    from .models import TaskDependency

    try:
        successor = instance.successor
    except Exception:
        return  # successor was deleted too (cascade)

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
    """Broadcast new activities to the project's WebSocket group."""
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

    # Send to project-specific group
    async_to_sync(channel_layer.group_send)(group_name, message)
    # Send to global group
    async_to_sync(channel_layer.group_send)("activities_global", message)
