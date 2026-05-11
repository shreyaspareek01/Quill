import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Feather, Globe, Code } from "lucide-react";
import { registerUser } from "../api/auth";
import { useToast } from "../context/ToastContext";
import "./AuthPage.css";

export default function RegisterPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser({ email: form.email, password: form.password });
      toast.success("Welcome to Quill.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout fade-in">
      <div className="auth-split__left">
        <Link to="/" className="auth-split__logo">
          <Feather size={28} strokeWidth={1.5} color="var(--color-gold)" />
          <span>Quill</span>
        </Link>
        <div className="auth-split__quote-wrap">
          <blockquote className="auth-split__quote">
            "A writer is a world <br />trapped in a person."
          </blockquote>
          <cite className="auth-split__cite">— Victor Hugo</cite>
        </div>
        <div className="auth-split__texture" />
      </div>

      <div className="auth-split__right">
        <div className="auth-split__form-container">
          <header className="auth-split__header">
            <h1 className="auth-split__title">Join Quill</h1>
            <p className="auth-split__subtitle">Begin your journey in a refined space for thought.</p>
          </header>

          <div className="auth-social-buttons">
            <button className="auth-social-btn">
              <Globe size={18} strokeWidth={1.2} />
              <span>Continue with Google</span>
            </button>
            <button className="auth-social-btn">
              <Code size={18} strokeWidth={1.2} />
              <span>Continue with Github</span>
            </button>
          </div>

          <div className="auth-divider">
            <span className="text-label">or</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-split__form">
            <div className="auth-input-field">
              <label>Full Name</label>
              <input
                name="fullName"
                type="text"
                className="auth-input"
                placeholder="Joan Didion"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-input-field">
              <label>Email address</label>
              <input
                name="email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-input-field">
              <label>Password</label>
              <input
                name="password"
                type="password"
                className="auth-input"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <p className="text-caption" style={{ color: 'var(--color-destructive)' }}>{error}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 'var(--space-12)' }}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="text-caption" style={{ textAlign: 'center' }}>
            Already on Quill? <Link to="/login" className="link-gold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
