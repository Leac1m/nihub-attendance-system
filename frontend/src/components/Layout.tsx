import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { LogoutButton } from './LogoutButton';
import './Layout.css';

export function Layout() {
  const { state, currentRole } = useAuth();

  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="layout-brand">
          <span className="layout-brand-mark">N</span>
          <span className="layout-brand-text">NIHUB Attendance</span>
        </Link>

        <nav className="layout-nav" aria-label="Primary">
          {currentRole === 'admin' || currentRole === 'staff' ? (
            <>
              <NavLink to="/admin" end className="layout-nav-link">
                Dashboard
              </NavLink>
              <NavLink to="/admin/departments" className="layout-nav-link">
                Departments
              </NavLink>
              <NavLink to="/admin/staff" className="layout-nav-link">
                Staff
              </NavLink>
            </>
          ) : null}
          {currentRole === 'registrant' ? (
            <>
              <NavLink to="/portal" end className="layout-nav-link">
                Profile
              </NavLink>
              <NavLink to="/portal/attendance" className="layout-nav-link">
                Attendance
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="layout-user">
          {state.kind === 'staff' ? (
            <span className="layout-user-chip" title={state.user.email}>
              {state.user.name || state.user.username}
              {state.user.isAdmin ? <span className="layout-badge">Admin</span> : null}
            </span>
          ) : state.kind === 'registrant' ? (
            <span className="layout-user-chip" title={state.user.matriculationNumber}>
              {state.user.matriculationNumber}
              <span className="layout-badge">{state.user.departmentCode}</span>
            </span>
          ) : null}
          <LogoutButton />
        </div>
      </header>

      <main className="layout-main">
        <Outlet />
      </main>

      <footer className="layout-footer">
        <small>Powered by NIHUB</small>
      </footer>
    </div>
  );
}
