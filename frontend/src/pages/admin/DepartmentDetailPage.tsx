import { Link, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { Alert } from '../../components/Alert';
import { listRegistrants, type Registrant } from '../../services/adminApi';
import { apiClient } from '../../services/apiClient';
import type { Department } from '../../services/adminApi';

export function DepartmentDetailPage() {
  const { code = '' } = useParams();
  const [department, setDepartment] = useState<Department | null>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);

    Promise.all([
      apiClient.get<{ departments: Department[] }>('/departments'),
      listRegistrants(code),
    ])
      .then(([{ data: deptList }, { data: regData }]) => {
        if (mountedRef.current) {
          const dept = (deptList.departments ?? []).find((d) => d.code === code) ?? null;
          setDepartment(dept);
          setRegistrants(regData.registrants ?? []);
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load department');
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
          <h1 className="page-title">{department?.name ?? code}</h1>
          <p className="page-subtitle">
            Code <strong>{code}</strong>
            {department?.duration ? ` · ${department.duration}` : ''}
          </p>
        </div>
        <div className="page-actions">
          <Link
            to={`/admin/departments/${encodeURIComponent(code)}/registrants`}
            className="btn btn-primary"
          >
            View all registrants
          </Link>
        </div>
      </div>

      {error ? <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert> : null}

      {loading ? (
        <Spinner label="Loading department…" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Matric</th>
            </tr>
          </thead>
          <tbody>
            {registrants.length === 0 ? (
              <tr>
                <td colSpan={5} className="data-table-empty">
                  No registrants yet.
                </td>
              </tr>
            ) : (
              registrants.slice(0, 10).map((r, idx) => (
                <tr key={r.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <Link
                      to={`/admin/departments/${encodeURIComponent(code)}/registrants/${encodeURIComponent(r.id)}`}
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  <td>{r.matriculation_number}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
