import { useEffect, useState } from 'react';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../auth/useAuth';
import { apiClient } from '../services/apiClient';
import type { Registrant } from '../services/adminApi';

export function PortalAttendancePage() {
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
          setError(err instanceof Error ? err.message : 'Failed to load attendance');
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
        <Spinner label="Loading attendance…" />
      </div>
    );
  }

  const days = registrant?.attendance_days ?? [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Your attendance</h1>
          <p className="page-subtitle">
            {days.length} {days.length === 1 ? 'session' : 'sessions'} recorded.
          </p>
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {days.length === 0 ? (
        <div className="page-card">No attendance recorded yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <td>{day.date}</td>
                <td>{day.present ? 'Present' : 'Absent'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
