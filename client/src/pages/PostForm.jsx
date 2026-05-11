import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { getPost, updatePost, createPost } from '../api/posts';
import { uploadPostImage } from '../api/uploads';
import { useToast } from '../context/ToastContext';
import './PostForm.css';

export default function PostFormPage() {
  const { id }     = useParams();
  const isEdit     = Boolean(id);
  const navigate   = useNavigate();
  const toast      = useToast();

  const [form, setForm]       = useState({ title: '', content: '', image_url: '', published: true });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await getPost(id);
        const { title, content, image_url, published } = data.Post;
        setForm({ title, content, image_url: image_url || '', published });
      } catch {
        toast.error('Could not load post.');
        navigate('/feed');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate, toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { data } = await uploadPostImage(file);
      setForm(prev => ({ ...prev, image_url: data.image_url || '' }));
      toast.success('Image uploaded.');
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Required';
    if (!form.content.trim()) errs.content = 'Required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await updatePost(id, { ...form, image_url: form.image_url || null });
        toast.success('Updated.');
        navigate(`/posts/${id}`);
      } else {
        const { data } = await createPost({ ...form, image_url: form.image_url || null });
        toast.success('Published.');
        navigate(`/posts/${data.id}`);
      }
    } catch {
      toast.error('Action failed.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="skeleton" style={{ height: '400px' }} />;

  return (
    <div className="editor-page fade-in">
      <header className="editor-header">
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <div className="ml-auto flex items-center gap-24">
          <span className="text-label italic">
            {form.content.split(/\s+/).filter(x => x).length} words
          </span>
          <button 
            onClick={handleSubmit} 
            className="btn btn-primary btn-sm"
            disabled={loading || uploadingImage}
          >
            <Save size={14} />
            <span>{isEdit ? 'Save' : 'Publish'}</span>
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="editor-cover">
          {form.image_url ? (
            <div className="editor-cover__preview">
              <img src={form.image_url} alt="" />
              <button 
                type="button" 
                className="btn btn-gold btn-sm editor-cover__change"
                onClick={() => document.getElementById('cover-upload').click()}
              >
                Change Cover
              </button>
            </div>
          ) : (
            <button 
              type="button"
              className="editor-cover__placeholder"
              onClick={() => document.getElementById('cover-upload').click()}
            >
              <ImageIcon size={24} strokeWidth={1} />
              <span>Add a cover image</span>
            </button>
          )}
          <input 
            id="cover-upload"
            type="file" 
            hidden 
            onChange={handleImageSelect}
          />
        </div>

        <input
          name="title"
          className="editor-title-input font-serif"
          placeholder="A Compelling Title..."
          value={form.title}
          onChange={handleChange}
          autoFocus
        />

        <textarea
          name="content"
          className="editor-textarea"
          placeholder="Every great idea starts as a sentence..."
          value={form.content}
          onChange={handleChange}
        />
      </form>
    </div>
  );
}
