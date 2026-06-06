import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { Alert } from '../../components/Alert';
import {
  deleteDepartment,
  downloadSpreadsheet,
  listDepartments,
  type Department,
} from '../../services/adminApi';

export function DepartmentListPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);

    listDepartments()
      .then(({ data }) => {
        if (mountedRef.current) setDepartments(data.departments ?? []);
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load departments');
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function onDelete(code: string) {
    if (!confirm(`Delete department ${code}? This removes all registrants and attendance records.`)) {
      return;
    }
    try {
      await deleteDepartment(code);
      if (mountedRef.current) {
        setLoading(true);
        listDepartments()
          .then(({ data }) => {
            if (mountedRef.current) setDepartments(data.departments ?? []);
          })
          .catch((err) => {
            if (mountedRef.current) {
              setError(err instanceof Error ? err.message : 'Failed to load departments');
            }
          })
          .finally(() => {
            if (mountedRef.current) setLoading(false);
          });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    }
  }

  async function onDownload(code: string) {
    try {
      const { data } = await downloadSpreadsheet(code);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${code}_attendance.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download spreadsheet');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">All programs in this attendance system.</p>
        </div>
        <div className="page-actions">
          <Link to="/admin/departments/new" className="btn btn-primary">
            New department
          </Link>
        </div>
      </div>

      {error ? <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert> : null}

      {loading ? (
        <Spinner label="Loading departments…" />
      ) : departments.length === 0 ? (
        <div className="page-card">No departments yet. Create one to get started.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.code}>
                <td>
                  <Link to={`/admin/departments/${encodeURIComponent(d.code)}`}>
                    {d.code}
                  </Link>
                </td>
                <td>{d.name}</td>
                <td>{d.duration || '—'}</td>
                <td>
                  <div className="page-actions">
                    <Link
                      to={`/admin/departments/${encodeURIComponent(d.code)}`}
                      className="btn btn-secondary"
                    >
                      View
                    </Link>
                    <Link
                      to={`/admin/departments/${encodeURIComponent(d.code)}/registrants`}
                      className="btn btn-secondary"
                    >
                      Registrants
                    </Link>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => void onDownload(d.code)}
                    >
                      Spreadsheet
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void onDelete(d.code)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
