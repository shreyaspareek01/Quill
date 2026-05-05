import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { getPost, updatePost, createPost } from '../api/posts';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
import './PostForm.css';

export default function PostFormPage() {
  const { id }     = useParams();
  const isEdit     = Boolean(id);
  const navigate   = useNavigate();
  const toast      = useToast();

  const [form, setForm]       = useState({ title: '', content: '', published: true });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await getPost(id);
        const { title, content, published } = data.Post;
        setForm({ title, content, published });
      } catch {
        toast.error('Could not load post.');
        navigate('/feed');
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.content.trim()) errs.content = 'Content is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await updatePost(id, { title: form.title, content: form.content, published: form.published });
        toast.success('Post updated!');
        navigate(`/posts/${id}`);
      } else {
        const { data } = await createPost({ title: form.title, content: form.content, published: form.published });
        toast.success('Post published!');
        navigate(`/posts/${data.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="page-content">
          <div className="page-container">
            <div className="post-form-wrap">
              <Link to={isEdit ? `/posts/${id}` : '/feed'} className="post-detail__back">
                <ArrowLeft size={15} strokeWidth={2} />
                {isEdit ? 'Back to post' : 'Back to feed'}
              </Link>

              <div className="post-form__header">
                <span className="label" style={{ color: 'var(--accent)' }}>
                  {isEdit ? 'Editing post' : 'New post'}
                </span>
                <h2 className="post-form__title">
                  {isEdit ? 'Update your writing' : 'What would you like to share?'}
                </h2>
                <span className="gold-line" />
              </div>

              {fetching ? (
                <div className="post-form__loading">
                  <div className="skeleton" style={{ height: '3rem', width: '100%' }} />
                  <div className="skeleton" style={{ height: '12rem', width: '100%', marginTop: '1rem' }} />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="post-form">
                  <div className="input-group">
                    <label className="input-label" htmlFor="post-title">Title</label>
                    <input
                      id="post-title"
                      name="title"
                      type="text"
                      className={`input post-form__title-input ${errors.title ? 'error' : ''}`}
                      placeholder="Give your post a compelling title…"
                      value={form.title}
                      onChange={handleChange}
                    />
                    {errors.title && <p className="error-msg">{errors.title}</p>}
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="post-content">
                      Content
                      <span className="post-form__char-count">{form.content.length} chars</span>
                    </label>
                    <textarea
                      id="post-content"
                      name="content"
                      className={`input post-form__textarea ${errors.content ? 'error' : ''}`}
                      placeholder="Write something worth reading…"
                      value={form.content}
                      onChange={handleChange}
                      rows={10}
                    />
                    {errors.content && <p className="error-msg">{errors.content}</p>}
                  </div>

                  <div className="post-form__footer">
                    <label className="toggle-wrapper post-form__publish-toggle">
                      <span className="input-label" style={{ marginBottom: 0 }}>
                        {form.published ? 'Published' : 'Draft'}
                      </span>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          name="published"
                          checked={form.published}
                          onChange={handleChange}
                          id="post-published"
                        />
                        <span className="toggle-slider" />
                      </label>
                    </label>

                    <button
                      id="post-form-submit"
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? <span className="auth-spinner" /> : (
                        <>
                          <Save size={15} strokeWidth={2} />
                          {isEdit ? 'Save changes' : 'Publish post'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
