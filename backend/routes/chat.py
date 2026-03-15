import json
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, List

from database import get_db, SessionLocal
from auth import get_current_user, decode_token
import models
import schemas

router = APIRouter(tags=["chat"])

# ─── Active WebSocket connections: conversation_id → [(user_id, ws)] ─────────
active_connections: Dict[int, List[tuple]] = {}


@router.post("/conversations", response_model=schemas.ConversationOut, status_code=201)
def create_conversation(
    payload: schemas.ConversationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    other = db.query(models.User).filter(models.User.username == payload.username).first()
    if not other:
        raise HTTPException(404, "User not found")
    if other.id == current_user.id:
        raise HTTPException(400, "Cannot chat with yourself")

    # Check if conversation already exists between these two
    my_convos = (
        db.query(models.ConversationMember.conversation_id)
        .filter(models.ConversationMember.user_id == current_user.id)
        .subquery()
    )
    existing = (
        db.query(models.ConversationMember)
        .filter(
            models.ConversationMember.conversation_id.in_(my_convos),
            models.ConversationMember.user_id == other.id
        )
        .first()
    )
    if existing:
        conv = db.query(models.Conversation).filter(models.Conversation.id == existing.conversation_id).first()
        return _conv_to_out(conv, current_user.id, db)

    # Create new conversation
    conv = models.Conversation()
    db.add(conv)
    db.flush()
    db.add(models.ConversationMember(conversation_id=conv.id, user_id=current_user.id))
    db.add(models.ConversationMember(conversation_id=conv.id, user_id=other.id))
    db.commit()
    db.refresh(conv)
    return _conv_to_out(conv, current_user.id, db)


@router.get("/conversations", response_model=list[schemas.ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    my_conv_ids = (
        db.query(models.ConversationMember.conversation_id)
        .filter(models.ConversationMember.user_id == current_user.id)
        .all()
    )
    conv_ids = [c[0] for c in my_conv_ids]
    convos = (
        db.query(models.Conversation)
        .filter(models.Conversation.id.in_(conv_ids))
        .order_by(models.Conversation.created_at.desc())
        .all()
    )
    return [_conv_to_out(c, current_user.id, db) for c in convos]


@router.get("/conversations/{conv_id}/messages", response_model=list[schemas.ChatMessageOut])
def get_messages(
    conv_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify user is member
    member = db.query(models.ConversationMember).filter(
        models.ConversationMember.conversation_id == conv_id,
        models.ConversationMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(403, "Not a member of this conversation")

    msgs = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.conversation_id == conv_id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )
    return [
        schemas.ChatMessageOut(
            id=m.id,
            sender_id=m.sender_id,
            sender_username=m.sender.username if m.sender else "Unknown",
            text=m.text,
            created_at=m.created_at
        )
        for m in msgs
    ]


# ─── WebSocket for real-time chat ─────────────────────────────────────────────
@router.websocket("/ws/chat/{conv_id}")
async def chat_websocket(websocket: WebSocket, conv_id: int):
    await websocket.accept()

    # Authenticate via token in query string
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = int(payload.get("sub"))
    db = SessionLocal()

    try:
        # Verify membership
        member = db.query(models.ConversationMember).filter(
            models.ConversationMember.conversation_id == conv_id,
            models.ConversationMember.user_id == user_id
        ).first()
        if not member:
            await websocket.close(code=4003)
            return

        user = db.query(models.User).filter(models.User.id == user_id).first()
        username = user.username if user else "Unknown"

        # Register connection
        if conv_id not in active_connections:
            active_connections[conv_id] = []
        active_connections[conv_id].append((user_id, websocket))

        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            text = msg_data.get("text", "").strip()
            if not text:
                continue

            # Save to DB
            chat_msg = models.ChatMessage(
                conversation_id=conv_id,
                sender_id=user_id,
                text=text
            )
            db.add(chat_msg)
            db.commit()
            db.refresh(chat_msg)

            # Broadcast to all connected clients in this conversation
            broadcast = json.dumps({
                "id": chat_msg.id,
                "sender_id": user_id,
                "sender_username": username,
                "text": text,
                "created_at": chat_msg.created_at.isoformat()
            })
            for uid, ws in active_connections.get(conv_id, []):
                try:
                    await ws.send_text(broadcast)
                except:
                    pass

    except WebSocketDisconnect:
        pass
    finally:
        if conv_id in active_connections:
            active_connections[conv_id] = [
                (uid, ws) for uid, ws in active_connections[conv_id]
                if ws != websocket
            ]
        db.close()


# ─── Helper ──────────────────────────────────────────────────────────────────
def _conv_to_out(conv, current_user_id, db):
    other_member = None
    for m in conv.members:
        if m.user_id != current_user_id:
            other_member = m
            break

    other_user = db.query(models.User).filter(models.User.id == other_member.user_id).first() if other_member else None

    last_msg = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.conversation_id == conv.id)
        .order_by(models.ChatMessage.created_at.desc())
        .first()
    )

    return schemas.ConversationOut(
        id=conv.id,
        other_user=other_user.username if other_user else "Unknown",
        other_user_id=other_user.id if other_user else 0,
        last_message=last_msg.text if last_msg else None,
        created_at=conv.created_at
    )
