from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, MilestoneViewSet, TaskViewSet,
    SubTaskViewSet, CommentViewSet, ChangelogViewSet,
    NotificationViewSet, orchestrate,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"milestones", MilestoneViewSet, basename="milestone")
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"changelogs", ChangelogViewSet, basename="changelog")
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
    # Nested: /api/projects/tasks/{task_pk}/subtasks/
    path("tasks/<uuid:task_pk>/subtasks/", SubTaskViewSet.as_view({"get": "list", "post": "create"}), name="task-subtasks"),
    path("tasks/<uuid:task_pk>/subtasks/<uuid:pk>/", SubTaskViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}), name="task-subtask-detail"),
    # Nested: /api/projects/tasks/{task_pk}/comments/
    path("tasks/<uuid:task_pk>/comments/", CommentViewSet.as_view({"get": "list", "post": "create"}), name="task-comments"),
    path("tasks/<uuid:task_pk>/comments/<uuid:pk>/", CommentViewSet.as_view({"get": "retrieve", "delete": "destroy"}), name="task-comment-detail"),
    path("orchestrate/", orchestrate, name="pm-orchestrate"),
]
