from datetime import timedelta


def cascade_dates(task, old_start_date, old_due_date):
    """
    When a task's dates shift, cascade to successors ONLY if there's an overlap
    (successor's date violates the dependency constraint).
    Preserves successor's task duration when shifting.
    """
    from .models import TaskDependency

    successor_links = TaskDependency.objects.filter(
        predecessor=task
    ).select_related("successor")

    for link in successor_links:
        successor = link.successor
        lag = timedelta(days=link.lag_days)
        shift = _calc_overlap_shift(link.dependency_type, task, successor, lag)

        if shift and shift.days > 0:
            if successor.start_date:
                successor.start_date += shift
            if successor.due_date:
                successor.due_date += shift
            # Skip cascade guard to avoid extra DB read in save(),
            # but allow recursive cascade to successor's own successors
            successor.save()


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
