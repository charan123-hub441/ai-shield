import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
from auth import decode_token

router = APIRouter(tags=["calling"])

# ─── WebRTC Signaling ─────────────────────────────────────────────────────────
# Maps user_id → WebSocket for signaling
signal_connections: Dict[int, WebSocket] = {}


@router.websocket("/ws/signal")
async def signaling_server(websocket: WebSocket):
    await websocket.accept()

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = int(payload.get("sub"))
    signal_connections[user_id] = websocket

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            # Expected message format:
            # { "type": "offer"|"answer"|"ice-candidate"|"call-request"|"call-end",
            #   "target_id": <user_id>,
            #   "payload": { ... SDP or ICE data ... },
            #   "caller_name": "username"  }

            target_id = msg.get("target_id")
            if target_id and target_id in signal_connections:
                # Forward message to target user with sender info
                forward = {
                    "type": msg["type"],
                    "from_id": user_id,
                    "payload": msg.get("payload"),
                    "caller_name": msg.get("caller_name", "Unknown"),
                    "call_type": msg.get("call_type", "video")
                }
                try:
                    await signal_connections[target_id].send_text(json.dumps(forward))
                except:
                    pass

    except WebSocketDisconnect:
        pass
    finally:
        if user_id in signal_connections:
            del signal_connections[user_id]
