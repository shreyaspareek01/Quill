import httpx
import json
from cloudinary import uploader
import cloudinary
from sqlalchemy import func, text
from ..schemas import PostCreate, PostResponse, PostResponseWithVotes, PostSummaryResponse, GenerateContentRequest, GenerateContentResponse, GenerateCoverResponse, PolishTitleResponse, CoachRequest, CommentResponse, TranslatePostRequest, TranslatePostResponse
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db 
from .. import models,oauth2
from ..config import settings
from fastapi import status,Response,APIRouter,Depends,Query,Request
from fastapi.exceptions import HTTPException
from typing import Optional

async def generate_post_embedding(title: str, content: str) -> Optional[list[float]]:
    gemini_key = settings.gemini_api_key
    if not gemini_key:
        return None
    text_to_embed = f"Title: {title}\n\nContent: {content}"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={gemini_key}"
    payload = {
        "model": "models/gemini-embedding-2",
        "content": {
            "parts": [{"text": text_to_embed}]
        },
        "outputDimensionality": 768
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                return data["embedding"]["values"]
            else:
                print(f"Gemini embedding API error: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        print(f"Failed to fetch embedding: {e}")
        return None

router = APIRouter(prefix="/posts",tags=["Posts"])

def _post_query_base(db, user_id):
    voted_subquery = db.query(models.Vote.post_id).filter(models.Vote.user_id == user_id)
    reposted_subquery = db.query(models.Repost.post_id).filter(models.Repost.user_id == user_id)
    comment_subquery = db.query(func.count(models.Comment.id)).filter(models.Comment.post_id == models.Post.id).correlate(models.Post).scalar_subquery()
    repost_subquery = db.query(func.count(models.Repost.post_id)).filter(models.Repost.post_id == models.Post.id).correlate(models.Post).scalar_subquery()
    base = db.query(
        models.Post, 
        func.count(models.Vote.post_id).label("votes"),
        models.Post.id.in_(voted_subquery).label("has_voted"),
        models.Post.id.in_(reposted_subquery).label("has_reposted"),
        func.coalesce(comment_subquery, 0).label("comment_count"),
        func.coalesce(repost_subquery, 0).label("repost_count")
    ).join(
        models.Vote, models.Vote.post_id == models.Post.id, isouter=True
    )
    return base

def _format_results(results):
    return [{"Post": p, "votes": v, "has_voted": h, "has_reposted": hr, "comment_count": c, "repost_count": r} for p, v, h, hr, c, r in results]

@router.get("/",response_model=list[PostResponseWithVotes])
async def get_posts(db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user), limit: int = Query(10, ge=1, le=100), skip: int = Query(0, ge=0), search: Optional[str] = ""):
    user_id = user.id if user else -1
    results = _post_query_base(db, user_id).filter(
        models.Post.title.contains(search), models.Post.owner_id != user_id
    ).group_by(models.Post.id).order_by(models.Post.created_at.desc()).limit(limit).offset(skip).all()
    return _format_results(results)

@router.get("/user/{user_id}", response_model=list[PostResponseWithVotes])
async def get_user_posts(user_id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user), limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    current_user_id = user.id if user else -1
    results = _post_query_base(db, current_user_id).filter(
        models.Post.owner_id == user_id
    ).group_by(models.Post.id).order_by(models.Post.created_at.desc()).limit(limit).offset(skip).all()
    return _format_results(results)

@router.get("/liked/{user_id}", response_model=list[PostResponseWithVotes])
async def get_liked_posts(user_id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user)):
    current_user_id = user.id if user else -1
    liked_post_ids = db.query(models.Vote.post_id).filter(models.Vote.user_id == user_id).subquery()
    results = _post_query_base(db, current_user_id).filter(
        models.Post.id.in_(liked_post_ids)
    ).group_by(models.Post.id).order_by(models.Post.created_at.desc()).all()
    return _format_results(results)

@router.get("/following", response_model=list[PostResponseWithVotes])
async def get_following_posts(db: Session = Depends(get_db), user: models.User = Depends(oauth2.get_current_user), limit: int = Query(10, ge=1, le=100), skip: int = Query(0, ge=0)):
    followed_ids = db.query(models.Follow.following_id).filter(models.Follow.follower_id == user.id).subquery()
    results = _post_query_base(db, user.id).filter(
        models.Post.owner_id.in_(followed_ids)
    ).group_by(models.Post.id).order_by(models.Post.created_at.desc()).limit(limit).offset(skip).all()
    return _format_results(results)

@router.get("/recommended", response_model=list[PostResponseWithVotes])
async def get_recommended_posts(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(oauth2.get_optional_user),
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    user_id = user.id if user else -1
    # If the user is not authenticated or not logged in, we fall back to trending posts
    if not user:
        results = _post_query_base(db, -1).filter(
            models.Post.published == True
        ).group_by(models.Post.id).order_by(
            text("votes DESC, comment_count DESC, created_at DESC")
        ).limit(limit).offset(skip).all()
        return _format_results(results)
    
    # 1. Fetch engaged post IDs for user (liked, bookmarked, commented, or reposted)
    liked_ids = db.query(models.Vote.post_id).filter(models.Vote.user_id == user.id)
    bookmarked_ids = db.query(models.Bookmark.post_id).filter(models.Bookmark.user_id == user.id)
    commented_ids = db.query(models.Comment.post_id).filter(models.Comment.user_id == user.id)
    reposted_ids = db.query(models.Repost.post_id).filter(models.Repost.user_id == user.id)
    
    engaged_post_ids_query = liked_ids.union(bookmarked_ids).union(commented_ids).union(reposted_ids)
    engaged_post_ids = [r[0] for r in engaged_post_ids_query.all()]
    
    # 2. Compute centroid of embeddings
    centroid = None
    if engaged_post_ids:
        # Fetch embeddings for those posts
        engaged_posts = db.query(models.Post.embedding).filter(
            models.Post.id.in_(engaged_post_ids),
            models.Post.embedding != None
        ).all()
        if engaged_posts:
            embeddings = [p[0] for p in engaged_posts]
            dim = len(embeddings[0])
            centroid = [sum(emb[i] for emb in embeddings) / len(embeddings) for i in range(dim)]
            
    # 3. If there is no centroid (no history or no embedded engaged posts), fall back to trending posts
    if centroid is None:
        results = _post_query_base(db, user.id).filter(
            models.Post.owner_id != user.id,
            models.Post.published == True
        ).group_by(models.Post.id).order_by(
            text("votes DESC, comment_count DESC, created_at DESC")
        ).limit(limit).offset(skip).all()
        return _format_results(results)
        
    # 4. Cosine similarity query using pgvector's cosine distance
    results = _post_query_base(db, user.id).filter(
        models.Post.owner_id != user.id,
        models.Post.published == True,
        models.Post.embedding != None
    ).group_by(models.Post.id).order_by(
        models.Post.embedding.cosine_distance(centroid)
    ).limit(limit).offset(skip).all()
    
    return _format_results(results)

@router.get("/trending", response_model=list[PostResponseWithVotes])
async def get_trending_posts(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(oauth2.get_optional_user),
    limit: int = Query(10, ge=1, le=100)
):
    user_id = user.id if user else -1
    
    # Construct subqueries for comment and repost counts to use in popularity score
    comment_subquery = db.query(func.count(models.Comment.id)).filter(models.Comment.post_id == models.Post.id).correlate(models.Post).scalar_subquery()
    repost_subquery = db.query(func.count(models.Repost.post_id)).filter(models.Repost.post_id == models.Post.id).correlate(models.Post).scalar_subquery()
    
    popularity_score = (
        func.count(models.Vote.post_id) +
        func.coalesce(comment_subquery, 0) * 2 +
        func.coalesce(repost_subquery, 0) * 3
    )
    
    results = _post_query_base(db, user_id).filter(
        models.Post.published == True
    ).group_by(models.Post.id).order_by(
        popularity_score.desc(),
        models.Post.created_at.desc()
    ).limit(limit).all()
    return _format_results(results)


@router.get("/tts")
async def get_tts(q: str, lang: Optional[str] = "en"):
    import edge_tts
    # Map input language codes/names to localized high-fidelity Edge TTS neural voices
    voice_map = {
        "es": "es-ES-ElviraNeural",
        "spanish": "es-ES-ElviraNeural",
        "fr": "fr-FR-DeniseNeural",
        "french": "fr-FR-DeniseNeural",
        "de": "de-DE-KatjaNeural",
        "german": "de-DE-KatjaNeural",
        "ja": "ja-JP-NanamiNeural",
        "japanese": "ja-JP-NanamiNeural",
        "zh": "zh-CN-XiaoxiaoNeural",
        "chinese": "zh-CN-XiaoxiaoNeural",
        "hi": "hi-IN-SwaraNeural",
        "hindi": "hi-IN-SwaraNeural",
    }
    target_lang = (lang or "en").lower().strip()
    voice = voice_map.get(target_lang, "en-US-JennyNeural")
    
    audio_data = b""
    try:
        communicate = edge_tts.Communicate(q, voice)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
    except Exception as e:
        print(f"Edge TTS streaming error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"TTS generation failed: {e}")

    return Response(content=audio_data, media_type="audio/mpeg")


@router.post("/{id}/translate", response_model=TranslatePostResponse)
async def translate_post(id: int, req: TranslatePostRequest, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post with id:{id} not found!")
        
    groq_key = settings.groq_api_key
    if not groq_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GROQ_API_KEY not configured")

    target_language = req.target_language.strip()
    if target_language.lower() in ["chinese", "zh"]:
        target_language = "Chinese (Simplified)"

    prompt = f"""Translate the following blog post title and content into the target language: "{target_language}".
    
    Translate accurately, preserving the natural flow and tone of the original text.
    STRICTLY preserve all markdown formatting, paragraphs, headers, bold text, italics, and URLs/links in the content. Do not remove or change URLs/links.
    
    You must output your translation in the following exact format:
    
    ===TITLE===
    [Translated Title Here]
    
    ===CONTENT===
    [Translated Content Here]
    
    Do not add any other conversational text or introduction. Start directly with ===TITLE===.
    
    Original Title: {post.title or ""}
    Original Content: {post.content or ""}
    """

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": "You are a professional translator that translates content accurately and formats the response using the exact requested separators: ===TITLE=== and ===CONTENT===. Do not output any preamble, markdown blocks outside the tags, or conversational text."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 4000
                }
            )
            
            if response.status_code != 200:
                print(f"Groq API translate error: {response.text}")
                error_detail = "AI translation failed"
                try:
                    err_json = response.json()
                    error_detail = err_json.get("error", {}).get("message", response.text)
                except Exception:
                    if response.text:
                        error_detail = response.text
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Groq Error: {error_detail}")
            
            result = response.json()
            translation_text = result["choices"][0]["message"]["content"].strip()
            import re
            # Split the text using any separator tag like ===TITLE===, ===Título===, ===CONTENT===, etc.
            parts = re.split(r'===[^=\n]+===', translation_text)
            
            # If splitting by tags yielded at least 3 parts (before tag, title, content)
            if len(parts) >= 3:
                title = parts[1].strip()
                content = parts[2].strip()
            else:
                # Fallback: try case-insensitive text search for TITLE/CONTENT/CONTENIDO etc.
                parts_fallback = re.split(r'===CONTENT===|===CONTENIDO===|===CONTENU===|===INHALT===|===内容===|===विषय===', translation_text, flags=re.IGNORECASE)
                if len(parts_fallback) >= 2:
                    title = parts_fallback[0].replace("===TITLE=== ", "").replace("===title=== ", "").replace("===TITLE===", "").replace("===title===", "").strip()
                    content = parts_fallback[1].strip()
                else:
                    # Final fallback: split by double newlines, take the first line as title, the rest as content
                    lines = [l for l in translation_text.split("\n") if l.strip()]
                    if len(lines) >= 2:
                        title = lines[0].replace("===TITLE===", "").replace("===title===", "").strip()
                        content = "\n\n".join(lines[1:]).replace("===CONTENT===", "").replace("===content===", "").strip()
                    else:
                        print(f"Regex parsing failed. Raw translation text: {translation_text}")
                        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI translation output format was invalid")
            
            return {
                "title": title,
                "content": content
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Translation execution error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{id}", response_model=PostResponseWithVotes)
async def get_post(id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user)):
    user_id = user.id if user else -1
    result = _post_query_base(db, user_id).filter(models.Post.id == id).group_by(models.Post.id).first()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post with id:{id} not found!")
    p, v, h, hr, c, r = result
    return {"Post": p, "votes": v, "has_voted": h, "has_reposted": hr, "comment_count": c, "repost_count": r}

@router.post("/",status_code=status.HTTP_201_CREATED,response_model=PostResponse)
async def create_post(post:PostCreate,db:Session = Depends(get_db),user: int = Depends(oauth2.get_current_user)):
    emb = await generate_post_embedding(post.title, post.content)
    new_post = models.Post(owner_id=user.id, embedding=emb, **post.model_dump());
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.delete("/{id}",status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(id:int,db:Session=Depends(get_db),user: int = Depends(oauth2.get_current_user)):
    post_query = db.query(models.Post).filter(models.Post.id==id)
    post = post_query.first()
    if post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id: {id} not found!")
    if post.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Not authorized to perform the requested action")
    post_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
   
@router.put("/{id}",response_model=PostResponse)
async def update_post(id:int, post:PostCreate,db:Session=Depends(get_db),user:int = Depends(oauth2.get_current_user)):
    post_query = db.query(models.Post).filter(models.Post.id==id)
    db_post = post_query.first()
    if db_post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id: {id} not found!")
    if db_post.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Not authorized to perform the requested action")
    
    emb = await generate_post_embedding(post.title, post.content)
    update_data = post.model_dump()
    if emb is not None:
        update_data["embedding"] = emb
        
    post_query.update(update_data,synchronize_session=False)
    db.commit()
    return post_query.first()

@router.post("/{id}/summarize", response_model=PostSummaryResponse)
async def summarize_post(id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post with id:{id} not found!")
    
    groq_key = settings.groq_api_key
    if not groq_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GROQ_API_KEY not configured")

    title = (post.title or "").strip()
    content = (post.content or "").strip()

    if len(title) + len(content) < 30:
        return {"summary": "This post has nothing substantial to summarize."}

    prompt = f"""Summarize this:

Title: {title}
Content: {content}

Give a concise 2-3 sentence summary. If the content is vague or meaningless, just say "Nothing meaningful to summarize." — never ask the user to provide more content."""

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 200
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI summarization failed")
        
        result = response.json()
        summary = result["choices"][0]["message"]["content"].strip()
    
    return {"summary": summary}

@router.post("/generate-content", response_model=GenerateContentResponse)
async def generate_content(req: GenerateContentRequest):
    groq_key = settings.groq_api_key
    if not groq_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GROQ_API_KEY not configured")

    title = req.title.strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

    prompt = f"""Write 3-4 paragraphs of blog content for a post titled "{title}".

Use a natural, engaging tone — start with an intro, develop the idea, end with a concluding thought. Output only the body paragraphs, no title, no preamble, no markdown."""

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 600
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Content generation failed")

        result = response.json()
        content = result["choices"][0]["message"]["content"].strip()

    return {"content": content}

@router.post("/generate-cover", response_model=GenerateCoverResponse)
async def generate_cover(req: GenerateContentRequest):
    title = req.title.strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

    gemini_key = settings.gemini_api_key
    hf_key = settings.hf_api_key

    if not gemini_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GEMINI_API_KEY not configured")
    if not hf_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="HF_API_KEY not configured")

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )

    async with httpx.AsyncClient(timeout=120) as client:
        gemini_resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}",
            json={
                "contents": [{"parts": [{"text": f"Generate a short 2-sentence image prompt for a blog cover about: {title}. Describe the main subject and visual style. No explanation."}]}]
            }
        )

        if gemini_resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Prompt generation failed")

        gemini_result = gemini_resp.json()
        prompt = gemini_result["candidates"][0]["content"]["parts"][0]["text"].strip()

        flux_resp = await client.post(
            "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
            headers={"Authorization": f"Bearer {hf_key}"},
            json={"inputs": prompt},
        )

        if flux_resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Image generation failed")

        img_bytes = flux_resp.content
        upload_result = uploader.upload(img_bytes, folder="quill/covers/ai", resource_type="image")
        return {"image_url": upload_result.get("secure_url")}

@router.post("/polish-title", response_model=PolishTitleResponse)
async def polish_title(req: GenerateContentRequest):
    title = req.title.strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

    groq_key = settings.groq_api_key
    if not groq_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GROQ_API_KEY not configured")

    prompt = f"""Make this blog post title more engaging and clickable while keeping the original intent:

"{title}"

Output only the polished title, nothing else."""

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 100
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Title polish failed")

        result = response.json()
        polished = result["choices"][0]["message"]["content"].strip().strip('"')

    return {"title": polished}

@router.post("/coach")
async def post_coach(req: CoachRequest, request: Request, user: models.User = Depends(oauth2.get_current_user)):
    gemini_key = settings.gemini_api_key
    if not gemini_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    content = req.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")

    prompt = f"""You are an elite, encouraging AI writing coach. Analyze the following blog post draft.
Provide constructive, actionable feedback. Your feedback MUST address:
1. CLARITY SCORE: Evaluate the overall clarity on a scale of 1-10. Follow it with a brief 1-sentence justification.
2. HOOK STRENGTH: Evaluate the first 2-3 sentences. Give a constructive recommendation for improvement.
3. RHYTHM & VOICE: Offer a 2-sentence note on sentence structure variety, flow, and tone.
4. ACTIONABLE SUGGESTIONS: Provide exactly 2-3 specific, bulleted rewrite or editing recommendations.

Keep your feedback highly concise, structured, and focused on helping the author improve immediately. Do not include markdown headers or greetings. Make the response structure readable.

Draft Content:
{content}
"""

    async def event_generator():
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key={gemini_key}&alt=sse"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    yield "data: " + json.dumps({"error": "Failed to connect to AI coach"}) + "\n\n"
                    return
                
                async for line in response.aiter_lines():
                    if await request.is_disconnected():
                        break
                    if line.startswith("data:"):
                        try:
                            # Strip "data:" prefix and deserialize
                            clean_line = line[5:].strip()
                            data_json = json.loads(clean_line)
                            text_chunk = data_json["candidates"][0]["content"]["parts"][0]["text"]
                            yield f"data: {json.dumps({'text': text_chunk})}\n\n"
                        except Exception:
                            # Skip standard keepalives or formatting hiccups
                            pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/{id}/devil-comment", status_code=status.HTTP_201_CREATED, response_model=CommentResponse)
async def create_devil_comment(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
    if post.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the post owner can spark discussion")
        
    groq_key = settings.groq_api_key
    if not groq_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GROQ_API_KEY not configured")
        
    title = (post.title or "").strip()
    content = (post.content or "").strip()
    
    prompt = f"""You are the "Devil's Advocate". Your purpose is to read the post title and content, and provide a single, highly engaging, respectful but challenging counter-argument or alternative perspective to spark critical discussion. Keep your response relatively brief (2-4 sentences or a short paragraph). Do not include any meta-text, introductory greeting like "Here's a counter-argument:" or "As the Devil's Advocate...". Respond directly with the counter-argument.

Post Title: {title}
Post Content: {content}
"""

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 300
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI generation failed")
            
        res_json = response.json()
        devil_response = res_json["choices"][0]["message"]["content"].strip()

    devil_user = db.query(models.User).filter(models.User.email == "devilsadvocate@quill.ai").first()
    if not devil_user:
        devil_user = models.User(
            email="devilsadvocate@quill.ai",
            username="devils_advocate",
            full_name="Devil's Advocate",
            bio="I counter your arguments to spark critical thinking.",
            avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=devils_advocate",
            password="ai_system_user_secret_password"
        )
        db.add(devil_user)
        db.commit()
        db.refresh(devil_user)

    new_comment = models.Comment(content=devil_response, post_id=id, user_id=devil_user.id)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    from .notifications import create_notification
    create_notification(
        db,
        user_id=post.owner_id,
        actor_id=devil_user.id,
        type="comment",
        post_id=post.id
    )
    
    return new_comment


