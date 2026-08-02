from datetime import datetime, timedelta
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from .. import models, oauth2
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# ── Schemas ──────────────────────────────────────────────────────────────────

class ViewCreate(BaseModel):
    read_pct: int

class HighlightCreate(BaseModel):
    text: str


# ── Instrumentation Endpoints ───────────────────────────────────────────────

@router.post("/posts/{post_id}/view")
def record_post_view(
    post_id: int,
    payload: ViewCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(oauth2.get_optional_user)
):
    """
    Record that a user has viewed a post and how far they read.
    Can be called anonymously or authenticated.
    """
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    read_pct = max(0, min(100, payload.read_pct))
    
    # Save the view event
    view = models.PostView(
        post_id=post_id,
        user_id=current_user.id if current_user else None,
        read_pct=read_pct
    )
    db.add(view)
    db.commit()
    return {"ok": True}


@router.post("/posts/{post_id}/highlights")
def record_passage_highlight(
    post_id: int,
    payload: HighlightCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """
    Record that a passage in the post content has been highlighted.
    """
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    cleaned_text = payload.text.strip()
    if not cleaned_text or len(cleaned_text) < 10:
        raise HTTPException(status_code=400, detail="Invalid highlight text selection")
        
    # Check if this exact text has already been highlighted on this post
    existing = db.query(models.PassageHighlight).filter(
        models.PassageHighlight.post_id == post_id,
        models.PassageHighlight.text == cleaned_text
    ).first()
    
    if existing:
        existing.count += 1
    else:
        new_highlight = models.PassageHighlight(
            post_id=post_id,
            text=cleaned_text,
            count=1
        )
        db.add(new_highlight)
        
    db.commit()
    return {"ok": True}


# ── Author Dashboard Queries ─────────────────────────────────────────────────

@router.get("/")
def get_author_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """
    Fetch comprehensive analytics metrics for the current logged-in author.
    Generates time-series, histograms, top highlights, and per-post summaries.
    """
    # 1. Get all post IDs owned by this author
    author_post_ids = [r[0] for r in db.query(models.Post.id).filter(models.Post.owner_id == current_user.id).all()]
    
    if not author_post_ids:
        return {
            "total_views": 0,
            "avg_read_through": 0,
            "views_over_time": [],
            "funnel": {"bounce": 0, "shallow": 0, "deep": 0, "complete": 0},
            "top_highlights": [],
            "posts_performance": []
        }
        
    # 2. Total views & average read-through rate
    total_views = db.query(models.PostView).filter(models.PostView.post_id.in_(author_post_ids)).count()
    
    avg_read_query = db.query(func.avg(models.PostView.read_pct)).filter(models.PostView.post_id.in_(author_post_ids)).scalar()
    avg_read_through = round(float(avg_read_query), 1) if avg_read_query else 0.0
    
    # 3. Reading Funnel (Bounce: < 20%, Shallow: 20-50%, Deep: 50-80%, Complete: >= 80%)
    bounce = db.query(models.PostView).filter(models.PostView.post_id.in_(author_post_ids), models.PostView.read_pct < 20).count()
    shallow = db.query(models.PostView).filter(models.PostView.post_id.in_(author_post_ids), models.PostView.read_pct >= 20, models.PostView.read_pct < 50).count()
    deep = db.query(models.PostView).filter(models.PostView.post_id.in_(author_post_ids), models.PostView.read_pct >= 50, models.PostView.read_pct < 80).count()
    complete = db.query(models.PostView).filter(models.PostView.post_id.in_(author_post_ids), models.PostView.read_pct >= 80).count()
    
    # 4. Views over time (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    time_series = db.query(
        func.date_trunc('day', models.PostView.created_at).label('day'),
        func.count(models.PostView.id).label('count')
    ).filter(
        models.PostView.post_id.in_(author_post_ids),
        models.PostView.created_at >= thirty_days_ago
    ).group_by('day').order_by('day').all()
    
    # Fill in date gaps so frontend gets a continuous line
    views_map = {t.day.date().isoformat(): t.count for t in time_series}
    continuous_time_series = []
    for i in range(31):
        date_key = (thirty_days_ago + timedelta(days=i)).date().isoformat()
        continuous_time_series.append({
            "date": date_key,
            "views": views_map.get(date_key, 0)
        })
        
    # 5. Top highlighted passages
    top_highlights = db.query(
        models.PassageHighlight.text,
        models.PassageHighlight.count,
        models.Post.title.label('post_title')
    ).join(
        models.Post, models.Post.id == models.PassageHighlight.post_id
    ).filter(
        models.PassageHighlight.post_id.in_(author_post_ids)
    ).order_by(
        models.PassageHighlight.count.desc()
    ).limit(5).all()
    
    highlights_payload = [{
        "text": h.text,
        "count": h.count,
        "post_title": h.post_title
    } for h in top_highlights]
    
    # 6. Performance per-post table
    posts_perf = db.query(
        models.Post.id,
        models.Post.title,
        func.count(models.PostView.id).label('views'),
        func.avg(models.PostView.read_pct).label('avg_read')
    ).outerjoin(
        models.PostView, models.PostView.post_id == models.Post.id
    ).filter(
        models.Post.owner_id == current_user.id
    ).group_by(
        models.Post.id, models.Post.title
    ).order_by(
        func.count(models.PostView.id).desc()
    ).all()
    
    posts_payload = [{
        "id": p.id,
        "title": p.title,
        "views": p.views,
        "avg_read_through": round(float(p.avg_read), 1) if p.avg_read else 0.0
    } for p in posts_perf]
    
    # 7. AI Advisor Insights
    advisor_insights = None
    groq_key = settings.groq_api_key
    if groq_key and author_post_ids and total_views > 0:
        total_bounce_pct = round((bounce / total_views) * 100) if total_views else 0
        total_shallow_pct = round((shallow / total_views) * 100) if total_views else 0
        total_deep_pct = round((deep / total_views) * 100) if total_views else 0
        total_complete_pct = round((complete / total_views) * 100) if total_views else 0
        
        top_h_str = "\n".join([f'- "{h.text[:80]}..." (highlighted {h.count} times in "{h.post_title}")' for h in top_highlights])
        posts_perf_str = "\n".join([f'- "{p.title}": {p.views} views, {round(float(p.avg_read), 1) if p.avg_read else 0.0}% completion' for p in posts_perf[:5]])
        
        data_summary = f"""
        Total Story Views: {total_views}
        Average Read-through Rate: {avg_read_through}%
        
        Readership Funnel Retention:
        - Bounced (<20% read): {bounce} ({total_bounce_pct}%)
        - Shallow (20-50% read): {shallow} ({total_shallow_pct}%)
        - Deep (50-80% read): {deep} ({total_deep_pct}%)
        - Complete (>=80% read): {complete} ({total_complete_pct}%)
        
        Top Crowdsourced Highlights:
        {top_h_str}
        
        Stories Performance:
        {posts_perf_str}
        """
        
        prompt = f"""You are the "Quill AI Writing Coach & Advisor". Analyze this creator's readership analytics data and provide 3 highly actionable, punchy, bulleted writing tips to improve their readership, hook rate, or engagement.

Creator Data:
{data_summary}

Keep your response highly concise, professional, and specific to their data (e.g. if they have a high bounce rate, suggest how to write better hooks; if a story has high completion, highlight it; suggest expanding on their popular highlight themes). Output only the 3 bulleted recommendations (using standard - bullet points). No intro, no closing remarks, no greeting.
"""
        try:
            with httpx.Client(timeout=10) as client:
                response = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.5,
                        "max_tokens": 300
                    }
                )
                if response.status_code == 200:
                    advisor_insights = response.json()["choices"][0]["message"]["content"].strip()
                else:
                    advisor_insights = "Error generating AI recommendations: status code " + str(response.status_code)
        except Exception as e:
            advisor_insights = "Failed to generate AI writing advisor insights: " + str(e)
            
    elif total_views == 0:
        advisor_insights = "- Share your published stories with other readers to begin generating AI writing advisor insights!\n- Add highlights or comments to engage your audience.\n- Keep writing stories to track views and completion rates."

    return {
        "total_views": total_views,
        "avg_read_through": avg_read_through,
        "views_over_time": continuous_time_series,
        "funnel": {
            "bounce": bounce,
            "shallow": shallow,
            "deep": deep,
            "complete": complete
        },
        "top_highlights": highlights_payload,
        "posts_performance": posts_payload,
        "advisor_insights": advisor_insights
    }
