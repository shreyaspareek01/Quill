import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { getPost, updatePost, createPost, generateContent, generateCover } from '../api/posts';
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
          <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={loading || uploadingImage}>
            {loading ? <Loader2 size={14} strokeWidth={2} /> : <Save size={14} strokeWidth={1.5} />}
            <span>{isEdit ? 'Save' : 'Publish'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 'var(--shell-content-max)', margin: '0 auto', width: '100%' }}>
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
              paddingRight: '120px', letterSpacing: 'var(--ls-tight)',
            }}
          />
          <button type="button" onClick={handleGenerate} disabled={generating || !form.title.trim()}
            style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
              borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)',
              backgroundColor: generating ? 'var(--color-gold-subtle)' : 'var(--color-gold-subtle)',
              color: 'var(--color-gold)', fontSize: '12px', fontWeight: 600,
              opacity: !form.title.trim() || generating ? 0.5 : 1,
              cursor: !form.title.trim() || generating ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (form.title.trim() && !generating) { e.currentTarget.style.backgroundColor = 'var(--color-gold)'; e.currentTarget.style.color = '#FFF'; }}}
            onMouseLeave={e => { if (form.title.trim() && !generating) { e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'; e.currentTarget.style.color = 'var(--color-gold)'; }}}
          >
            {generating ? <Loader2 size={13} strokeWidth={2} className="spin" /> : <Sparkles size={13} strokeWidth={1.5} />}
            <span>{generating ? 'Generating...' : 'Write with AI'}</span>
          </button>
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
    </div>
  );
}
