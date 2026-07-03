import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell, AuthLink } from './AuthShell';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../components/ui/Toast';
import { api, ApiClientError, type AuthResponse } from '../../api/client';

export function SignupPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes('@') || password.length < 8) {
      setError('Enter a name, valid email, and an 8+ character password.');
      return;
    }
    setSubmitting(true);
    try {
      const auth = await api<AuthResponse>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role: 'ADMIN' }),
      });
      setSession(auth);
      toast.success('Account created.');
      navigate('/admin/dashboard');
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell sideLabel="Create account">
      <form onSubmit={submit} className="w-full max-w-sm">
        <h1 className="font-display font-light italic text-[40px] leading-none text-text mb-2">
          Create <span className="text-gold">account</span>
        </h1>
        <p className="text-[15px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-8">
          Register as an owner / manager
        </p>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Amara Singh"
          autoComplete="name"
        />
        <div className="mt-5">
          <Input
            label="Email / Username"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@cafeetoile.test"
            autoComplete="email"
          />
        </div>
        <div className="mt-5">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="mt-4 text-[16px] font-light text-cancel">{error}</p>
        )}
        <div className="mt-8">
          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? 'Creating…' : 'Sign Up'}
          </Button>
        </div>
        <AuthLink to="/login" label="Login" prefix="Already have an account?" />
      </form>
    </AuthShell>
  );
}
