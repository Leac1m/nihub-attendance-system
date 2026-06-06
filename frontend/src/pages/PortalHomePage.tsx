import { useEffect, useState } from 'react';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../auth/useAuth';
import { apiClient } from '../services/apiClient';
import type { Registrant } from '../services/adminApi';

export function PortalHomePage() {
  const { state } = useAuth();
  const [registrant, setRegistrant] = useState<Registrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (state.kind !== 'registrant') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<{ registrant: Registrant }>(
          `/departments/${encodeURIComponent(state.user.departmentCode)}/registrants/${encodeURIComponent(state.user.registrantId)}`,
        );
        if (!cancelled) setRegistrant(data.registrant);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load your profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (loading) {
    return (
      <div className="page">
        <Spinner label="Loading your profile…" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Your profile</h1>
          <p className="page-subtitle">
            {state.kind === 'registrant' ? state.user.matriculationNumber : ''}
          </p>
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="page-card">
        {registrant ? (
          <dl className="form-grid cols-2" style={{ gap: '0.75rem 1.5rem' }}>
            <div>
              <dt className="form-label">Name</dt>
              <dd>{registrant.name}</dd>
            </div>
            <div>
              <dt className="form-label">Email</dt>
              <dd>{registrant.email}</dd>
            </div>
            <div>
              <dt className="form-label">Phone</dt>
              <dd>{registrant.phone}</dd>
            </div>
            <div>
              <dt className="form-label">Department</dt>
              <dd>
                {state.kind === 'registrant' ? state.user.departmentCode : ''}
              </dd>
            </div>
          </dl>
        ) : (
          <p>No profile data available.</p>
        )}
      </div>

      <div className="page-card">
        <h2 className="page-title" style={{ fontSize: 'var(--font-headline-md-size)' }}>
          Your QR code
        </h2>
        <Alert variant="info">
          Your QR code was emailed to you at registration. We don't yet
          expose a portal-side download for the QR PNG, so please refer
          to your original registration email or contact a staff member
          to retrieve it.
        </Alert>
      </div>
    </div>
  );
}
