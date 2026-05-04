from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def me_view(request):
    """Return current user info from JWT or session."""
    if request.user and request.user.is_authenticated:
        keycloak_id = None
        if hasattr(request.user, "profile"):
            keycloak_id = str(request.user.profile.keycloak_id)
        return Response({
            "authenticated": True,
            "keycloak_id": keycloak_id,
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
        })
    return Response({"authenticated": False})


@api_view(["GET"])
def users_list_view(request):
    """Return all known users for assignment dropdowns."""
    from projects.models import UserProfile
    profiles = UserProfile.objects.select_related("user").all()
    data = [
        {
            "keycloak_id": str(p.keycloak_id),
            "username": p.user.username,
            "display_name": p.display_name or p.user.get_full_name() or p.user.username,
        }
        for p in profiles
    ]
    return Response(data)


from projects.views import (
    calendar_view, portfolio_view, portfolio_dashboard_view,
    workload_calendar_view, morning_brief_view,
    pull_work_view, accept_suggestion_view, dismiss_suggestion_view,
    risk_history_view,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/projects/", include("projects.urls")),
    path("api/portfolio/", portfolio_view),
    path("api/portfolio/dashboard/", portfolio_dashboard_view),
    path("api/calendar/", calendar_view),
    path("api/workload/", workload_calendar_view),
    path("api/workload/pull/", pull_work_view),
    path("api/brief/", morning_brief_view),
    path("api/suggestions/accept/", accept_suggestion_view),
    path("api/suggestions/dismiss/", dismiss_suggestion_view),
    path("api/risk-history/", risk_history_view),
    path("api/auth/me/", me_view),
    path("api/users/", users_list_view),
    path("oidc/", include("mozilla_django_oidc.urls")),
]
