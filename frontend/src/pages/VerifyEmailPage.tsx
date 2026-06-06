import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../auth/useAuth';
import { logger } from '../services/logger';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { ingestLoginResponse } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('Verification token missing from URL.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { default: axios } = await import('axios');
        const { data } = await axios.post('/api/auth/registrants/verify', { token });
        if (cancelled) return;
        ingestLoginResponse(data);
        setSuccess('Email verified. Taking you to your portal…');
        setTimeout(() => navigate('/portal', { replace: true }), 600);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Verification failed';
        logger.warn('verify_email.failed', { error: message });
        setError(humanize(message));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, navigate, ingestLoginResponse]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="page">
      <div className="page-card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 className="page-title">Verify your email</h1>
        {!error && !success ? <Spinner label="Verifying…" /> : null}
        {success ? <Alert variant="success" title="Email verified">{success}</Alert> : null}
        {error ? (
          <Alert variant="error" title="Verification failed">
            {error}
          </Alert>
        ) : null}
      </div>
    </div>
  );
}

function humanize(message: string): string {
  if (/expired|invalid/i.test(message)) {
    return 'This verification link is invalid or has expired. Please request a new one by re-submitting the registration form.';
  }
  return message;
}
