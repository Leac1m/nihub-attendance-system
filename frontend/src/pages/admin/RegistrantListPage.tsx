import { Link, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { Alert } from '../../components/Alert';
import { listRegistrants, type Registrant } from '../../services/adminApi';

export function RegistrantListPage() {
  const { code = '' } = useParams();
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);

    listRegistrants(code)
      .then(({ data }) => {
        if (mountedRef.current) setRegistrants(data.registrants ?? []);
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load registrants');
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, [code]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registrants — {code}</h1>
          <p className="page-subtitle">{registrants.length} registered.</p>
        </div>
      </div>

      {error ? <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert> : null}

      {loading ? (
        <Spinner label="Loading registrants…" />
      ) : registrants.length === 0 ? (
        <div className="page-card">No registrants for this department yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Matric</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrants.map((r, idx) => (
              <tr key={r.id}>
                <td>{idx + 1}</td>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.phone}</td>
                <td>{r.matriculation_number}</td>
                <td>
                  <Link
                    to={`/admin/departments/${encodeURIComponent(code)}/registrants/${encodeURIComponent(r.id)}`}
                    className="btn btn-secondary"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
