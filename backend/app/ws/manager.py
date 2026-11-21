"""In-process pub/sub for meeting events. Swap for Redis to scale horizontally."""
import asyncio
from collections import defaultdict
from typing import Any
from fastapi import WebSocket


class MeetingHub:
    def __init__(self):
        self._channels: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def subscribe(self, meeting_id: str, ws: WebSocket):
        async with self._lock:
            self._channels[meeting_id].add(ws)

    async def unsubscribe(self, meeting_id: str, ws: WebSocket):
        async with self._lock:
            self._channels[meeting_id].discard(ws)
            if not self._channels[meeting_id]:
                self._channels.pop(meeting_id, None)

    async def publish(self, meeting_id: str, event: dict[str, Any]):
        subs = list(self._channels.get(meeting_id, ()))
        for ws in subs:
            try:
                await ws.send_json(event)
            except Exception:
                pass


hub = MeetingHub()
