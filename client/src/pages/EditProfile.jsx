import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { getUser, updateUser } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function EditProfilePage() {
  const { user: authUser, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ full_name: '', username: '', bio: '', location: '', website: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;
    getUser(authUser.id)
      .then(({ data }) => setForm({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
      }))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [authUser?.id, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateUser(authUser.id, form);
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
