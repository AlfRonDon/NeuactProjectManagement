import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ActivityConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time activity feed.

    Connect to: ws://<host>/ws/activities/<project_id>/
    Receives JSON messages when new activities are created for that project.
    """

    async def connect(self):
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.group_name = f"activities_{self.project_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def activity_created(self, event):
        """Handler for activity.created messages sent to the group."""
        await self.send(text_data=json.dumps(event["data"]))


class GlobalActivityConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for all activities across all projects.

    Connect to: ws://<host>/ws/activities/
    """

    async def connect(self):
        self.group_name = "activities_global"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def activity_created(self, event):
        await self.send(text_data=json.dumps(event["data"]))
