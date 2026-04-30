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
        return Response({
            "authenticated": True,
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
        })
    return Response({"authenticated": False})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/projects/", include("projects.urls")),
    path("api/auth/me/", me_view),
    path("oidc/", include("mozilla_django_oidc.urls")),
]
