"""
Caching layer for expensive dashboard computations.

Uses Django's cache framework with TTL. Invalidated on TaskStatusLog writes
via a signal in signals.py.

At current scale (< 10 projects), this is optional. At 50+ projects with
a year of history, it prevents timeouts on portfolio_dashboard and diagnostic.
"""
from functools import wraps
from django.core.cache import cache

# Cache key prefixes
PREFIX_RISK = "dash:risk:"
PREFIX_TREND = "dash:trend:"
PREFIX_DIAGNOSTIC = "dash:diag:"
PREFIX_PORTFOLIO = "dash:portfolio"
PREFIX_WORKLOAD = "dash:workload"
PREFIX_BRIEF = "dash:brief"

# Default TTL: 2 minutes. Short enough to feel live, long enough to survive
# a page refresh storm without re-querying.
DEFAULT_TTL = 120


def cache_key_project(prefix, project_id):
    return f"{prefix}{project_id}"


def cache_key_sprint(prefix, sprint_id):
    return f"{prefix}{sprint_id}"


def invalidate_project(project_id):
    """Invalidate all caches related to a project. Called on TaskStatusLog write."""
    cache.delete(cache_key_project(PREFIX_RISK, project_id))
    cache.delete(cache_key_project(PREFIX_TREND, project_id))
    cache.delete(cache_key_project(PREFIX_DIAGNOSTIC, project_id))
    cache.delete(PREFIX_PORTFOLIO)
    cache.delete(PREFIX_WORKLOAD)
    cache.delete(PREFIX_BRIEF)


def invalidate_sprint(sprint_id):
    """Invalidate sprint-specific caches."""
    cache.delete(cache_key_sprint(PREFIX_DIAGNOSTIC, sprint_id))


def invalidate_all():
    """Nuclear option: clear all dashboard caches."""
    # Since we use the default cache, and keys are prefixed, we can't
    # selectively clear only our keys without listing them. For safety,
    # we clear the keys we know about.
    cache.delete(PREFIX_PORTFOLIO)
    cache.delete(PREFIX_WORKLOAD)
    cache.delete(PREFIX_BRIEF)


def cached_computation(prefix, key_arg="project_id", ttl=DEFAULT_TTL):
    """
    Decorator for caching expensive computation results.

    Usage:
        @cached_computation(PREFIX_RISK, key_arg="project_id")
        def compute_risk(project_id, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Try to extract the cache key from kwargs or first arg
            cache_id = kwargs.get(key_arg)
            if cache_id is None and args:
                # First arg is likely the project/sprint object
                first = args[0]
                if hasattr(first, 'id'):
                    cache_id = str(first.id)
                elif hasattr(first, 'pk'):
                    cache_id = str(first.pk)

            if cache_id:
                key = f"{prefix}{cache_id}"
                cached = cache.get(key)
                if cached is not None:
                    return cached

            result = func(*args, **kwargs)

            if cache_id:
                cache.set(key, result, ttl)

            return result
        return wrapper
    return decorator
