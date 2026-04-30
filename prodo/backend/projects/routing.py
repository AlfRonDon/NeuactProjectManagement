from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/activities/(?P<project_id>[0-9a-f-]+)/$", consumers.ActivityConsumer.as_asgi()),
]
