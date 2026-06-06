import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../auth/useAuth';

export function PortalLoginPage() {
  const { signInRegistrant } = useAuth();
  const navigate = useNavigate();
  const [matriculationNumber, setMatric] = useState('');
  const [departmentCode, setDept] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInRegistrant(matriculationNumber, departmentCode, password);
      navigate('/portal', { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid credentials';
      setError(humanize(message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-card" style={{ maxWidth: 460, margin: '0 auto' }}>
        <h1 className="page-title">Attendee Sign In</h1>
        <p className="page-subtitle">
          Sign in with your matriculation number and department.
        </p>

        {error ? (
          <Alert variant="error" title="Sign in failed" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="form-grid" style={{ marginTop: '1rem' }}>
          <div className="form-row">
            <label htmlFor="matric" className="form-label">Matriculation number</label>
            <input
              id="matric"
              name="matric"
              autoComplete="username"
              required
              className="form-input"
              value={matriculationNumber}
              onChange={(e) => setMatric(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="dept" className="form-label">Department code</label>
            <input
              id="dept"
              name="dept"
              required
              className="form-input"
              placeholder="e.g. CS101"
              value={departmentCode}
              onChange={(e) => setDept(e.target.value.toUpperCase())}
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

        <p style={{ marginTop: '1rem', fontSize: 'var(--font-body-sm-size)' }}>
          New here?{' '}
          <Link to="/register/CS101" style={{ color: 'var(--color-primary)' }}>
            Register for a program
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function humanize(message: string): string {
  if (/401|invalid|credentials/i.test(message)) {
    return 'Invalid credentials. Double-check your matric number, department, and password.';
  }
  if (/verified/i.test(message)) {
    return 'Email not verified yet. Check your inbox for the verification link.';
  }
  if (/network|fetch/i.test(message)) {
    return 'Could not reach the server. Please try again.';
  }
  return message;
}
