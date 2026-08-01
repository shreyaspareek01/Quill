import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon, Loader2, Sparkles, X, RefreshCw, Copy } from 'lucide-react';
import { getPost, updatePost, createPost, generateContent, generateCover, polishTitle } from '../api/posts';
import { uploadPostImage } from '../api/uploads';
import { useToast } from '../context/ToastContext';

export default function PostFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ title: '', content: '', image_url: '', published: true });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [generating, setGenerating] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [polishing, setPolishing] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await getPost(id);
        const { title, content, image_url, published } = data.Post;
        setForm({ title, content, image_url: image_url || '', published });
      } catch { toast.error('Could not load post'); navigate('/feed'); }
      finally { setFetching(false); }
    })();
  }, [id, isEdit, navigate, toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { data } = await uploadPostImage(file);
      setForm(prev => ({ ...prev, image_url: data.image_url || '' }));
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingImage(false); }
  };

  const handleGenerateCover = async () => {
    if (!form.title.trim()) { toast.error('Enter a title first'); return; }
    setGeneratingCover(true);
    try {
      const { data } = await generateCover(form.title.trim());
      setForm(prev => ({ ...prev, image_url: data.image_url }));
      toast.success('Cover generated');
    } catch { toast.error('Cover generation failed'); }
    finally { setGeneratingCover(false); }
  };

  const handlePolishTitle = async () => {
    if (!form.title.trim()) { toast.error('Enter a title first'); return; }
    setPolishing(true);
    try {
      const { data } = await polishTitle(form.title.trim());
      setForm(prev => ({ ...prev, title: data.title }));
      toast.success('Title polished');
    } catch { toast.error('Title polish failed'); }
    finally { setPolishing(false); }
  };

  const handleGenerate = async () => {
    if (!form.title.trim()) { toast.error('Enter a title first'); return; }
    setGenerating(true);
    try {
      const { data } = await generateContent(form.title.trim());
      setForm(prev => ({ ...prev, content: data.content }));
      toast.success('Content generated');
    } catch { toast.error('Generation failed'); }
    finally { setGenerating(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, image_url: form.image_url || null };
      if (isEdit) {
        await updatePost(id, payload);
        toast.success('Post updated');
        navigate(`/posts/${id}`);
      } else {
        const { data } = await createPost(payload);
        toast.success('Post published');
        navigate(`/posts/${data.id}`);
      }
    } catch { toast.error('Action failed'); }
    finally { setLoading(false); }
  };

  const [coachOpen, setCoachOpen] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [coachStatus, setCoachStatus] = useState('idle'); // idle, typing, loading, streaming
  const abortControllerRef = useRef(null);

  // Debouncing logic for coach
  useEffect(() => {
    if (!coachOpen) return;
    if (form.content.trim().length < 40) {
      setCoachStatus('idle');
      return;
    }

    setCoachStatus('typing');
    const delayDebounce = setTimeout(() => {
      triggerCoach(form.content);
    }, 2500);

    return () => clearTimeout(delayDebounce);
  }, [form.content, coachOpen]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  async function triggerCoach(content) {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setCoachStatus('loading');
    setCoachFeedback('');

    try {
      const token = localStorage.getItem('quill_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${baseUrl}/posts/coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        setCoachStatus('idle');
        setCoachFeedback('Could not fetch writing suggestions. Please try again.');
        return;
      }

      setCoachStatus('streaming');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data:')) {
            try {
              const data = JSON.parse(cleanLine.substring(5).trim());
              if (data.text) {
                setCoachFeedback(prev => prev + data.text);
              } else if (data.error) {
                setCoachFeedback(data.error);
              }
            } catch {
              // skip
            }
          }
        }
      }
      setCoachStatus('idle');
    } catch (err) {
      if (err.name !== 'AbortError') {
        setCoachStatus('idle');
        setCoachFeedback('Connection interrupted. Please try again.');
      }
    }
  }

  const handleCopyFeedback = () => {
    if (!coachFeedback) return;
    navigator.clipboard.writeText(coachFeedback);
    toast.success('Suggestions copied to clipboard!');
  };

  const renderFormattedFeedback = (text) => {
    if (!text) return null;

    const clarityMatch = text.match(/(?:clarity score|clarity):\s*(\d+(?:\.\d+)?)\s*\/10/i);
    const score = clarityMatch ? clarityMatch[1] : null;

    let cleanText = text;
    if (score) {
      cleanText = text.replace(/.*(?:clarity score|clarity):\s*\d+(?:\.\d+)?\/10.*\n?/gi, '');
    }

    const paragraphs = cleanText.split('\n').filter(p => p.trim());

    return (
      <div>
        {score && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--color-gold-subtle)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            border: '1px solid var(--color-gold)'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gold)' }}>Clarity Score</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-gold)' }}>{score}/10</span>
          </div>
        )}
        
        <button 
          type="button" 
          onClick={handleCopyFeedback} 
          className="btn btn-secondary btn-sm" 
          style={{ 
            width: '100%', 
            marginBottom: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '6px' 
          }}
        >
          <Copy size={13} />
          <span>Copy Suggestions</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px', lineHeight: 1.6 }}>
          {paragraphs.map((p, idx) => {
            const isBullet = p.trim().startsWith('-') || p.trim().startsWith('*');
            const content = p.replace(/^[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
            
            if (isBullet) {
              return (
                <div key={idx} style={{ display: 'flex', gap: '8px', paddingLeft: '4px' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold', flexShrink: 0 }}>•</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{content}</span>
                </div>
              );
            }
            
            const isHeader = p.toUpperCase().includes('HOOK STRENGTH:') || p.toUpperCase().includes('RHYTHM & VOICE:') || p.toUpperCase().includes('ACTIONABLE SUGGESTIONS:');
            if (isHeader) {
              return (
                <div key={idx} style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '8px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                  {p.replace(/\*\*/g, '')}
                </div>
              );
            }

            return (
              <p key={idx} style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                {p.replace(/\*\*/g, '')}
              </p>
            );
          })}
        </div>
      </div>
    );
  };

  if (fetching) return <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-md)' }} />;

  return (
    <div className="fade-in" style={{ paddingBottom: 'var(--space-80)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="text-caption" style={{ fontStyle: 'italic' }}>
            {form.content.split(/\s+/).filter(x => x).length} words
          </span>
          <button type="button" onClick={() => setCoachOpen(!coachOpen)} className={`btn ${coachOpen ? 'btn-primary' : 'btn-secondary'} btn-sm`} style={{ gap: '6px' }}>
            <Sparkles size={14} strokeWidth={1.5} />
            <span>{coachOpen ? 'Hide Coach' : 'AI Coach'}</span>
          </button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={loading || uploadingImage}>
            {loading ? <Loader2 size={14} strokeWidth={2} /> : <Save size={14} strokeWidth={1.5} />}
            <span>{isEdit ? 'Save' : 'Publish'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', position: 'relative' }}>
        <form onSubmit={handleSubmit} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: '32px' }}>
            {form.image_url ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <img src={form.image_url} alt="" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={handleGenerateCover} disabled={generatingCover || !form.title.trim()}
                    style={{ padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#FFF', fontSize: '12px', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {generatingCover ? <Loader2 size={13} strokeWidth={2} className="spin" /> : <Sparkles size={13} strokeWidth={1.5} />}
                    <span>Regenerate</span>
                  </button>
                  <button type="button" onClick={() => document.getElementById('cover-upload').click()}
                    style={{ padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#FFF', fontSize: '12px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    Change Cover
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => document.getElementById('cover-upload').click()}
                  style={{
                    flex: 1, height: '180px', border: '1px dashed var(--color-border-strong)',
                    borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '8px',
                    color: 'var(--color-text-muted)', transition: 'all var(--duration-fast) var(--ease-out)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'; e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                >
                  {uploadingImage ? <Loader2 size={24} strokeWidth={1.5} /> : <ImageIcon size={24} strokeWidth={1.5} />}
                  <span style={{ fontSize: '14px' }}>{uploadingImage ? 'Uploading...' : 'Upload cover'}</span>
                </button>
                <button type="button" onClick={handleGenerateCover} disabled={generatingCover || !form.title.trim()}
                  style={{
                    width: '180px', height: '180px', border: '1px dashed var(--color-border-strong)',
                    borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '8px',
                    color: 'var(--color-gold)', transition: 'all var(--duration-fast) var(--ease-out)',
                    opacity: !form.title.trim() || generatingCover ? 0.5 : 1,
                    cursor: !form.title.trim() || generatingCover ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (form.title.trim() && !generatingCover) { e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'; e.currentTarget.style.borderColor = 'var(--color-gold)'; }}}
                  onMouseLeave={e => { if (form.title.trim() && !generatingCover) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}}
                >
                  {generatingCover ? <Loader2 size={24} strokeWidth={1.5} className="spin" /> : <Sparkles size={24} strokeWidth={1.5} />}
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{generatingCover ? 'Generating...' : 'AI Cover'}</span>
                </button>
              </div>
            )}
            <input id="cover-upload" type="file" hidden accept="image/*" onChange={handleImageSelect} />
          </div>

          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="A Compelling Title..."
              className="font-serif"
              autoFocus
              style={{
                border: 'none', backgroundColor: 'transparent', width: '100%',
                fontSize: 'var(--post-form-title-size)', lineHeight: 1.1, color: 'var(--color-text-primary)',
                paddingRight: '240px', letterSpacing: 'var(--ls-tight)',
              }}
            />
            <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '6px' }}>
              <button type="button" onClick={handlePolishTitle} disabled={polishing || !form.title.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                  borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)',
                  backgroundColor: polishing ? 'var(--color-gold-subtle)' : 'transparent',
                  color: 'var(--color-gold)', fontSize: '11px', fontWeight: 600,
                  opacity: !form.title.trim() || polishing ? 0.5 : 1,
                  cursor: !form.title.trim() || polishing ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (form.title.trim() && !polishing) { e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'; }}}
                onMouseLeave={e => { if (form.title.trim() && !polishing) { e.currentTarget.style.backgroundColor = 'transparent'; }}}
              >
                {polishing ? <Loader2 size={12} strokeWidth={2} className="spin" /> : <Sparkles size={12} strokeWidth={1.5} />}
                <span>Polish</span>
              </button>
              <button type="button" onClick={handleGenerate} disabled={generating || !form.title.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                  borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)',
                  backgroundColor: generating ? 'var(--color-gold-subtle)' : 'transparent',
                  color: 'var(--color-gold)', fontSize: '11px', fontWeight: 600,
                  opacity: !form.title.trim() || generating ? 0.5 : 1,
                  cursor: !form.title.trim() || generating ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (form.title.trim() && !generating) { e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'; }}}
                onMouseLeave={e => { if (form.title.trim() && !generating) { e.currentTarget.style.backgroundColor = 'transparent'; }}}
              >
                {generating ? <Loader2 size={12} strokeWidth={2} className="spin" /> : <Sparkles size={12} strokeWidth={1.5} />}
                <span>Write</span>
              </button>
            </div>
          </div>

          <textarea name="content" value={form.content} onChange={handleChange}
            placeholder="Every great idea starts as a sentence..."
            rows={15}
            style={{
              border: 'none', backgroundColor: 'transparent', width: '100%',
              fontSize: 'var(--post-form-content-size)', lineHeight: 1.8, color: 'var(--color-text-secondary)',
              minHeight: '50vh', resize: 'vertical', padding: 0,
            }}
          />
        </form>

        {coachOpen && (
          <div style={{
            width: '340px',
            position: 'sticky',
            top: '24px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg)',
            padding: '24px',
            height: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-sm)',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
                <span className="font-serif" style={{ fontSize: '16px', fontWeight: 700 }}>AI Writing Coach</span>
              </div>
              <button type="button" onClick={() => setCoachOpen(false)} className="btn-icon" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            {/* Status Indicator Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 
                  coachStatus === 'typing' ? 'var(--color-text-muted)' :
                  coachStatus === 'loading' ? 'var(--color-gold)' :
                  coachStatus === 'streaming' ? '#73d13d' : 'transparent',
                boxShadow: (coachStatus === 'loading' || coachStatus === 'streaming') ? '0 0 8px currentColor' : 'none',
              }} />
              <span>
                {coachStatus === 'idle' && 'Idle (waiting for changes)'}
                {coachStatus === 'typing' && 'Listening for pause...'}
                {coachStatus === 'loading' && 'Analyzing draft...'}
                {coachStatus === 'streaming' && 'Writing suggestions...'}
              </span>
              
              {form.content.trim().length >= 40 && coachStatus === 'idle' && (
                <button type="button" onClick={() => triggerCoach(form.content)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={10} />
                  <span>Analyze</span>
                </button>
              )}
            </div>

            {/* Coach Feedback Stream Area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {!coachFeedback && coachStatus === 'idle' ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  <p style={{ margin: '0 0 12px 0' }}>Write at least 40 characters to receive automatic coaching feedback on style, hook strength, clarity, and edits.</p>
                </div>
              ) : (
                renderFormattedFeedback(coachFeedback)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

