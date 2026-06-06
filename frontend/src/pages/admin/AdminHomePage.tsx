import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { useAuth } from '../../auth/useAuth';
import { getWhoami } from '../../services/authApi';
import { listDepartments, type Department } from '../../services/adminApi';

export function AdminHomePage() {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [whoami, setWhoami] = useState<{ username: string; name: string; email: string } | null>(
    null,
  );
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [w, d] = await Promise.all([
          getWhoami().then((r) => r.data).catch(() => null),
          listDepartments().then((r) => r.data.departments).catch(() => []),
        ]);
        if (cancelled) return;
        setWhoami(w);
        setDepartments(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting =
    state.kind === 'staff' ? state.user.name || state.user.username : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin dashboard</h1>
          <p className="page-subtitle">
            {greeting ? `Welcome back, ${greeting}.` : 'Manage programs, registrants, and staff.'}
          </p>
        </div>
      </div>

      {loading ? <Spinner label="Loading dashboard…" /> : null}

      <div className="dashboard-grid">
        <Link to="/admin/departments" className="dashboard-card">
          <span className="label">Departments</span>
          <span className="value">{departments.length}</span>
          <span className="hint">View, create, and manage programs</span>
        </Link>
        <Link to="/admin/staff" className="dashboard-card">
          <span className="label">Staff</span>
          <span className="value">—</span>
          <span className="hint">View staff accounts (coming soon)</span>
        </Link>
        <div className="dashboard-card">
          <span className="label">Your account</span>
          <span className="value" style={{ fontSize: '1rem' }}>
            {whoami ? whoami.username : state.kind === 'staff' ? state.user.username : '—'}
          </span>
          <span className="hint">
            {whoami?.email ?? (state.kind === 'staff' ? state.user.email : '')}
          </span>
        </div>
      </div>
    </div>
  );
}
