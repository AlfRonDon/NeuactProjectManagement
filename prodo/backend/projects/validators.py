from django.core.exceptions import ValidationError


def check_circular_dependency(predecessor_id, successor_id):
    """
    BFS upstream from predecessor to detect if successor already exists
    in the chain. Prevents cycles (A→B→C→A) and self-dependencies (A→A).
    """
    from .models import TaskDependency

    if predecessor_id == successor_id:
        raise ValidationError("A task cannot depend on itself.")

    visited = set()
    queue = [predecessor_id]
    while queue:
        current = queue.pop(0)
        if current in visited:
            continue
        visited.add(current)
        if current == successor_id:
            raise ValidationError("This dependency would create a circular reference.")
        upstream_ids = TaskDependency.objects.filter(
            successor_id=current
        ).values_list("predecessor_id", flat=True)
        queue.extend(upstream_ids)
