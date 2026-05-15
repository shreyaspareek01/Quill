import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Camera } from 'lucide-react';
import { getUser, updateUser } from '../api/users';
import { uploadAvatar, uploadCover } from '../api/uploads';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function EditProfilePage() {
  const { user: authUser, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ full_name: '', username: '', bio: '', location: '', website: '', avatar_url: '', cover_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;
    getUser(authUser.id)
      .then(({ data }) => setForm({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        avatar_url: data.avatar_url || '',
        cover_url: data.cover_url || '',
      }))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [authUser?.id, toast]);

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { data } = await uploadAvatar(file);
      setForm(p => ({ ...p, avatar_url: data.url }));
      toast.success('Avatar uploaded');
    } catch { toast.error('Avatar upload failed'); }
    finally { setUploadingAvatar(false); }
  };

  const handleCoverSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { data } = await uploadCover(file);
      setForm(p => ({ ...p, cover_url: data.url }));
      toast.success('Cover image uploaded');
    } catch { toast.error('Cover upload failed'); }
    finally { setUploadingCover(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.avatar_url) delete payload.avatar_url;
      if (!payload.cover_url) delete payload.cover_url;
      const { data } = await updateUser(authUser.id, payload);
      login(localStorage.getItem('quill_token'), data);
      toast.success('Profile updated');
      navigate(`/profile/${authUser.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-md)' }} />;

  return (
    <div className="fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon"><ArrowLeft size={20} strokeWidth={1.5} /></button>
        <h1 className="font-serif" style={{ fontSize: '24px', fontWeight: 700 }}>Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Cover Image</label>
          <div
            onClick={() => document.getElementById('cover-upload').click()}
            style={{
              height: '140px', borderRadius: 'var(--radius-md)', cursor: 'pointer', overflow: 'hidden',
              background: form.cover_url ? `url(${form.cover_url}) center/cover` : 'linear-gradient(135deg, var(--color-gold-subtle) 0%, var(--color-border) 100%)',
              border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity var(--duration-fast)',
            }}
          >
            {uploadingCover ? (
              <Loader2 size={24} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
                <Camera size={20} strokeWidth={1.5} color="#FFF" />
                <span style={{ fontSize: '12px', color: '#FFF' }}>{form.cover_url ? 'Change cover' : 'Add cover'}</span>
              </div>
            )}
          </div>
          <input id="cover-upload" type="file" hidden accept="image/*" onChange={handleCoverSelect} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => document.getElementById('avatar-upload').click()}
            style={{
              position: 'relative', width: '80px', height: '80px', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
              background: form.avatar_url ? `url(${form.avatar_url}) center/cover` : undefined,
              backgroundColor: form.avatar_url ? undefined : 'var(--color-border)',
              border: '2px solid var(--color-border)',
            }}
          >
            {uploadingAvatar ? (
              <Loader2 size={20} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} />
            ) : form.avatar_url ? (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity var(--duration-fast)' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                <Camera size={18} strokeWidth={1.5} color="#FFF" />
              </div>
            ) : null}
          </div>
          <input id="avatar-upload" type="file" hidden accept="image/*" onChange={handleAvatarSelect} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{(form.full_name || form.username || authUser?.email || 'User').split('@')[0]}</div>
            <div className="text-caption" style={{ fontSize: '12px', marginTop: '2px' }}>Upload a profile photo</div>
          </div>
        </div>

        <div>
          <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Display Name</label>
          <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '15px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
        </div>
        <div>
          <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Username</label>
          <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '15px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
        </div>
        <div>
          <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Bio</label>
          <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', resize: 'vertical' }} />
        </div>
        <div>
          <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Location</label>
          <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Country"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '15px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
        </div>
        <div>
          <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Website</label>
          <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '15px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
          {saving ? <Loader2 size={16} strokeWidth={2} /> : <Save size={16} strokeWidth={1.5} />}
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
}
