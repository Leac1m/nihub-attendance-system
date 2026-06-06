import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { Alert } from '../../components/Alert';
import { getRegistrant, type Registrant } from '../../services/adminApi';

export function RegistrantDetailPage() {
  const { code = '', id = '' } = useParams();
  const [registrant, setRegistrant] = useState<Registrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getRegistrant(code, id);
        if (!cancelled) setRegistrant(data.registrant);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load registrant');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (loading) {
    return (
      <div className="page">
        <Spinner label="Loading registrant…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!registrant) {
    return (
      <div className="page">
        <Alert variant="warning">Registrant not found.</Alert>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{registrant.name}</h1>
          <p className="page-subtitle">
            <Link to={`/admin/departments/${encodeURIComponent(code)}`}>{code}</Link>
            {' · '}
            {registrant.matriculation_number}
          </p>
        </div>
      </div>

      <div className="page-card">
        <dl className="form-grid cols-2" style={{ gap: '0.75rem 1.5rem' }}>
          <div>
            <dt className="form-label">Email</dt>
            <dd>{registrant.email}</dd>
          </div>
          <div>
            <dt className="form-label">Phone</dt>
            <dd>{registrant.phone}</dd>
          </div>
          <div>
            <dt className="form-label">Registrant ID</dt>
            <dd>{registrant.id}</dd>
          </div>
        </dl>
      </div>

      <div className="page-card">
        <h2 className="page-title" style={{ fontSize: 'var(--font-headline-md-size)' }}>
          Attendance history
        </h2>
        {registrant.attendance_days && registrant.attendance_days.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Present</th>
              </tr>
            </thead>
            <tbody>
              {registrant.attendance_days.map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{day.present ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No attendance records yet.</p>
        )}
      </div>
    </div>
  );
}
