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


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/projects/", include("projects.urls")),
    path("api/auth/me/", me_view),
    path("api/users/", users_list_view),
    path("oidc/", include("mozilla_django_oidc.urls")),
]
