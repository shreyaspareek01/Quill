import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Bookmark, Share2, Edit2, Trash2, Feather, Send, Sparkles, Quote, Highlighter, Headphones, VolumeX, Pause, Play, Flame, Globe, Loader2 } from 'lucide-react';
import { getPost, deletePost, summarizePost, sparkDiscussion, translatePost } from '../api/posts';
import { bookmarkPost, removeBookmark, getBookmarkStatus } from '../api/bookmarks';
import { getComments, createComment } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { logPassageHighlight } from '../api/analytics';
import { getMiniBadge } from '../components/BadgeRow';
import ReactionPicker from '../components/ReactionPicker';
import api from '../api/axios';

function getDominantColor(imgEl) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 40;
    canvas.height = 40;
    ctx.drawImage(imgEl, 0, 0, 40, 40);

    const imgData = ctx.getImageData(0, 0, 40, 40).data;
    const colorCounts = {};
    let maxCount = 0;
    let dominantColor = null;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      if (a < 125) continue;

      const qr = Math.round(r / 10) * 10;
      const qg = Math.round(g / 10) * 10;
      const qb = Math.round(b / 10) * 10;

      const key = `${qr},${qg},${qb}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;

      if (colorCounts[key] > maxCount) {
        maxCount = colorCounts[key];
        dominantColor = [qr, qg, qb];
      }
    }
    return dominantColor;
  } catch {
    return null;
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function timeAgo(d) {
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function cleanMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/[#*`_~]/g, '') // remove headings, bold, italic, code, strikethrough characters
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // replace links [text](url) with just text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // replace images ![alt](url) with alt text
    .replace(/>\s+/g, '') // remove blockquote indicators
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim();
}

function chunkText(text, maxLength = 180) {
  if (!text) return [];
  
  // Split by sentence ending punctuation across languages (English, Chinese, Hindi, etc.)
  // and newlines, keeping the delimiters using capturing group
  const parts = text.split(/([.!?。！?？|।\n]+)/);
  const sentences = [];
  
  for (let i = 0; i < parts.length; i += 2) {
    const content = parts[i] || '';
    const delimiter = parts[i + 1] || '';
    const sentence = (content + delimiter).trim();
    if (sentence) {
      sentences.push(sentence);
    }
  }
  
  if (sentences.length === 0) {
    return [text.trim()];
  }

  const chunks = [];
  for (let sentence of sentences) {
    if (sentence.length <= maxLength) {
      chunks.push(sentence);
    } else {
      let start = 0;
      while (start < sentence.length) {
        let chunk = sentence.substring(start, start + maxLength);
        if (start + maxLength < sentence.length) {
          const lastSpace = chunk.lastIndexOf(' ');
          if (lastSpace > maxLength / 2) {
            chunk = chunk.substring(0, lastSpace);
          }
        }
        const trimmed = chunk.trim();
        if (trimmed) {
          chunks.push(trimmed);
        }
        start += chunk.length;
      }
    }
  }
  return chunks;
}


export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  // — Commit 1: Dynamic Theming + Reading Progress —
  const [accentColor, setAccentColor] = useState(null); // "r, g, b" string
  const [readProgress, setReadProgress] = useState(0);
  const articleRef = useRef(null);
  const coverImgRef = useRef(null);

  // — Translation States & Refs —
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState(null); // { title, content, language }
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const translateMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (translateMenuRef.current && !translateMenuRef.current.contains(event.target)) {
        setShowTranslateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // — Commit 3: Text-to-Speech States & Refs —
  const [speaking, setSpeaking] = useState(false);
  const [speechPaused, setSpeechPaused] = useState(false);
  const chunksRef = useRef([]);
  const chunkIndexRef = useRef(0);
  const utteranceRef = useRef(null);
  const audioRef = useRef(null);
  const useFallbackRef = useRef(!('speechSynthesis' in window));
  const playNextChunkRef = useRef(null);
  const [sparking, setSparking] = useState(false);

  // — Commit 2: Inline Annotations —
  const [tooltip, setTooltip] = useState(null); // { x, y, text }
  const [highlights, setHighlights] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`quill-hl-${id}`) || '[]'); } catch { return []; }
  });
  const contentRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [postRes, commentsRes] = await Promise.all([
          getPost(id),
          getComments(id).catch(() => ({ data: [] })),
        ]);
        setData(postRes.data);
        setComments(commentsRes.data || []);
        if (user) {
          getBookmarkStatus(id).then(r => setBookmarked(r.data.bookmarked)).catch(() => {});
        }
      } catch { toast.error('Post not found'); navigate('/feed'); }
      finally { setLoading(false); }
    })();
  }, [id, user, navigate, toast]);

  // Reading progress scroll listener
  const maxProgressRef = useRef(0);

  useEffect(() => {
    if (!data) return;
    const handleScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const scrolled = Math.max(0, -el.getBoundingClientRect().top);
      const total = el.offsetHeight - window.innerHeight;
      const currentProgress = total <= 0 ? 100 : Math.min(100, (scrolled / total) * 100);
      setReadProgress(currentProgress);
      maxProgressRef.current = Math.max(maxProgressRef.current, currentProgress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data]);

  useEffect(() => {
    const postId = id;
    const handleUnload = () => {
      const token = localStorage.getItem('quill_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      fetch(`${baseUrl}/analytics/posts/${postId}/view`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ read_pct: Math.round(maxProgressRef.current) }),
        keepalive: true,
      });
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [id]);

  // Dominant color extraction from cover image
  const handleCoverLoad = useCallback(() => {
    const img = coverImgRef.current;
    if (!img) return;
    try {
      const color = getDominantColor(img);
      if (color) {
        const [r, g, b] = color;
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Filter out colours that are too dark or too washed out
        if (lum > 0.1 && lum < 0.92) setAccentColor(`${r}, ${g}, ${b}`);
      }
    } catch { /* cross-origin or tiny image — silently skip */ }
  }, []);

  // — Commit 2: Annotation helpers —
  const saveHighlights = useCallback((list) => {
    setHighlights(list);
    localStorage.setItem(`quill-hl-${id}`, JSON.stringify(list));
  }, [id]);

  const handleTextSelect = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length < 10) { setTooltip(null); return; }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top + scrollY - 52, text });
  }, []);

  const handleShareQuote = useCallback(() => {
    if (!tooltip) return;
    const quote = `"${tooltip.text}" — from "${data?.Post?.title || 'Quill'}"\n${window.location.href}`;
    navigator.clipboard.writeText(quote).then(() => toast.success('Quote copied!'));
    window.getSelection()?.removeAllRanges();
    setTooltip(null);
  }, [tooltip, data, toast]);

  const handleHighlight = useCallback(() => {
    if (!tooltip) return;
    const updated = highlights.includes(tooltip.text) ? highlights : [...highlights, tooltip.text];
    saveHighlights(updated);
    logPassageHighlight(id, tooltip.text).catch(() => {});
    toast.success('Highlighted!');
    window.getSelection()?.removeAllRanges();
    setTooltip(null);
  }, [id, tooltip, highlights, saveHighlights, toast]);

  // Dismiss tooltip on outside click
  useEffect(() => {
    const dismiss = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) setTooltip(null);
    };
    document.addEventListener('mousedown', dismiss);
    return () => document.removeEventListener('mousedown', dismiss);
  }, []);

  // Render paragraph content with highlights wrapped in <mark>
  const renderContent = useCallback((text) => {
    if (!highlights.length) return text;
    let result = text;
    highlights.forEach(hl => {
      if (text.includes(hl)) result = result.split(hl).join(`%%MARK%%${hl}%%ENDMARK%%`);
    });
    const parts = result.split(/(%%MARK%%.*?%%ENDMARK%%)/g);
    return parts.map((part, i) => {
      if (part.startsWith('%%MARK%%')) {
        const content = part.replace('%%MARK%%', '').replace('%%ENDMARK%%', '');
        return <mark key={i} className="quill-highlight">{content}</mark>;
      }
      return part;
    });
  }, [highlights]);

  // — Commit 3: Text-to-Speech logic —
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNextChunk = useCallback(() => {
    if (chunkIndexRef.current >= chunksRef.current.length) {
      setSpeaking(false);
      setSpeechPaused(false);
      utteranceRef.current = null;
      audioRef.current = null;
      return;
    }

    const chunk = chunksRef.current[chunkIndexRef.current];
    const isTranslated = !!translation;
    const currentUseFallback = useFallbackRef.current || isTranslated;

    if (currentUseFallback) {
      // Use Edge TTS Fallback proxied via backend
      api.get('/posts/tts', {
        params: {
          q: chunk,
          lang: isTranslated ? translation.language : 'en'
        },
        responseType: 'blob'
      })
      .then(response => {
        const blob = response.data;
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          chunkIndexRef.current++;
          playNextChunkRef.current();
        };

        audio.onerror = (e) => {
          const mediaError = audio.error;
          console.error('Audio playback error details:', {
            code: mediaError?.code,
            message: mediaError?.message,
            url: audioUrl,
            event: e
          });
          URL.revokeObjectURL(audioUrl);
          toast.error('Audio playback error occurred.');
          setSpeaking(false);
          setSpeechPaused(false);
          audioRef.current = null;
        };

        audio.play().catch(err => {
          console.error('Audio play failed:', err);
          URL.revokeObjectURL(audioUrl);
          setSpeaking(false);
          setSpeechPaused(false);
          audioRef.current = null;
        });
      })
      .catch(err => {
        console.error('Failed to fetch audio from TTS API:', err);
        let errorMsg = 'Failed to generate audio narration.';
        if (err.response) {
          // Read error message from blob response
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(reader.result);
              toast.error(`TTS Error: ${parsed.detail || errorMsg}`);
            } catch {
              toast.error(errorMsg);
            }
          };
          reader.readAsText(err.response.data);
        } else {
          toast.error(errorMsg);
        }
        setSpeaking(false);
        setSpeechPaused(false);
        audioRef.current = null;
      });
    } else {
      // Use standard Web Speech API
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(chunk);
      utteranceRef.current = utterance;

      utterance.onend = () => {
        chunkIndexRef.current++;
        playNextChunkRef.current();
      };

      utterance.onerror = (event) => {
        if (event.error === 'synthesis-failed' || event.error === 'language-unavailable') {
          console.warn(`Web Speech API failed with "${event.error}". Falling back to Google Translate TTS API...`);
          useFallbackRef.current = true;
          // Replay this chunk with fallback
          playNextChunkRef.current();
          return;
        }

        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          console.error('SpeechSynthesisUtterance error:', event);
          setSpeaking(false);
          setSpeechPaused(false);
          utteranceRef.current = null;
        }
      };

      synth.speak(utterance);
    }
  }, [translation, toast]);

  useEffect(() => {
    playNextChunkRef.current = playNextChunk;
  }, [playNextChunk]);

  const handleToggleSpeak = () => {
    if (!data) return;
    const synth = window.speechSynthesis;
    if (speaking) {
      if (speechPaused) {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        } else {
          synth.resume();
        }
        setSpeechPaused(false);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        } else {
          synth.pause();
        }
        setSpeechPaused(true);
      }
    } else {
      synth.cancel();
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const displayName = data.Post.owner?.full_name || data.Post.owner?.username || 'User';
      const cleanContent = cleanMarkdown(displayContent);
      const textToSpeak = `${displayTitle}. By ${displayName}. ${cleanContent}`;
      
      chunksRef.current = chunkText(textToSpeak);
      chunkIndexRef.current = 0;
      
      setSpeaking(true);
      setSpeechPaused(false);
      playNextChunkRef.current();
    }
  };

  const handleStopSpeak = () => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    setSpeaking(false);
    setSpeechPaused(false);
  };

  // Automatically stop narration when translation/language changes
  useEffect(() => {
    handleStopSpeak();
  }, [translation]);

  const accentRGB = accentColor ?? '184, 148, 46'; // fallback = gold

  const handleSparkDiscussion = async () => {
    if (sparking) return;
    setSparking(true);
    try {
      const res = await sparkDiscussion(data.Post.id);
      toast.success('Discussion sparked!');
      setComments(prev => [...prev, res.data]);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to spark discussion');
    } finally {
      setSparking(false);
    }
  };



  const handleBookmark = async () => {
    if (!user) { toast.error('Sign in to save'); return; }
    try {
      if (bookmarked) { await removeBookmark(data.Post.id); setBookmarked(false); toast.success('Removed'); }
      else { await bookmarkPost(data.Post.id); setBookmarked(true); toast.success('Saved'); }
    } catch { toast.error('Failed'); }
  };

  const handleSummarize = async () => {
    if (summary) { setShowSummary(!showSummary); return; }
    if (!data) return;
    setSummarizing(true);
    try {
      const res = await summarizePost(data.Post.id);
      setSummary(res.data.summary);
      setShowSummary(true);
    } catch { toast.error('AI summary unavailable'); }
    finally { setSummarizing(false); }
  };

  const handleTranslate = async (langName) => {
    handleStopSpeak();
    setShowTranslateMenu(false);
    setTranslating(true);
    try {
      const res = await translatePost(data.Post.id, langName);
      setTranslation({
        title: res.data.title,
        content: res.data.content,
        language: langName
      });
      toast.success(`Translated to ${langName}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${data.Post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: data.Post.title, url });
      } catch (err) {
        console.debug('Share failed or cancelled:', err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try { await deletePost(data.Post.id); toast.success('Deleted'); navigate('/feed'); }
    catch { toast.error('Could not delete'); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user) return;
    setReplyLoading(true);
    try {
      const { data: newComment } = await createComment({ content: replyText.trim(), post_id: parseInt(id) });
      setComments(prev => [...prev, newComment]);
      setReplyText('');
      toast.success('Reply posted');
    } catch { toast.error('Failed'); }
    finally { setReplyLoading(false); }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="skeleton" style={{ height: '36px', width: '60%', marginBottom: '20px' }} />
        <div className="skeleton" style={{ height: '16px', width: '100%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '16px', width: '90%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '16px', width: '70%' }} />
      </div>
    );
  }

  if (!data) return null;
  const { Post } = data;
  const displayTitle = translation ? translation.title : Post.title;
  const displayContent = translation ? translation.content : Post.content;
  const isOwner = user?.id === Post.owner_id;
  const displayName = Post.owner?.full_name || Post.owner?.username || Post.owner?.email?.split('@')[0] || 'User';
  const username = Post.owner?.username || Post.owner?.email?.split('@')[0] || 'user';

  return (
    <div className="fade-in" style={{ paddingBottom: 'var(--space-80)' }}>
      {/* ─── Reading progress bar ─── */}
      <div
        className="reading-progress-bar"
        style={{
          width: `${readProgress}%`,
          background: `linear-gradient(90deg, rgb(${accentRGB}), rgba(${accentRGB}, 0.35))`,
        }}
      />

      <button onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', marginBottom: '24px' }}>
        <ArrowLeft size={16} strokeWidth={1.5} />
        <span>Back</span>
      </button>

      <article
        ref={articleRef}
        style={{
          maxWidth: 'var(--shell-content-max)', margin: '0 auto',
          // Inject accent CSS variables scoped to this article
          '--color-accent': `rgb(${accentRGB})`,
          '--color-accent-subtle': `rgba(${accentRGB}, 0.09)`,
          '--color-accent-border': `rgba(${accentRGB}, 0.25)`,
        }}
      >
        <header style={{ marginBottom: '32px' }}>
          {translation && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-subtle)',
              border: '1px solid var(--color-accent-border)',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={16} style={{ color: 'var(--color-accent)' }} />
                <span>Translated to <strong>{translation.language}</strong></span>
              </div>
              <button 
                onClick={() => setTranslation(null)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-accent)', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: 0
                }}
              >
                Show Original
              </button>
            </div>
          )}
          {displayTitle && (
            <h1 className="font-serif" style={{ fontSize: 'var(--post-title-size)', lineHeight: 1.15, letterSpacing: 'var(--ls-tight)', marginBottom: '20px' }}>
              {displayTitle}
            </h1>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '2px solid var(--color-accent-border)' }}>
            <div className="avatar avatar-md" onClick={() => navigate(`/profile/${Post.owner_id}`)} style={{ cursor: 'pointer', background: Post.owner?.avatar_url ? `url(${Post.owner.avatar_url}) center/cover` : undefined }} />
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>{displayName}</span>
                {Post.owner?.badges?.length > 0 && (() => {
                  const mb = getMiniBadge(Post.owner.badges[0]);
                  return mb ? (
                    <span 
                      title={`${mb.label}: ${mb.description}`} 
                      style={{ cursor: 'help', fontSize: '12px', display: 'inline-flex', alignItems: 'center' }}
                    >
                      {mb.emoji}
                    </span>
                  ) : null;
                })()}
                <Feather size={11} strokeWidth={2} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span className="text-caption" style={{ fontSize: '12px' }}>@{username}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>·</span>
                <span className="text-caption" style={{ fontSize: '12px' }}>{formatDate(Post.created_at)}</span>
                {speaking && (
                  <>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>·</span>
                    <div className={`audio-playing-indicator ${speechPaused ? 'paused' : ''}`} title="Listening to post" style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '3px', height: '14px' }}>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span style={{ fontSize: '11px', color: 'var(--color-accent)', marginLeft: '4px', fontWeight: 500 }}>
                        {speechPaused ? 'Paused' : 'Listening'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {isOwner && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={handleSparkDiscussion} 
                  disabled={sparking}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(209, 74, 62, 0.08)',
                    border: '1px solid rgba(209, 74, 62, 0.15)',
                    color: 'var(--color-destructive)',
                    fontWeight: 600,
                    cursor: sparking ? 'not-allowed' : 'pointer',
                    transition: 'all var(--duration-fast) var(--ease-out)',
                  }}
                  title="Spark discussion with Devil's Advocate AI"
                >
                  <Flame size={14} fill="currentColor" />
                  {sparking ? 'Sparks Flying...' : 'Spark Discussion'}
                </button>
                <button className="btn-icon" onClick={() => navigate(`/posts/${Post.id}/edit`)} title="Edit">
                  <Edit2 size={16} strokeWidth={1.5} />
                </button>
                <button className="btn-icon" onClick={handleDelete} title="Delete" style={{ color: 'var(--color-destructive)' }}>
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </header>

        {Post.image_url && (
          <div style={{ marginBottom: '32px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-accent-border)' }}>
            <img
              ref={coverImgRef}
              src={Post.image_url}
              alt=""
              loading="lazy"
              crossOrigin="anonymous"
              onLoad={handleCoverLoad}
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        )}

        <div
          ref={contentRef}
          onMouseUp={handleTextSelect}
          style={{ fontSize: 'var(--post-content-size)', lineHeight: 1.8, color: 'var(--color-text-secondary)', marginBottom: '40px', userSelect: 'text', cursor: 'text', position: 'relative' }}
        >
          {displayContent.split('\n').map((para, i) =>
            para.trim() ? <p key={i} style={{ marginBottom: '1.5em' }}>{renderContent(para)}</p> : <br key={i} />
          )}
        </div>

        {/* ─── Annotation Tooltip ─── */}
        {tooltip && (
          <div
            ref={tooltipRef}
            className="annotation-tooltip"
            style={{ position: 'absolute', left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}
          >
            <button className="annotation-btn" onClick={handleShareQuote} title="Copy quote to clipboard">
              <Quote size={13} strokeWidth={2} />
              <span>Share Quote</span>
            </button>
            <div className="annotation-divider" />
            <button className="annotation-btn" onClick={handleHighlight} title="Highlight this passage">
              <Highlighter size={13} strokeWidth={2} />
              <span>Highlight</span>
            </button>
          </div>
        )}

        <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 600 }}>{comments.length}</span>
              <span className="text-label" style={{ fontSize: '10px' }}>Comments</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', color: 'var(--color-text-muted)' }}>
            <ReactionPicker postId={Post.id} />
            <button className="btn-icon" style={{ width: '36px', height: '36px' }}>
              <MessageCircle size={20} strokeWidth={1.5} />
            </button>
            <button onClick={handleBookmark} className="btn-icon"
              style={{ color: bookmarked ? 'var(--color-accent)' : 'inherit', width: '36px', height: '36px' }}>
              <Bookmark size={20} strokeWidth={1.5} fill={bookmarked ? 'var(--color-accent)' : 'none'} />
            </button>
            <button onClick={handleSummarize} disabled={summarizing} className="btn-icon"
              style={{ color: showSummary ? 'var(--color-accent)' : 'inherit', width: '36px', height: '36px' }}>
              <Sparkles size={20} strokeWidth={1.5} />
            </button>
            <div style={{ position: 'relative', display: 'inline-block' }} ref={translateMenuRef}>
              <button 
                onClick={() => setShowTranslateMenu(!showTranslateMenu)} 
                disabled={translating}
                className="btn-icon"
                style={{ color: translation ? 'var(--color-accent)' : 'inherit', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Translate post"
              >
                {translating ? (
                  <Loader2 size={20} strokeWidth={1.5} className="spin" style={{ color: 'var(--color-accent)' }} />
                ) : (
                  <Globe size={20} strokeWidth={1.5} />
                )}
              </button>
              
              {showTranslateMenu && (
                <div style={{
                  position: 'absolute',
                  bottom: '44px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--color-bg-card, #1e1e24)',
                  border: '1px solid var(--color-border, #2d2d34)',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.3))',
                  padding: '6px 0',
                  zIndex: 100,
                  minWidth: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  {['Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Hindi'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleTranslate(lang)}
                      style={{
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        padding: '8px 16px',
                        color: translation?.language === lang ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        fontSize: '13px',
                        fontWeight: translation?.language === lang ? 600 : 400,
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-hover, rgba(255,255,255,0.05))'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleToggleSpeak} className="btn-icon"
              style={{ color: speaking ? 'var(--color-accent)' : 'inherit', width: speaking ? 'auto' : '36px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', padding: speaking ? '0 10px' : '0', borderRadius: '18px', backgroundColor: speaking ? 'var(--color-accent-subtle)' : 'transparent', border: speaking ? '1px solid var(--color-accent-border)' : 'none' }}
              title={speaking ? (speechPaused ? 'Resume narration' : 'Pause narration') : 'Listen to post'}>
              {speaking ? (
                speechPaused ? <Play size={20} strokeWidth={1.5} /> : <Pause size={20} strokeWidth={1.5} />
              ) : (
                <Headphones size={20} strokeWidth={1.5} />
              )}
              {speaking && <span style={{ fontSize: '12px', fontWeight: 500 }}>{speechPaused ? 'Resume' : 'Pause'}</span>}
            </button>
            {speaking && (
              <button onClick={handleStopSpeak} className="btn-icon" style={{ color: 'var(--color-destructive)', width: '36px', height: '36px' }} title="Stop narration">
                <VolumeX size={20} strokeWidth={1.5} />
              </button>
            )}
            <button onClick={handleShare} className="btn-icon" style={{ marginLeft: 'auto', width: '36px', height: '36px' }}>
              <Share2 size={20} strokeWidth={1.5} />
            </button>
          </div>

          {showSummary && summary && (
            <div style={{
              marginTop: '20px', padding: '16px 20px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-subtle)',
              border: '1px solid var(--color-accent-border)',
              fontSize: '14px', lineHeight: 1.7,
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sparkles size={14} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--color-accent)' }}>AI Summary</span>
              </div>
              <p style={{ margin: 0 }}>{summary}</p>
            </div>
          )}
          {summarizing && (
            <div style={{
              marginTop: '20px', padding: '16px 20px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-subtle)',
              border: '1px solid var(--color-accent-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
                <div className="skeleton" style={{ height: '14px', width: '70%', borderRadius: '4px' }} />
              </div>
            </div>
          )}
        </footer>

        <section style={{ marginTop: '48px' }}>
          <h3 className="text-label" style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            Comments ({comments.length})
          </h3>

          {user ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div className="avatar avatar-sm" style={{ width: '32px', height: '32px', flexShrink: 0, background: user?.avatar_url ? `url(${user.avatar_url}) center/cover` : undefined }} />
              
              <div style={{ flex: 1 }}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 0', fontSize: '14px', lineHeight: 1.5,
                    border: 'none', borderBottom: '1px solid var(--color-border-strong)',
                    resize: 'none', backgroundColor: 'transparent', color: 'var(--color-text-primary)',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button onClick={handleReply} disabled={replyLoading || !replyText.trim()}
                    className="btn btn-primary btn-sm" style={{ opacity: !replyText.trim() ? 0.5 : 1 }}>
                    <Send size={14} strokeWidth={1.5} />
                    <span>Comment</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-caption" style={{ marginBottom: '24px' }}>Sign in to leave a comment.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p className="text-caption">No comments yet.</p>
              </div>
            ) : (
              comments.map(c => {
                const isDevil = c.user?.username === 'devils_advocate';
                return (
                  <div key={c.id} style={{ 
                    display: 'flex', 
                    gap: '10px',
                    padding: isDevil ? '12px 16px' : '0',
                    borderRadius: isDevil ? 'var(--radius-md)' : '0',
                    backgroundColor: isDevil ? 'rgba(209, 74, 62, 0.05)' : 'transparent',
                    border: isDevil ? '1px solid rgba(209, 74, 62, 0.15)' : 'none',
                    transition: 'all 200ms ease'
                  }}>
                    <div 
                      className="avatar avatar-sm" 
                      onClick={() => !isDevil && navigate(`/profile/${c.user_id}`)}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        flexShrink: 0, 
                        background: c.user?.avatar_url ? `url(${c.user.avatar_url}) center/cover` : undefined,
                        cursor: isDevil ? 'default' : 'pointer'
                      }} 
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span 
                          onClick={() => !isDevil && navigate(`/profile/${c.user_id}`)}
                          style={{ 
                            fontSize: '13px', 
                            fontWeight: 600, 
                            color: isDevil ? 'var(--color-destructive)' : 'inherit',
                            cursor: isDevil ? 'default' : 'pointer'
                          }}
                        >
                          {c.user?.full_name || c.user?.username || c.user?.email?.split('@')[0] || 'User'}
                        </span>
                        {!isDevil && c.user?.badges?.length > 0 && (() => {
                          const mb = getMiniBadge(c.user.badges[0]);
                          return mb ? (
                            <span 
                              title={`${mb.label}: ${mb.description}`} 
                              style={{ cursor: 'help', fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}
                            >
                              {mb.emoji}
                            </span>
                          ) : null;
                        })()}
                        {isDevil && (
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 700, 
                            backgroundColor: 'rgba(209, 74, 62, 0.12)', 
                            color: 'var(--color-destructive)', 
                            padding: '1px 5px', 
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            AI Opponent
                          </span>
                        )}
                        <span className="text-caption" style={{ fontSize: '11px' }}>· {timeAgo(c.created_at)}</span>
                      </div>
                      <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text-secondary)', fontStyle: isDevil ? 'italic' : 'normal' }}>{c.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </article>
    </div>
  );
}
