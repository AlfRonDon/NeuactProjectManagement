from datetime import timedelta

# Thread-local visited set to prevent infinite cascade on cycles
_cascade_visited = set()


def cascade_dates(task, old_start_date, old_due_date):
    """
    When a task's dates shift, cascade to successors ONLY if there's an overlap
    (successor's date violates the dependency constraint).
    Preserves successor's task duration when shifting.
    Handles cycles: tracks visited tasks to prevent infinite recursion.
    """
    from .models import TaskDependency
    global _cascade_visited

    # Guard against cycles
    if task.pk in _cascade_visited:
        return
    _cascade_visited.add(task.pk)

    try:
        successor_links = TaskDependency.objects.filter(
            predecessor=task
        ).select_related("successor")

        for link in successor_links:
            successor = link.successor
            if successor.pk in _cascade_visited:
                continue  # skip: already visited (cycle)

            lag = timedelta(days=link.lag_days)
            shift = _calc_overlap_shift(link.dependency_type, task, successor, lag)

            if shift and shift.days > 0:
                if successor.start_date:
                    successor.start_date += shift
                if successor.due_date:
                    successor.due_date += shift
                successor.save()
    finally:
        _cascade_visited.discard(task.pk)
        # Clean up when we're back at the top of the recursion
        if not _cascade_visited:
            _cascade_visited = set()


def _calc_overlap_shift(dep_type, predecessor, successor, lag):
    """
    Returns a timedelta to shift the successor forward, or None if no overlap.
    Only shifts forward (positive delta) — never pulls dates back.
    """
    if dep_type == "FS":
        # Successor start must be >= predecessor due_date + lag
        if predecessor.due_date and successor.start_date:
            required = predecessor.due_date + lag
            if required > successor.start_date:
                return required - successor.start_date

    elif dep_type == "SS":
        # Successor start must be >= predecessor start_date + lag
        if predecessor.start_date and successor.start_date:
            required = predecessor.start_date + lag
            if required > successor.start_date:
                return required - successor.start_date

    elif dep_type == "FF":
        # Successor due_date must be >= predecessor due_date + lag
        if predecessor.due_date and successor.due_date:
            required = predecessor.due_date + lag
            if required > successor.due_date:
                return required - successor.due_date

    elif dep_type == "SF":
        # Successor due_date must be >= predecessor start_date + lag
        if predecessor.start_date and successor.due_date:
            required = predecessor.start_date + lag
            if required > successor.due_date:
                return required - successor.due_date

    return None
