import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../auth/useAuth';

export function LoginPage() {
  const { signInStaff } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInStaff(username, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid username or password';
      setError(humanize(message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1 className="page-title">Staff Sign In</h1>
        <p className="page-subtitle">Sign in with your staff account.</p>

        {error ? (
          <Alert variant="error" title="Sign in failed" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="form-grid" style={{ marginTop: '1rem' }}>
          <div className="form-row">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Spinner label="" /> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

function humanize(message: string): string {
  if (/401|invalid|credentials/i.test(message)) {
    return 'Invalid username or password.';
  }
  if (/network|fetch/i.test(message)) {
    return 'Could not reach the server. Please try again.';
  }
  return message;
}
