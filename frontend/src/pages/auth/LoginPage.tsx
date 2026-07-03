import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell, AuthLink } from './AuthShell';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { toast } from '../../components/ui/Toast';
import { api, type AuthResponse, ApiClientError } from '../../api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const { isOpen } = useSessionStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const auth = await api<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setSession(auth);
      toast.success(`Welcome back, ${auth.name.split(' ')[0]}.`);
      navigate(auth.role === 'ADMIN' ? '/admin/dashboard' : isOpen ? '/pos' : '/pos/session');
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell sideLabel="Sign in">
      <form onSubmit={submit} className="w-full max-w-sm">
        <h1 className="font-display font-light italic text-[40px] leading-none text-text mb-2">
          Sign <span className="text-gold">in</span>
        </h1>
        <p className="text-[15px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-8">
          Café Étoile staff access
        </p>
        <Input
          label="Email / Username"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@cafeetoile.test"
          autoComplete="username"
        />
        <div className="mt-5">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p className="mt-4 text-[16px] font-light text-cancel">{error}</p>
        )}
        <div className="mt-8">
          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Login'}
          </Button>
        </div>
        <AuthLink to="/signup" label="Sign Up here" prefix="New here?" />
      </form>
    </AuthShell>
  );
}
