import asyncio
import json
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models, oauth2
from ..database import get_db, SessionLocal

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ── Helper ──────────────────────────────────────────────────────────────────

def _serialize(n: models.Notification) -> dict:
    actor_name = (
        n.actor.full_name
        or n.actor.username
        or n.actor.email.split("@")[0]
    )
    return {
        "id":         n.id,
        "type":       n.type,
        "read":       n.read,
        "created_at": n.created_at.isoformat(),
        "actor": {
            "id":         n.actor_id,
            "name":       actor_name,
            "avatar_url": n.actor.avatar_url,
        },
        "post": {
            "id":    n.post_id,
            "title": n.post.title if n.post else None,
        } if n.post_id else None,
    }


def create_notification(
    db: Session,
    *,
    user_id: int,   # recipient
    actor_id: int,  # who did the action
    type: str,      # 'like' | 'follow' | 'comment' | 'repost'
    post_id: int | None = None,
):
    """
    Insert a notification row and commit.
    Silently no-ops if actor == recipient (no self-notifications).
    """
    if user_id == actor_id:
        return
    notif = models.Notification(
        user_id=user_id,
        actor_id=actor_id,
        type=type,
        post_id=post_id,
    )
    db.add(notif)
    db.commit()


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/")
def list_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    """Return the 20 most-recent notifications for the current user."""
    notifs = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize(n) for n in notifs]


@router.put("/read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    """Mark every unread notification as read for the current user."""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.read == False,  # noqa: E712
    ).update({"read": True}, synchronize_session=False)
    db.commit()
    return {"ok": True}


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.read == False,  # noqa: E712
    ).count()
    return {"count": count}


@router.get("/stream")
async def notification_stream(
    request: Request,
    token: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Server-Sent Events stream — pushes new notifications to the client
    in real time without WebSocket handshake overhead.

    Handles EventSource authentication by falling back to the `token` query
    parameter if the standard 'Authorization' header is absent (since native
    EventSource does not support custom headers).
    """
    from ..oauth2 import verify_access_token
    from fastapi import HTTPException

    actual_token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        actual_token = auth_header.split(" ")[1]
    elif token:
        actual_token = token

    if not actual_token:
        raise HTTPException(status_code=401, detail="Not authorized")

    try:
        token_data = verify_access_token(
            actual_token, HTTPException(status_code=401)
        )
        user = (
            db.query(models.User)
            .filter(models.User.id == token_data.id)
            .first()
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Not authorized")

    if not user:
        raise HTTPException(status_code=401, detail="Not authorized")

    uid = user.id

    async def event_generator():
        # Seed last_id so we only stream NEW notifications, not history
        db_session = SessionLocal()
        try:
            last = (
                db_session.query(models.Notification)
                .filter(models.Notification.user_id == uid)
                .order_by(models.Notification.id.desc())
                .first()
            )
            last_id = last.id if last else 0
        finally:
            db_session.close()

        while True:
            await asyncio.sleep(4)
            db_session = SessionLocal()
            try:
                new = (
                    db_session.query(models.Notification)
                    .filter(
                        models.Notification.user_id == uid,
                        models.Notification.id > last_id,
                    )
                    .order_by(models.Notification.id.asc())
                    .all()
                )
                if new:
                    last_id = new[-1].id
                    payload = json.dumps([_serialize(n) for n in new])
                    yield f"data: {payload}\n\n"
                else:
                    # Keepalive comment — prevents proxy/browser timeout
                    yield ": keepalive\n\n"
            except Exception:
                yield ": error\n\n"
            finally:
                db_session.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",   # disables nginx response buffering
            "Connection":       "keep-alive",
        },
    )
